subroutine pentadiagonal(A,B,C,D,E,R,n,lot,dir,s1,s2)
  use precision
  use parallel
  implicit none

  ! Direction
  character(len=*), intent(in) :: dir
  ! Size of the problems
  integer, intent(in) :: n
  ! Number of problems
  integer, intent(in) :: lot
  ! Matrix
  real(WP), dimension(lot,n) :: A     ! LOWER-2
  real(WP), dimension(lot,n) :: B     ! LOWER-1
  real(WP), dimension(lot,n) :: C     ! DIAGONAL
  real(WP), dimension(lot,n) :: D     ! UPPER+1
  real(WP), dimension(lot,n) :: E     ! UPPER+2
  real(WP), dimension(lot,n) :: R     ! RHS - RESULT
  ! Local
  real(WP), dimension(lot)     :: const
  real(WP), dimension(lot,2)   :: r1
  real(WP), dimension(lot,2)   :: r2
  real(WP), dimension(lot,n,2) :: s1
  real(WP), dimension(lot,n,2) :: s2
  ! Communication
  integer :: proc,rank,ncom,nper
  integer :: nremain,nlot
  real(WP), dimension(:,:),   allocatable :: sendbuf
  real(WP), dimension(:,:),   allocatable :: recvbuf
  integer,  dimension(:),     allocatable :: ngroup
  real(WP), dimension(:,:,:), allocatable :: AA
  real(WP), dimension(:,:),   allocatable :: swap
  ! Stuff
  integer :: i,igroup,j,k,m
  integer :: k1,L,k2,nk
  integer :: ierr
  
  ! Get parallel info
  select case (trim(adjustl(dir)))
  case ('x')
     proc = npx
     rank = irank_x
     ncom = comm_x
     nper = periodicity(1)
  case ('y')
     proc = npy
     rank = irank_y
     ncom = comm_y
     nper = periodicity(2)
  case ('z')
     proc = npz
     rank = irank_z
     ncom = comm_z
     nper = periodicity(3)
  case default
     stop 'Unknown direction'
  end select

  ! If serial
  if (proc .eq. 1) then
     if (nper.eq.0) then
        call pentadiagonal_serial(A,B,C,D,E,R,n,lot)
     else
        call pentadiagonal_periodic_serial(A,B,C,D,E,R,n,lot,s1,s2)
     end if
     return
  end if

  ! Partition the lot
  if (lot .lt. proc) stop 'Pentadiagonal solver cannot handle so many proc for such a small problem.'
  allocate(ngroup(proc))
  ngroup(:) = lot/proc
  nremain = mod(lot,proc)
  ngroup(1:nremain) = ngroup(1:nremain) + 1
  nlot = ngroup(1)
  allocate(sendbuf(nlot,24*proc))
  allocate(recvbuf(nlot,24*proc))

  if (n > 1) then ! do normal stuff

     ! Initialize boundary values
     s1(:,1,1) = a(:,1)
     s1(:,1,2) = b(:,1)
     s1(:,2,1) = 0.0_WP
     s1(:,2,2) = a(:,2)
     s2(:,n-1,1) = e(:,n-1)
     s2(:,n-1,2) = 0.0_WP
     s2(:,n,1) = d(:,n)
     s2(:,n,2) = e(:,n)
     if (nper .eq. 0) then
        if (rank .eq. 0)      s1(:,1:2,1:2)   = 0.0_WP
        if (rank .eq. proc-1) s2(:,n-1:n,1:2) = 0.0_WP
     end if

     ! Forward elimination
     ! Upper boundary in s1(:,i,1:2)
     do i=1,n-2
        ! Eliminate a(i+2)
        const(:) = a(:,i+2)/c(:,i)
        b(:,i+2) = b(:,i+2) - d(:,i)*const(:)
        c(:,i+2) = c(:,i+2) - e(:,i)*const(:)
        r(:,i+2) = r(:,i+2) - r(:,i)*const(:)
        s1(:,i+2,1) = -s1(:,i,1)*const(:)
        s1(:,i+2,2) = -s1(:,i,2)*const(:)

        ! Eliminate b(i+1)
        const(:) = b(:,i+1)/c(:,i)
        c(:,i+1) = c(:,i+1) - d(:,i)*const(:)
        d(:,i+1) = d(:,i+1) - e(:,i)*const(:)
        r(:,i+1) = r(:,i+1) - r(:,i)*const(:)
        s1(:,i+1,1) = s1(:,i+1,1) - s1(:,i,1)*const(:)
        s1(:,i+1,2) = s1(:,i+1,2) - s1(:,i,2)*const(:)
     end do
     ! Eliminate b(n)
     const(:) = b(:,n)/c(:,n-1)
     c(:,n) = c(:,n) - d(:,n-1)*const(:)
     r(:,n) = r(:,n) - r(:,n-1)*const(:)
     s1(:,n,1) = s1(:,n,1) - s1(:,n-1,1)*const(:)
     s1(:,n,2) = s1(:,n,2) - s1(:,n-1,2)*const(:)
     s2(:,n,1) = s2(:,n,1) - s2(:,n-1,1)*const(:)

     ! Backward elimination
     ! Lower boundary in s2(:,i,1:2)
     do i=n,3,-1
        ! Eliminate e(i-2)
        const(:) = e(:,i-2)/c(:,i)
        r(:,i-2) = r(:,i-2) - r(:,i)*const(:)
        s1(:,i-2,1) = s1(:,i-2,1) - s1(:,i,1)*const(:)
        s1(:,i-2,2) = s1(:,i-2,2) - s1(:,i,2)*const(:)
        s2(:,i-2,1) = -s2(:,i,1)*const(:)
        s2(:,i-2,2) = -s2(:,i,2)*const(:)

        ! Eliminate d(i-1)
        const(:) = d(:,i-1)/c(:,i)
        r(:,i-1) = r(:,i-1) - r(:,i)*const(:)
        s1(:,i-1,1) = s1(:,i-1,1) - s1(:,i,1)*const(:)
        s1(:,i-1,2) = s1(:,i-1,2) - s1(:,i,2)*const(:)
        s2(:,i-1,1) = s2(:,i-1,1) - s2(:,i,1)*const(:)
        s2(:,i-1,2) = s2(:,i-1,2) - s2(:,i,2)*const(:)
     end do
     ! Eliminate d(1)
     const(:) = d(:,1)/c(:,2)
     r(:,1) = r(:,1) - r(:,2)*const(:)
     s1(:,1,1) = s1(:,1,1) - s1(:,2,1)*const(:)
     s1(:,1,2) = s1(:,1,2) - s1(:,2,2)*const(:)
     s2(:,1,1) = s2(:,1,1) - s2(:,2,1)*const(:)
     s2(:,1,2) = s2(:,1,2) - s2(:,2,2)*const(:)

  end if ! n > 1

  ! All dependence has been shifted to the boundary elements
  ! Communicate boundary values to root process
  ! and solve reduced 11-diagonal system
  ! Use of 11-diagonal system is more robust than the
  ! reordered (removes zeros) 7-diagonal system

  ! Send rows of 11-diagonal system
  ! (0, 0, 0, a, b, c, 0, 0, 0, d, e; r)
  !    (0, 0, a, b, 0, c, 0, 0, d, e, 0; r)
  !       (0, a, b, 0, 0, c, 0, d, e, 0, 0; r)
  !          (a, b, 0, 0, 0, c, d, e, 0, 0, 0; r)
  ! For efficiency, only send non-zero elements

  L = 1
  k1 = 1
  do igroup=1,proc
     k2 = k1+ngroup(igroup)-1
     nk = k2-k1+1

     if (n > 1) then ! do normal stuff

        do i=1,2
           sendbuf(1:nk, L+0) = c(k1:k2, i)
           sendbuf(1:nk, L+1) = r(k1:k2, i)
           sendbuf(1:nk, L+2) = c(k1:k2, n-2+i)
           sendbuf(1:nk, L+3) = r(k1:k2, n-2+i)
           L = L + 4
        end do
        do i=1,2
           do j=1,2
              sendbuf(1:nk, L+0) = s1(k1:k2, i,j)
              sendbuf(1:nk, L+1) = s2(k1:k2, i,j)
              sendbuf(1:nk, L+2) = s1(k1:k2, n-2+i,j)
              sendbuf(1:nk, L+3) = s2(k1:k2, n-2+i,j)
              L = L + 4
           end do
        end do

     else ! n == 1 special case

        sendbuf(1:nk, L+0) = c(k1:k2, 1)
        sendbuf(1:nk, L+1) = r(k1:k2, 1)
        sendbuf(1:nk, L+2) = 1.0_WP
        sendbuf(1:nk, L+3) = 0.0_WP
        sendbuf(1:nk, L+4) = 1.0_WP
        sendbuf(1:nk, L+5) = 0.0_WP
        sendbuf(1:nk, L+6) = c(k1:k2, 1)
        sendbuf(1:nk, L+7) = r(k1:k2, 1)
        sendbuf(1:nk, L+8) = a(k1:k2, 1)
        sendbuf(1:nk, L+9) = d(k1:k2, 1)
        sendbuf(1:nk, L+10) = 0.0_WP
        sendbuf(1:nk, L+11) = 0.0_WP
        sendbuf(1:nk, L+12) = b(k1:k2, 1)
        sendbuf(1:nk, L+13) = e(k1:k2, 1)
        sendbuf(1:nk, L+14) = -1.0_WP
        sendbuf(1:nk, L+15) = 0.0_WP
        sendbuf(1:nk, L+16) = 0.0_WP
        sendbuf(1:nk, L+17) = -1.0_WP
        sendbuf(1:nk, L+18) = a(k1:k2, 1)
        sendbuf(1:nk, L+19) = d(k1:k2, 1)
        sendbuf(1:nk, L+20) = 0.0_WP
        sendbuf(1:nk, L+21) = 0.0_WP
        sendbuf(1:nk, L+22) = b(k1:k2, 1)
        sendbuf(1:nk, L+23) = e(k1:k2, 1)
        L = L + 24

     end if

     k1 = k2 + 1
  end do

  ! Gather the boundary data
  call MPI_AllToAll (sendbuf,nlot*24,MPI_REAL_WP,recvbuf,nlot*24,MPI_REAL_WP,ncom,ierr)
  
  ! Build reduced matrix
  allocate(AA(nlot, 4*proc, -5:5 + 1))
  AA = 0.0_WP
  L = 1
  do k=1,proc
     m = 4*(k-1)
     
     do i=1,2
        AA(:, m+i  , 0) = recvbuf(:, L+0)    ! c(i)
        AA(:, m+i  , 6) = recvbuf(:, L+1)    ! r(i)
        AA(:, m+i+2, 0) = recvbuf(:, L+2)    ! c(n-2+i)
        AA(:, m+i+2, 6) = recvbuf(:, L+3)    ! r(n-2+i)
        L = L + 4
     end do
     do i=1,2
        do j=1,2
           AA(:, m+i,   -2+j-i) = recvbuf(:, L+0)    ! s1(i,j)
           AA(:, m+i,    4+j-i) = recvbuf(:, L+1)    ! s2(i,j)
           AA(:, m+i+2, -4+j-i) = recvbuf(:, L+2)    ! s1(n-2+i,j)
           AA(:, m+i+2,  2+j-i) = recvbuf(:, L+3)    ! s2(n-2+i,j)
           L = L + 4
        end do
     end do
     
  end do
  
  ! Clear unused values
  nk = ngroup(rank+1)
  AA(nk+1:nlot, :, :) = 0.0_WP
  AA(nk+1:nlot, :, 0) = 1.0_WP
  
  ! Solve reduced systems
  if (nper .eq.0) then
     call polydiagonal_serial(5, AA(:,3:4*proc-2,-5:+5), AA(:,3:4*proc-2,6), (2*proc-2)*2, nlot)
  else
     call polydiagonal_periodic_serial(5, AA(:,:,-5:+5), AA(:,:,6), (2*proc)*2, nlot, sendbuf)
  end if
  
  ! Move solution to beginning of recvbuf
  recvbuf(:, 1:4*proc) = AA(:, :, 6)
  deallocate(AA)
  
  ! Permute the order
  allocate (swap(nlot,2))
  do i=1,proc-1
     swap(:,:) = recvbuf(:, 4*i-1:4*i)
     recvbuf(:, 4*i-1:4*i) = recvbuf(:, 4*i+1:4*i+2)
     recvbuf(:, 4*i+1:4*i+2) = swap(:,:)
  end do
  ! If periodic, don't forget the end points
  if (nper .eq. 1) then
     swap(:,:) = recvbuf(:, 4*proc-1:4*proc)
     recvbuf(:, 4*proc-1:4*proc) = recvbuf(:, 1:2)
     recvbuf(:, 1:2) = swap(:,:)
  end if
  deallocate (swap)

  ! Scatter back the solution
  deallocate(sendbuf); allocate(sendbuf(nlot,4*proc))
  call MPI_AllToAll(recvbuf,nlot*4,MPI_REAL_WP,sendbuf,nlot*4,MPI_REAL_WP,ncom,ierr)
  
  L = 1
  k1 = 1
  do igroup=1,proc
     k2 = k1+ngroup(igroup)-1
     nk = k2-k1+1

     r1(k1:k2, :) = sendbuf(1:nk, L+0:L+1)
     r2(k1:k2, :) = sendbuf(1:nk, L+2:L+3)
     L = L + 4

     k1 = k2 + 1
  end do

  ! Only if not periodic
  if (nper .eq. 0) then
     if (rank .eq. 0)      r1 = 0.0_WP
     if (rank .eq. proc-1) r2 = 0.0_WP
  end if

  if (n > 1) then ! do normal stuff

     do j=1,2
        do i=1,n
           r(:,i) = r(:,i) - s1(:,i,j)*r1(:,j) - s2(:,i,j)*r2(:,j)
        end do
     end do
     r = r / c

  else ! n == 1 special case

     r(:,1) = ( r(:,1) - a(:,1)*r1(:,1) - b(:,1)*r1(:,2) &
          -d(:,1)*r2(:,1) - e(:,1)*r2(:,2) )/c(:,1)

  end if

  deallocate(sendbuf)
  deallocate(recvbuf)
  deallocate(ngroup)

  return
end subroutine pentadiagonal


subroutine pentadiagonal_cuda(A,B,C,D,E,R,n,lot,dir,s1,s2)
  use precision
  use parallel
  use cudafor
  implicit none

  ! Direction
  character(len=*), intent(in) :: dir
  ! Size of the problems
  integer, intent(in) :: n
  ! Number of problems
  integer, intent(in) :: lot
  ! Matrix
  real(WP), device, intent(inout), dimension(lot,n) :: A     ! LOWER-2
  real(WP), device, intent(inout), dimension(lot,n) :: B     ! LOWER-1
  real(WP), device, intent(inout), dimension(lot,n) :: C     ! DIAGONAL
  real(WP), device, intent(inout), dimension(lot,n) :: D     ! UPPER+1
  real(WP), device, intent(inout), dimension(lot,n) :: E     ! UPPER+2
  real(WP), device, intent(inout), dimension(lot,n) :: R     ! RHS - RESULT
  ! Local
  real(WP), device, intent(inout), dimension(lot,n,2) :: s1
  real(WP), device, intent(inout), dimension(lot,n,2) :: s2
  real(WP) :: const_l
  real(WP), dimension(:,:),   allocatable :: c_head_h
  real(WP), dimension(:,:),   allocatable :: c_tail_h
  real(WP), dimension(:,:),   allocatable :: r_head_h
  real(WP), dimension(:,:),   allocatable :: r_tail_h
  real(WP), dimension(:,:,:), allocatable :: s1_head_h
  real(WP), dimension(:,:,:), allocatable :: s1_tail_h
  real(WP), dimension(:,:,:), allocatable :: s2_head_h
  real(WP), dimension(:,:,:), allocatable :: s2_tail_h
  real(WP), dimension(:,:),   allocatable :: line_h
  real(WP), dimension(:,:),   allocatable :: r1_h
  real(WP), dimension(:,:),   allocatable :: r2_h
  real(WP), device, dimension(:,:), allocatable :: r1_d
  real(WP), device, dimension(:,:), allocatable :: r2_d
  ! Communication
  integer :: proc,rank,ncom,nper
  integer :: nremain,nlot
  real(WP), dimension(:,:),   allocatable :: sendbuf_h
  real(WP), dimension(:,:),   allocatable :: recvbuf_h
  integer,  dimension(:),     allocatable :: ngroup
  real(WP), dimension(:,:,:), allocatable :: AA_h
  real(WP), dimension(:,:),   allocatable :: swap_h
  ! Stuff
  integer :: i,igroup,j,k,m
  integer :: k1,L,k2,nk
  integer :: ierr,ll
  
  ! Get parallel info
  select case (trim(adjustl(dir)))
  case ('x')
     proc = npx
     rank = irank_x
     ncom = comm_x
     nper = periodicity(1)
  case ('y')
     proc = npy
     rank = irank_y
     ncom = comm_y
     nper = periodicity(2)
  case ('z')
     proc = npz
     rank = irank_z
     ncom = comm_z
     nper = periodicity(3)
  case default
     stop 'Unknown direction'
  end select

  ! If serial
  if (proc .eq. 1) then
     if (nper.eq.0) then
        call pentadiagonal_serial_cuda(A,B,C,D,E,R,n,lot)
     else
        call pentadiagonal_periodic_serial_cuda(A,B,C,D,E,R,n,lot,s1(:,:,1),s2(:,:,1))
     end if
     return
  end if

  ! Partition the lot
  if (lot .lt. proc) stop 'Pentadiagonal solver cannot handle so many proc for such a small problem.'
  allocate(ngroup(proc))
  ngroup(:) = lot/proc
  nremain = mod(lot,proc)
  ngroup(1:nremain) = ngroup(1:nremain) + 1
  nlot = ngroup(1)
  allocate(sendbuf_h(nlot,24*proc))
  allocate(recvbuf_h(nlot,24*proc))
  allocate(r1_h(lot,2))
  allocate(r2_h(lot,2))

  if (n > 1) then
     allocate(c_head_h(lot,2))
     allocate(c_tail_h(lot,2))
     allocate(r_head_h(lot,2))
     allocate(r_tail_h(lot,2))
     allocate(s1_head_h(lot,2,2))
     allocate(s1_tail_h(lot,2,2))
     allocate(s2_head_h(lot,2,2))
     allocate(s2_tail_h(lot,2,2))

     ! Initialize boundary values
     !$cuf kernel do <<<*, *>>>
     do ll=1,lot
        s1(ll,1,1) = A(ll,1)
        s1(ll,1,2) = B(ll,1)
        s1(ll,2,1) = 0.0_WP
        s1(ll,2,2) = A(ll,2)
        s2(ll,n-1,1) = E(ll,n-1)
        s2(ll,n-1,2) = 0.0_WP
        s2(ll,n,1) = D(ll,n)
        s2(ll,n,2) = E(ll,n)
     end do
     if (nper .eq. 0) then
        if (rank .eq. 0) then
           !$cuf kernel do <<<*, *>>>
           do ll=1,lot
              s1(ll,1,1) = 0.0_WP
              s1(ll,1,2) = 0.0_WP
              s1(ll,2,1) = 0.0_WP
              s1(ll,2,2) = 0.0_WP
           end do
        end if
        if (rank .eq. proc-1) then
           !$cuf kernel do <<<*, *>>>
           do ll=1,lot
              s2(ll,n-1,1) = 0.0_WP
              s2(ll,n-1,2) = 0.0_WP
              s2(ll,n,1) = 0.0_WP
              s2(ll,n,2) = 0.0_WP
           end do
        end if
     end if

     ! Forward elimination
     ! Upper boundary in s1(:,i,1:2)
     do i=1,n-2
        !$cuf kernel do <<<*, *>>>
        do ll=1,lot
           ! Eliminate a(i+2)
           const_l = A(ll,i+2)/C(ll,i)
           B(ll,i+2) = B(ll,i+2) - D(ll,i)*const_l
           C(ll,i+2) = C(ll,i+2) - E(ll,i)*const_l
           R(ll,i+2) = R(ll,i+2) - R(ll,i)*const_l
           s1(ll,i+2,1) = -s1(ll,i,1)*const_l
           s1(ll,i+2,2) = -s1(ll,i,2)*const_l

           ! Eliminate b(i+1)
           const_l = B(ll,i+1)/C(ll,i)
           C(ll,i+1) = C(ll,i+1) - D(ll,i)*const_l
           D(ll,i+1) = D(ll,i+1) - E(ll,i)*const_l
           R(ll,i+1) = R(ll,i+1) - R(ll,i)*const_l
           s1(ll,i+1,1) = s1(ll,i+1,1) - s1(ll,i,1)*const_l
           s1(ll,i+1,2) = s1(ll,i+1,2) - s1(ll,i,2)*const_l
        end do
     end do
     !$cuf kernel do <<<*, *>>>
     do ll=1,lot
        const_l = B(ll,n)/C(ll,n-1)
        C(ll,n) = C(ll,n) - D(ll,n-1)*const_l
        R(ll,n) = R(ll,n) - R(ll,n-1)*const_l
        s1(ll,n,1) = s1(ll,n,1) - s1(ll,n-1,1)*const_l
        s1(ll,n,2) = s1(ll,n,2) - s1(ll,n-1,2)*const_l
        s2(ll,n,1) = s2(ll,n,1) - s2(ll,n-1,1)*const_l
     end do

     ! Backward elimination
     ! Lower boundary in s2(:,i,1:2)
     do i=n,3,-1
        !$cuf kernel do <<<*, *>>>
        do ll=1,lot
           ! Eliminate e(i-2)
           const_l = E(ll,i-2)/C(ll,i)
           R(ll,i-2) = R(ll,i-2) - R(ll,i)*const_l
           s1(ll,i-2,1) = s1(ll,i-2,1) - s1(ll,i,1)*const_l
           s1(ll,i-2,2) = s1(ll,i-2,2) - s1(ll,i,2)*const_l
           s2(ll,i-2,1) = -s2(ll,i,1)*const_l
           s2(ll,i-2,2) = -s2(ll,i,2)*const_l

           ! Eliminate d(i-1)
           const_l = D(ll,i-1)/C(ll,i)
           R(ll,i-1) = R(ll,i-1) - R(ll,i)*const_l
           s1(ll,i-1,1) = s1(ll,i-1,1) - s1(ll,i,1)*const_l
           s1(ll,i-1,2) = s1(ll,i-1,2) - s1(ll,i,2)*const_l
           s2(ll,i-1,1) = s2(ll,i-1,1) - s2(ll,i,1)*const_l
           s2(ll,i-1,2) = s2(ll,i-1,2) - s2(ll,i,2)*const_l
        end do
     end do
     !$cuf kernel do <<<*, *>>>
     do ll=1,lot
        const_l = D(ll,1)/C(ll,2)
        R(ll,1) = R(ll,1) - R(ll,2)*const_l
        s1(ll,1,1) = s1(ll,1,1) - s1(ll,2,1)*const_l
        s1(ll,1,2) = s1(ll,1,2) - s1(ll,2,2)*const_l
        s2(ll,1,1) = s2(ll,1,1) - s2(ll,2,1)*const_l
        s2(ll,1,2) = s2(ll,1,2) - s2(ll,2,2)*const_l
     end do

     c_head_h = C(:,1:2)
     c_tail_h = C(:,n-1:n)
     r_head_h = R(:,1:2)
     r_tail_h = R(:,n-1:n)
     s1_head_h = s1(:,1:2,1:2)
     s1_tail_h = s1(:,n-1:n,1:2)
     s2_head_h = s2(:,1:2,1:2)
     s2_tail_h = s2(:,n-1:n,1:2)

  else
     allocate(line_h(lot,6))
     line_h(:,1) = A(:,1)
     line_h(:,2) = B(:,1)
     line_h(:,3) = C(:,1)
     line_h(:,4) = D(:,1)
     line_h(:,5) = E(:,1)
     line_h(:,6) = R(:,1)
  end if

  ! Only communicate the reduced boundary system through host MPI buffers.
  sendbuf_h = 0.0_WP
  L = 1
  k1 = 1
  do igroup=1,proc
     k2 = k1+ngroup(igroup)-1
     nk = k2-k1+1

     if (n > 1) then

        do i=1,2
           sendbuf_h(1:nk, L+0) = c_head_h(k1:k2, i)
           sendbuf_h(1:nk, L+1) = r_head_h(k1:k2, i)
           sendbuf_h(1:nk, L+2) = c_tail_h(k1:k2, i)
           sendbuf_h(1:nk, L+3) = r_tail_h(k1:k2, i)
           L = L + 4
        end do
        do i=1,2
           do j=1,2
              sendbuf_h(1:nk, L+0) = s1_head_h(k1:k2, i,j)
              sendbuf_h(1:nk, L+1) = s2_head_h(k1:k2, i,j)
              sendbuf_h(1:nk, L+2) = s1_tail_h(k1:k2, i,j)
              sendbuf_h(1:nk, L+3) = s2_tail_h(k1:k2, i,j)
              L = L + 4
           end do
        end do

     else

        sendbuf_h(1:nk, L+0) = line_h(k1:k2, 3)
        sendbuf_h(1:nk, L+1) = line_h(k1:k2, 6)
        sendbuf_h(1:nk, L+2) = 1.0_WP
        sendbuf_h(1:nk, L+3) = 0.0_WP
        sendbuf_h(1:nk, L+4) = 1.0_WP
        sendbuf_h(1:nk, L+5) = 0.0_WP
        sendbuf_h(1:nk, L+6) = line_h(k1:k2, 3)
        sendbuf_h(1:nk, L+7) = line_h(k1:k2, 6)
        sendbuf_h(1:nk, L+8) = line_h(k1:k2, 1)
        sendbuf_h(1:nk, L+9) = line_h(k1:k2, 4)
        sendbuf_h(1:nk, L+10) = 0.0_WP
        sendbuf_h(1:nk, L+11) = 0.0_WP
        sendbuf_h(1:nk, L+12) = line_h(k1:k2, 2)
        sendbuf_h(1:nk, L+13) = line_h(k1:k2, 5)
        sendbuf_h(1:nk, L+14) = -1.0_WP
        sendbuf_h(1:nk, L+15) = 0.0_WP
        sendbuf_h(1:nk, L+16) = 0.0_WP
        sendbuf_h(1:nk, L+17) = -1.0_WP
        sendbuf_h(1:nk, L+18) = line_h(k1:k2, 1)
        sendbuf_h(1:nk, L+19) = line_h(k1:k2, 4)
        sendbuf_h(1:nk, L+20) = 0.0_WP
        sendbuf_h(1:nk, L+21) = 0.0_WP
        sendbuf_h(1:nk, L+22) = line_h(k1:k2, 2)
        sendbuf_h(1:nk, L+23) = line_h(k1:k2, 5)
        L = L + 24

     end if

     k1 = k2 + 1
  end do

  ! Gather the boundary data
  call MPI_AllToAll(sendbuf_h,nlot*24,MPI_REAL_WP,recvbuf_h,nlot*24,MPI_REAL_WP,ncom,ierr)
  
  ! Build reduced matrix
  allocate(AA_h(nlot, 4*proc, -5:5 + 1))
  AA_h = 0.0_WP
  L = 1
  do k=1,proc
     m = 4*(k-1)
     
     do i=1,2
        AA_h(:, m+i  , 0) = recvbuf_h(:, L+0)
        AA_h(:, m+i  , 6) = recvbuf_h(:, L+1)
        AA_h(:, m+i+2, 0) = recvbuf_h(:, L+2)
        AA_h(:, m+i+2, 6) = recvbuf_h(:, L+3)
        L = L + 4
     end do
     do i=1,2
        do j=1,2
           AA_h(:, m+i,   -2+j-i) = recvbuf_h(:, L+0)
           AA_h(:, m+i,    4+j-i) = recvbuf_h(:, L+1)
           AA_h(:, m+i+2, -4+j-i) = recvbuf_h(:, L+2)
           AA_h(:, m+i+2,  2+j-i) = recvbuf_h(:, L+3)
           L = L + 4
        end do
     end do
     
  end do
  
  ! Clear unused values
  nk = ngroup(rank+1)
  AA_h(nk+1:nlot, :, :) = 0.0_WP
  AA_h(nk+1:nlot, :, 0) = 1.0_WP
  
  ! Solve reduced systems
  if (nper .eq.0) then
     call polydiagonal_serial(5, AA_h(:,3:4*proc-2,-5:+5), AA_h(:,3:4*proc-2,6), (2*proc-2)*2, nlot)
  else
     call polydiagonal_periodic_serial(5, AA_h(:,:,-5:+5), AA_h(:,:,6), (2*proc)*2, nlot, sendbuf_h)
  end if
  
  ! Move solution to beginning of recvbuf
  recvbuf_h(:, 1:4*proc) = AA_h(:, :, 6)
  deallocate(AA_h)
  
  ! Permute the order
  allocate(swap_h(nlot,2))
  do i=1,proc-1
     swap_h(:,:) = recvbuf_h(:, 4*i-1:4*i)
     recvbuf_h(:, 4*i-1:4*i) = recvbuf_h(:, 4*i+1:4*i+2)
     recvbuf_h(:, 4*i+1:4*i+2) = swap_h(:,:)
  end do
  if (nper .eq. 1) then
     swap_h(:,:) = recvbuf_h(:, 4*proc-1:4*proc)
     recvbuf_h(:, 4*proc-1:4*proc) = recvbuf_h(:, 1:2)
     recvbuf_h(:, 1:2) = swap_h(:,:)
  end if
  deallocate(swap_h)

  ! Scatter back the solution
  deallocate(sendbuf_h)
  allocate(sendbuf_h(nlot,4*proc))
  call MPI_AllToAll(recvbuf_h,nlot*4,MPI_REAL_WP,sendbuf_h,nlot*4,MPI_REAL_WP,ncom,ierr)
  
  L = 1
  k1 = 1
  do igroup=1,proc
     k2 = k1+ngroup(igroup)-1
     nk = k2-k1+1

     r1_h(k1:k2, :) = sendbuf_h(1:nk, L+0:L+1)
     r2_h(k1:k2, :) = sendbuf_h(1:nk, L+2:L+3)
     L = L + 4

     k1 = k2 + 1
  end do

  ! Only if not periodic
  if (nper .eq. 0) then
     if (rank .eq. 0)      r1_h = 0.0_WP
     if (rank .eq. proc-1) r2_h = 0.0_WP
  end if

  allocate(r1_d(lot,2))
  allocate(r2_d(lot,2))
  r1_d = r1_h
  r2_d = r2_h

  if (n > 1) then

     do i=1,n
        !$cuf kernel do <<<*, *>>>
        do ll=1,lot
           R(ll,i) = (R(ll,i) - s1(ll,i,1)*r1_d(ll,1) - s1(ll,i,2)*r1_d(ll,2) &
                - s2(ll,i,1)*r2_d(ll,1) - s2(ll,i,2)*r2_d(ll,2))/C(ll,i)
        end do
     end do

  else

     !$cuf kernel do <<<*, *>>>
     do ll=1,lot
        R(ll,1) = ( R(ll,1) - A(ll,1)*r1_d(ll,1) - B(ll,1)*r1_d(ll,2) &
             - D(ll,1)*r2_d(ll,1) - E(ll,1)*r2_d(ll,2) )/C(ll,1)
     end do

  end if

  deallocate(r2_d)
  deallocate(r1_d)
  deallocate(sendbuf_h)
  deallocate(recvbuf_h)
  deallocate(r2_h)
  deallocate(r1_h)
  deallocate(ngroup)
  if (n > 1) then
     deallocate(s2_tail_h)
     deallocate(s2_head_h)
     deallocate(s1_tail_h)
     deallocate(s1_head_h)
     deallocate(r_tail_h)
     deallocate(r_head_h)
     deallocate(c_tail_h)
     deallocate(c_head_h)
  else
     deallocate(line_h)
  end if

  return
end subroutine pentadiagonal_cuda


! ================================================= !
! PentaDiagonal Solver - Serial Case - Not periodic !
! ================================================= !
subroutine pentadiagonal_serial(A,B,C,D,E,R,n,lot)
  use precision
  implicit none

  integer, intent(in) :: n,lot
  real(WP), dimension(lot,n) :: A     ! LOWER-2
  real(WP), dimension(lot,n) :: B     ! LOWER-1
  real(WP), dimension(lot,n) :: C     ! DIAGONAL
  real(WP), dimension(lot,n) :: D     ! UPPER+1
  real(WP), dimension(lot,n) :: E     ! UPPER+2
  real(WP), dimension(lot,n) :: R     ! RHS - RESULT
  real(WP), dimension(lot) :: const
  integer :: i
  
  if (n .eq. 1) then
     ! Solve 1x1 system
     R(:,1) = R(:,1)/C(:,1)
     return
  else if (n .eq. 2) then
     ! Solve 2x2 system
     const(:) = B(:,2)/C(:,1)
     C(:,2) = C(:,2) - D(:,1)*const(:)
     R(:,2) = R(:,2) - R(:,1)*const(:)
     R(:,2) = R(:,2)/C(:,2)
     R(:,1) = (R(:,1) - D(:,1)*R(:,2))/C(:,1)
     return
  end if
  
  ! Forward elimination
  do i=1,n-2
     ! Eliminate A(2,i+1)
     const(:) = B(:,i+1)/(C(:,i)+tiny(1.0_WP))
     C(:,i+1) = C(:,i+1) - D(:,i)*const(:)
     D(:,i+1) = D(:,i+1) - E(:,i)*const(:)
     R(:,i+1) = R(:,i+1) - R(:,i)*const(:)

     ! Eliminate A(1,i+2)
     const(:) = A(:,i+2)/(C(:,i)+tiny(1.0_WP))
     B(:,i+2) = B(:,i+2) - D(:,i)*const(:)
     C(:,i+2) = C(:,i+2) - E(:,i)*const(:)
     R(:,i+2) = R(:,i+2) - R(:,i)*const(:)
  end do
  ! Eliminate A(2,n)
  const(:) = B(:,n)/(C(:,n-1)+tiny(1.0_WP))
  C(:,n) = C(:,n) - D(:,n-1)*const(:)
  R(:,n) = R(:,n) - R(:,n-1)*const(:)
  
  ! Back-substitution
  R(:,n) = R(:,n)/(C(:,n)+tiny(1.0_WP))
  R(:,n-1) = (R(:,n-1) - D(:,n-1)*R(:,n))/(C(:,n-1)+tiny(1.0_WP))
  do i=n-2,1,-1
     R(:,i) = (R(:,i) - D(:,i)*R(:,i+1) - E(:,i)*R(:,i+2))/(C(:,i)+tiny(1.0_WP))
  end do
  
  return
end subroutine pentadiagonal_serial


subroutine pentadiagonal_serial_cuda(A,B,C,D,E,R,n,lot)
  use precision
  use cudafor
  implicit none

  integer, intent(in) :: n,lot
  real(WP), device, intent(inout), dimension(lot,n) :: A     ! LOWER-2
  real(WP), device, intent(inout), dimension(lot,n) :: B     ! LOWER-1
  real(WP), device, intent(inout), dimension(lot,n) :: C     ! DIAGONAL
  real(WP), device, intent(inout), dimension(lot,n) :: D     ! UPPER+1
  real(WP), device, intent(inout), dimension(lot,n) :: E     ! UPPER+2
  real(WP), device, intent(inout), dimension(lot,n) :: R     ! RHS - RESULT
  real(WP) :: const_l
  integer :: i,l
  
  if (n .eq. 1) then
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        R(l,1) = R(l,1)/C(l,1)
     end do
     return
  else if (n .eq. 2) then
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        const_l = B(l,2)/C(l,1)
        C(l,2) = C(l,2) - D(l,1)*const_l
        R(l,2) = R(l,2) - R(l,1)*const_l
        R(l,2) = R(l,2)/C(l,2)
        R(l,1) = (R(l,1) - D(l,1)*R(l,2))/C(l,1)
     end do
     return
  end if
  
  ! Forward elimination
  do i=1,n-2
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        ! Eliminate A(2,i+1)
        const_l = B(l,i+1)/(C(l,i)+tiny(1.0_WP))
        C(l,i+1) = C(l,i+1) - D(l,i)*const_l
        D(l,i+1) = D(l,i+1) - E(l,i)*const_l
        R(l,i+1) = R(l,i+1) - R(l,i)*const_l

        ! Eliminate A(1,i+2)
        const_l = A(l,i+2)/(C(l,i)+tiny(1.0_WP))
        B(l,i+2) = B(l,i+2) - D(l,i)*const_l
        C(l,i+2) = C(l,i+2) - E(l,i)*const_l
        R(l,i+2) = R(l,i+2) - R(l,i)*const_l
     end do
  end do
  !$cuf kernel do <<<*, *>>>
  do l=1,lot
     const_l = B(l,n)/(C(l,n-1)+tiny(1.0_WP))
     C(l,n) = C(l,n) - D(l,n-1)*const_l
     R(l,n) = R(l,n) - R(l,n-1)*const_l
  end do
  
  ! Back-substitution
  !$cuf kernel do <<<*, *>>>
  do l=1,lot
     R(l,n) = R(l,n)/(C(l,n)+tiny(1.0_WP))
     R(l,n-1) = (R(l,n-1) - D(l,n-1)*R(l,n))/(C(l,n-1)+tiny(1.0_WP))
  end do
  do i=n-2,1,-1
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        R(l,i) = (R(l,i) - D(l,i)*R(l,i+1) - E(l,i)*R(l,i+2))/(C(l,i)+tiny(1.0_WP))
     end do
  end do
  
  return
end subroutine pentadiagonal_serial_cuda



! ============================================= !
! PentaDiagonal Solver - Serial Case - Periodic !
! ============================================= !
subroutine pentadiagonal_periodic_serial(A,B,C,D,E,R,n,lot,s1,s2)
  use precision
  implicit none

  integer, intent(in) :: n,lot
  real(WP), dimension(lot,n) :: A     ! LOWER-2
  real(WP), dimension(lot,n) :: B     ! LOWER-1
  real(WP), dimension(lot,n) :: C     ! DIAGONAL
  real(WP), dimension(lot,n) :: D     ! UPPER+1
  real(WP), dimension(lot,n) :: E     ! UPPER+2
  real(WP), dimension(lot,n) :: R     ! RHS - RESULT
  real(WP), dimension(lot,n) :: s1
  real(WP), dimension(lot,n) :: s2
  real(WP), dimension(lot) :: const
  integer :: i

  if (n .eq. 1) then
     ! Solve 1x1 system
     R(:,:) = R(:,:)/(A(:,:)+B(:,:)+C(:,:)+D(:,:)+E(:,:))
     return
  else if (n .eq. 2) then
     ! Solve 2x2 system
     C(:,:) = C(:,:) + A(:,:) + E(:,:)
     D(:,1) = D(:,1) + B(:,1)
     B(:,2) = B(:,2) + D(:,2)
     const(:) = B(:,2)/C(:,1)
     C(:,2) = C(:,2) - D(:,1)*const(:)
     R(:,2) = R(:,2) - R(:,1)*const(:)
     R(:,2) = R(:,2)/C(:,2)
     R(:,1) = (R(:,1) - D(:,1)*R(:,2))/C(:,1)
     return
  else if (n .eq. 3) then
     B(:,:) = B(:,:) + E(:,:)
     D(:,:) = D(:,:) + A(:,:)
     call tridiagonal_periodic_serial(B(:,:), C(:,:), D(:,:), R(:,:), n, lot)
     return
  else if (n .eq. 4) then
     A(:,:) = A(:,:) + E(:,:)
     E(:,:) = 0.0_WP
  end if

  ! Initialize boundary data
  s1 = 0.0_WP
  s1(:,1) = A(:,1)
  s1(:,n-3) = s1(:,n-3) + E(:,n-3)
  s1(:,n-2) = D(:,n-2)
  s1(:,n-1) = C(:,n-1)
  s1(:,n) = B(:,n)
  s2 = 0.0_WP
  s2(:,1) = B(:,1)
  s2(:,2) = A(:,2)
  s2(:,n-2) = s2(:,n-2) + E(:,n-2)
  s2(:,n-1) = D(:,n-1)
  s2(:,n) = C(:,n)

  ! Forward elimination
  do i=1,n-2
     ! Eliminate b(i+1)
     const(:) = B(:,i+1)/C(:,i)
     C(:,i+1) = C(:,i+1) - D(:,i)*const(:)
     D(:,i+1) = D(:,i+1) - E(:,i)*const(:)
     R(:,i+1) = R(:,i+1) - R(:,i)*const(:)
     s1(:,i+1) = s1(:,i+1) - s1(:,i)*const(:)
     s2(:,i+1) = s2(:,i+1) - s2(:,i)*const(:)

     ! Eliminate a(i+2)
     const(:) = A(:,i+2)/C(:,i)
     B(:,i+2) = B(:,i+2) - D(:,i)*const(:)
     C(:,i+2) = C(:,i+2) - E(:,i)*const(:)
     R(:,i+2) = R(:,i+2) - R(:,i)*const(:)
     s1(:,i+2) = s1(:,i+2) - s1(:,i)*const(:)
     s2(:,i+2) = s2(:,i+2) - s2(:,i)*const(:)
  end do

  ! Backward elimination
  do i=n-2,3,-1
     ! Eliminate d(i-1)
     const(:) = D(:,i-1)/C(:,i)
     R(:,i-1) = R(:,i-1) - R(:,i)*const(:)
     s1(:,i-1) = s1(:,i-1) - s1(:,i)*const(:)
     s2(:,i-1) = s2(:,i-1) - s2(:,i)*const(:)

     ! Eliminate e(i-2)
     const(:) = E(:,i-2)/C(:,i)
     R(:,i-2) = R(:,i-2) - R(:,i)*const(:)
     s1(:,i-2) = s1(:,i-2) - s1(:,i)*const(:)
     s2(:,i-2) = s2(:,i-2) - s2(:,i)*const(:)
  end do
  i=2
  ! Eliminate d(i-1)
  const(:) = D(:,i-1)/C(:,i)
  R(:,i-1) = R(:,i-1) - R(:,i)*const(:)
  s1(:,i-1) = s1(:,i-1) - s1(:,i)*const(:)
  s2(:,i-1) = s2(:,i-1) - s2(:,i)*const(:)

  ! Eliminate oddball region
  const(:) = E(:,n-1)/C(:,1)
  R(:,n-1) = R(:,n-1) - R(:,1)*const(:)
  s1(:,n-1) = s1(:,n-1) - s1(:,1)*const(:)
  s2(:,n-1) = s2(:,n-1) - s2(:,1)*const(:)

  const(:) = D(:,n)/C(:,1)
  R(:,n) = R(:,n) - R(:,1)*const(:)
  s1(:,n) = s1(:,n) - s1(:,1)*const(:)
  s2(:,n) = s2(:,n) - s2(:,1)*const(:)

  const(:) = E(:,n)/C(:,2)
  R(:,n) = R(:,n) - R(:,2)*const(:)
  s1(:,n) = s1(:,n) - s1(:,2)*const(:)
  s2(:,n) = s2(:,n) - s2(:,2)*const(:)

  ! Eliminate corner region
  const(:) = s1(:,n)/s1(:,n-1)
  R(:,n) = R(:,n) - R(:,n-1)*const(:)
  s2(:,n) = s2(:,n) - s2(:,n-1)*const(:)

  R(:,n) = R(:,n)/s2(:,n)
  R(:,n-1) = (R(:,n-1) - s2(:,n-1)*R(:,n))/s1(:,n-1)
  do i=n-2,1,-1
     R(:,i) = (R(:,i) - s1(:,i)*R(:,n-1) - s2(:,i)*R(:,n))/C(:,i)
  end do

  return
end subroutine pentadiagonal_periodic_serial


subroutine pentadiagonal_periodic_serial_cuda(A,B,C,D,E,R,n,lot,s1,s2)
  use precision
  use cudafor
  implicit none

  interface
     subroutine tridiagonal_periodic_serial_cuda(a,b,c,r,n,lot)
       use precision
       use cudafor
       implicit none
       integer, intent(in) :: n,lot
       real(WP), device, intent(inout), dimension(lot,n) :: a,b,c,r
     end subroutine tridiagonal_periodic_serial_cuda
  end interface

  integer, intent(in) :: n,lot
  real(WP), device, intent(inout), dimension(lot,n) :: A     ! LOWER-2
  real(WP), device, intent(inout), dimension(lot,n) :: B     ! LOWER-1
  real(WP), device, intent(inout), dimension(lot,n) :: C     ! DIAGONAL
  real(WP), device, intent(inout), dimension(lot,n) :: D     ! UPPER+1
  real(WP), device, intent(inout), dimension(lot,n) :: E     ! UPPER+2
  real(WP), device, intent(inout), dimension(lot,n) :: R     ! RHS - RESULT
  real(WP), device, intent(inout), dimension(lot,n) :: s1
  real(WP), device, intent(inout), dimension(lot,n) :: s2
  real(WP) :: const_l
  integer :: i,l

  if (n .eq. 1) then
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        R(l,1) = R(l,1)/(A(l,1)+B(l,1)+C(l,1)+D(l,1)+E(l,1))
     end do
     return
  else if (n .eq. 2) then
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        C(l,1) = C(l,1) + A(l,1) + E(l,1)
        D(l,1) = D(l,1) + B(l,1)
        B(l,2) = B(l,2) + D(l,2)
        const_l = B(l,2)/C(l,1)
        C(l,2) = C(l,2) - D(l,1)*const_l
        R(l,2) = R(l,2) - R(l,1)*const_l
        R(l,2) = R(l,2)/C(l,2)
        R(l,1) = (R(l,1) - D(l,1)*R(l,2))/C(l,1)
     end do
     return
  else if (n .eq. 3) then
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        B(l,1:n) = B(l,1:n) + E(l,1:n)
        D(l,1:n) = D(l,1:n) + A(l,1:n)
     end do
     call tridiagonal_periodic_serial_cuda(B, C, D, R, n, lot)
     return
  else if (n .eq. 4) then
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        A(l,1:n) = A(l,1:n) + E(l,1:n)
        E(l,1:n) = 0.0_WP
     end do
  end if

  ! Initialize boundary data
  s1 = 0.0_WP
  s2 = 0.0_WP
  !$cuf kernel do <<<*, *>>>
  do l=1,lot
     s1(l,1) = A(l,1)
     s1(l,n-3) = s1(l,n-3) + E(l,n-3)
     s1(l,n-2) = D(l,n-2)
     s1(l,n-1) = C(l,n-1)
     s1(l,n) = B(l,n)
     s2(l,1) = B(l,1)
     s2(l,2) = A(l,2)
     s2(l,n-2) = s2(l,n-2) + E(l,n-2)
     s2(l,n-1) = D(l,n-1)
     s2(l,n) = C(l,n)
  end do

  ! Forward elimination
  do i=1,n-2
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        ! Eliminate b(i+1)
        const_l = B(l,i+1)/C(l,i)
        C(l,i+1) = C(l,i+1) - D(l,i)*const_l
        D(l,i+1) = D(l,i+1) - E(l,i)*const_l
        R(l,i+1) = R(l,i+1) - R(l,i)*const_l
        s1(l,i+1) = s1(l,i+1) - s1(l,i)*const_l
        s2(l,i+1) = s2(l,i+1) - s2(l,i)*const_l

        ! Eliminate a(i+2)
        const_l = A(l,i+2)/C(l,i)
        B(l,i+2) = B(l,i+2) - D(l,i)*const_l
        C(l,i+2) = C(l,i+2) - E(l,i)*const_l
        R(l,i+2) = R(l,i+2) - R(l,i)*const_l
        s1(l,i+2) = s1(l,i+2) - s1(l,i)*const_l
        s2(l,i+2) = s2(l,i+2) - s2(l,i)*const_l
     end do
  end do

  ! Backward elimination
  do i=n-2,3,-1
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        ! Eliminate d(i-1)
        const_l = D(l,i-1)/C(l,i)
        R(l,i-1) = R(l,i-1) - R(l,i)*const_l
        s1(l,i-1) = s1(l,i-1) - s1(l,i)*const_l
        s2(l,i-1) = s2(l,i-1) - s2(l,i)*const_l

        ! Eliminate e(i-2)
        const_l = E(l,i-2)/C(l,i)
        R(l,i-2) = R(l,i-2) - R(l,i)*const_l
        s1(l,i-2) = s1(l,i-2) - s1(l,i)*const_l
        s2(l,i-2) = s2(l,i-2) - s2(l,i)*const_l
     end do
  end do
  i=2
  !$cuf kernel do <<<*, *>>>
  do l=1,lot
     const_l = D(l,i-1)/C(l,i)
     R(l,i-1) = R(l,i-1) - R(l,i)*const_l
     s1(l,i-1) = s1(l,i-1) - s1(l,i)*const_l
     s2(l,i-1) = s2(l,i-1) - s2(l,i)*const_l
  end do

  ! Eliminate oddball region
  !$cuf kernel do <<<*, *>>>
  do l=1,lot
     const_l = E(l,n-1)/C(l,1)
     R(l,n-1) = R(l,n-1) - R(l,1)*const_l
     s1(l,n-1) = s1(l,n-1) - s1(l,1)*const_l
     s2(l,n-1) = s2(l,n-1) - s2(l,1)*const_l

     const_l = D(l,n)/C(l,1)
     R(l,n) = R(l,n) - R(l,1)*const_l
     s1(l,n) = s1(l,n) - s1(l,1)*const_l
     s2(l,n) = s2(l,n) - s2(l,1)*const_l

     const_l = E(l,n)/C(l,2)
     R(l,n) = R(l,n) - R(l,2)*const_l
     s1(l,n) = s1(l,n) - s1(l,2)*const_l
     s2(l,n) = s2(l,n) - s2(l,2)*const_l
  end do

  ! Eliminate corner region and back-substitution
  !$cuf kernel do <<<*, *>>>
  do l=1,lot
     const_l = s1(l,n)/s1(l,n-1)
     R(l,n) = R(l,n) - R(l,n-1)*const_l
     s2(l,n) = s2(l,n) - s2(l,n-1)*const_l

     R(l,n) = R(l,n)/s2(l,n)
     R(l,n-1) = (R(l,n-1) - s2(l,n-1)*R(l,n))/s1(l,n-1)
  end do
  do i=n-2,1,-1
     !$cuf kernel do <<<*, *>>>
     do l=1,lot
        R(l,i) = (R(l,i) - s1(l,i)*R(l,n-1) - s2(l,i)*R(l,n))/C(l,i)
     end do
  end do

  return
end subroutine pentadiagonal_periodic_serial_cuda

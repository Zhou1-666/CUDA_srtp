program test_penta_stability
    use mpi
    use cudafor
    use PaScaL_TDMA_cuda_penta
    implicit none

    type(ptdma_plan_cuda) :: plan
    integer :: ierr,myrank,nprocs,nsys,nrow,n3,i,j,g,gg,target_j
    integer :: cuda_status
    character(len=64) :: case_name
    real(8) :: offsum,row_factor,lambda,scale,xval
    real(8) :: local_resid,local_ainf,local_xinf,local_binf,local_forward
    real(8) :: global_resid,global_ainf,global_xinf,global_binf,global_forward,backward,forward_limit
    real(8), allocatable :: A_h(:,:),B_h(:,:),C_h(:,:),D_h(:,:),E_h(:,:),R_h(:,:)
    real(8), allocatable :: A0(:,:),B0(:,:),C0(:,:),D0(:,:),E0(:,:),R0(:,:)
    real(8), allocatable :: local_sol(:),global_sol(:)
    real(8), allocatable, device :: A_d(:,:),B_d(:,:),C_d(:,:),D_d(:,:),E_d(:,:),R_d(:,:)

    call MPI_INIT(ierr)
    call MPI_COMM_RANK(MPI_COMM_WORLD,myrank,ierr)
    call MPI_COMM_SIZE(MPI_COMM_WORLD,nprocs,ierr)

    if(command_argument_count()/=1) then
        if(myrank==0) write(*,'(A)') 'usage: test_penta_stability <case>'
        call MPI_FINALIZE(ierr)
        stop 2
    endif
    call get_command_argument(1,case_name)

    nrow = 8
    n3 = nrow*nprocs
    nsys = max(2,nprocs)
    allocate(A_h(0:nsys-1,0:nrow-1),B_h(0:nsys-1,0:nrow-1),C_h(0:nsys-1,0:nrow-1))
    allocate(D_h(0:nsys-1,0:nrow-1),E_h(0:nsys-1,0:nrow-1),R_h(0:nsys-1,0:nrow-1))
    allocate(A0(0:nsys-1,0:nrow-1),B0(0:nsys-1,0:nrow-1),C0(0:nsys-1,0:nrow-1))
    allocate(D0(0:nsys-1,0:nrow-1),E0(0:nsys-1,0:nrow-1),R0(0:nsys-1,0:nrow-1))
    allocate(A_d(0:nsys-1,0:nrow-1),B_d(0:nsys-1,0:nrow-1),C_d(0:nsys-1,0:nrow-1))
    allocate(D_d(0:nsys-1,0:nrow-1),E_d(0:nsys-1,0:nrow-1),R_d(0:nsys-1,0:nrow-1))
    allocate(local_sol(0:nrow-1),global_sol(0:n3-1))

    do i=0,nsys-1
        do j=0,nrow-1
            g = myrank*nrow+j
            A_h(i,j)=0.d0; B_h(i,j)=0.d0; C_h(i,j)=0.d0
            D_h(i,j)=0.d0; E_h(i,j)=0.d0
            if(trim(case_name)=='near_singular') then
                lambda = 2.d0*cos(4.d0*atan(1.d0)/dble(n3+1))+1.d-9
                if(g>=1) B_h(i,j)=-1.d0
                C_h(i,j)=lambda
                if(g+1<n3) D_h(i,j)=-1.d0
            else
                if(g>=2) A_h(i,j)=-0.11d0-0.01d0*dble(mod(g,3))
                if(g>=1) B_h(i,j)= 0.31d0+0.02d0*dble(mod(g,2))
                if(g+1<n3) D_h(i,j)=-0.27d0-0.01d0*dble(mod(g,4))
                if(g+2<n3) E_h(i,j)= 0.09d0+0.01d0*dble(mod(g,3))
                offsum=abs(A_h(i,j))+abs(B_h(i,j))+abs(D_h(i,j))+abs(E_h(i,j))
                if(trim(case_name)=='weak_dominant') then
                    C_h(i,j)=offsum*(1.d0+1.d-12)
                else
                    C_h(i,j)=2.d0*offsum
                endif
            endif
            if(trim(case_name)=='scaled') then
                scale=10.d0**(-12.d0+24.d0*dble(g)/dble(n3-1))
                A_h(i,j)=A_h(i,j)*scale; B_h(i,j)=B_h(i,j)*scale
                C_h(i,j)=C_h(i,j)*scale; D_h(i,j)=D_h(i,j)*scale; E_h(i,j)=E_h(i,j)*scale
            endif
        enddo
    enddo

    if(trim(case_name)=='zero_pivot' .or. trim(case_name)=='near_zero_pivot') then
        target_j=0
        if(nprocs>1) target_j=2
        do i=0,nsys-1
            C_h(i,target_j)=0.d0
            if(trim(case_name)=='near_zero_pivot') C_h(i,target_j)=1.d-16
            D_h(i,target_j)=1.d0
        enddo
    endif

    do i=0,nsys-1
        do j=0,nrow-1
            g=myrank*nrow+j
            R_h(i,j)=C_h(i,j)*x_true(g)
            gg=g-2; if(gg>=0) R_h(i,j)=R_h(i,j)+A_h(i,j)*x_true(gg)
            gg=g-1; if(gg>=0) R_h(i,j)=R_h(i,j)+B_h(i,j)*x_true(gg)
            gg=g+1; if(gg<n3) R_h(i,j)=R_h(i,j)+D_h(i,j)*x_true(gg)
            gg=g+2; if(gg<n3) R_h(i,j)=R_h(i,j)+E_h(i,j)*x_true(gg)
        enddo
    enddo

    A0=A_h; B0=B_h; C0=C_h; D0=D_h; E0=E_h; R0=R_h
    A_d=A_h; B_d=B_h; C_d=C_h; D_d=D_h; E_d=E_h; R_d=R_h
    call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128)
    call pascal_solver(plan,A_d,B_d,C_d,D_d,E_d,R_d,nsys,nrow)
    cuda_status=cudaDeviceSynchronize()
    if(cuda_status/=0) then
        if(myrank==0) write(*,'(A,I0)') 'STABILITY_FAIL: CUDA status ',cuda_status
        call MPI_ABORT(MPI_COMM_WORLD,5,ierr)
    endif
    R_h=R_d

    do j=0,nrow-1
        local_sol(j)=R_h(0,j)
    enddo
    call MPI_ALLGATHER(local_sol,nrow,MPI_DOUBLE_PRECISION,global_sol,nrow,MPI_DOUBLE_PRECISION,MPI_COMM_WORLD,ierr)

    local_resid=0.d0; local_ainf=0.d0; local_xinf=0.d0; local_binf=0.d0; local_forward=0.d0
    do j=0,nrow-1
        g=myrank*nrow+j
        xval=C0(0,j)*global_sol(g)
        if(g>=2) xval=xval+A0(0,j)*global_sol(g-2)
        if(g>=1) xval=xval+B0(0,j)*global_sol(g-1)
        if(g+1<n3) xval=xval+D0(0,j)*global_sol(g+1)
        if(g+2<n3) xval=xval+E0(0,j)*global_sol(g+2)
        local_resid=max(local_resid,abs(xval-R0(0,j)))
        row_factor=abs(A0(0,j))+abs(B0(0,j))+abs(C0(0,j))+abs(D0(0,j))+abs(E0(0,j))
        local_ainf=max(local_ainf,row_factor)
        local_xinf=max(local_xinf,abs(global_sol(g)))
        local_binf=max(local_binf,abs(R0(0,j)))
        local_forward=max(local_forward,abs(global_sol(g)-x_true(g)))
    enddo
    call MPI_ALLREDUCE(local_resid,global_resid,1,MPI_DOUBLE_PRECISION,MPI_MAX,MPI_COMM_WORLD,ierr)
    call MPI_ALLREDUCE(local_ainf,global_ainf,1,MPI_DOUBLE_PRECISION,MPI_MAX,MPI_COMM_WORLD,ierr)
    call MPI_ALLREDUCE(local_xinf,global_xinf,1,MPI_DOUBLE_PRECISION,MPI_MAX,MPI_COMM_WORLD,ierr)
    call MPI_ALLREDUCE(local_binf,global_binf,1,MPI_DOUBLE_PRECISION,MPI_MAX,MPI_COMM_WORLD,ierr)
    call MPI_ALLREDUCE(local_forward,global_forward,1,MPI_DOUBLE_PRECISION,MPI_MAX,MPI_COMM_WORLD,ierr)
    backward=global_resid/max(global_ainf*global_xinf+global_binf,tiny(1.d0))
    forward_limit=1.d-10
    if(trim(case_name)=='near_singular') forward_limit=1.d-5

    if(backward>1.d-10 .or. global_forward>forward_limit) then
        if(myrank==0) write(*,'(A,A,A,ES12.4,A,ES12.4)') 'STABILITY_FAIL: ',trim(case_name), &
            ' backward=',backward,' forward=',global_forward
        call MPI_ABORT(MPI_COMM_WORLD,5,ierr)
    endif
    if(myrank==0) write(*,'(A,A,A,ES12.4,A,ES12.4)') 'STABILITY_PASS: ',trim(case_name), &
        ' backward=',backward,' forward=',global_forward

    call pascal_plan_clean(plan)
    deallocate(A_d,B_d,C_d,D_d,E_d,R_d)
    deallocate(A_h,B_h,C_h,D_h,E_h,R_h,A0,B0,C0,D0,E0,R0,local_sol,global_sol)
    call MPI_FINALIZE(ierr)

contains

    real(8) function x_true(index)
        integer, intent(in) :: index
        x_true=sin(0.37d0*dble(index+1))+0.25d0*cos(0.11d0*dble(index))
    end function x_true

end program test_penta_stability

program main
    use mpi                        ! MPI parallel environment
    use cudafor                    ! CUDA Fortran interfaces
    use PaScaL_TDMA_cuda_penta     ! PaScaL-TDMA 五对角 CUDA 求解器模块
    implicit none

    ! MPI & CUDA process information
    integer :: ierr, myrank, nprocs
    integer :: gpurank, ngpu

    ! Global domain sizes
    integer :: n1, n2, n3
    integer :: forward_slots, env_stat, parse_stat
    character(len=32) :: slot_mode
    ! Local subdomain sizes (assigned by domain decomposition)
    integer :: n1sub, n2sub, n3sub

    ! 五对角系数 (Aa,Ab,Ac,Ad,Ae) 与右端项 (B)
    !   Aa: x_{j-2} 系数, Ab: x_{j-1} 系数, Ac: x_j  系数,
    !   Ad: x_{j+1} 系数, Ae: x_{j+2} 系数
    real*8, allocatable, dimension(:,:,:) :: Aa,Ab,Ac,Ad,Ae,B
    ! Device (GPU) arrays for the same data
    real*8, allocatable, dimension(:,:,:), device :: Aa_d,Ab_d,Ac_d,Ad_d,Ae_d,B_d

    ! PaScaL-TDMA plan structure (contains buffers, streams, communicator info)
    type(ptdma_plan_cuda) :: exampleplan

    ! Thread settings for modified-Thomas stage and reduced system stage
    integer :: nthread_modithomas, nthread_reduced
    real*8 :: local_error, global_error

    ! 通信传输方式 (模块级开关, 默认 host 中转, 兼容任意 MPI):
    !   若 MPI 已启用 CUDA-aware (如 OpenMPI --with-cuda), 取消下一行注释走直传
    ! pascal_cuda_aware_mpi = .true.

    ! z-direction decomposition indices for each MPI rank
    integer :: ia,ib

    !===========================================================
    ! MPI INIT
    !===========================================================
    call MPI_INIT(ierr)
    call MPI_COMM_SIZE(MPI_COMM_WORLD, nprocs, ierr)
    call MPI_COMM_RANK(MPI_COMM_WORLD, myrank, ierr)
    if(myrank==0) write(*,*) " MPI processes:", nprocs

    forward_slots = PASCAL_PENTA_FORWARD_SLOTS_28
    slot_mode = ""
    call get_environment_variable("PENTA_FORWARD_SLOTS",slot_mode,status=env_stat)
    if(env_stat==0 .and. len_trim(slot_mode)>0) then
        read(slot_mode,*,iostat=parse_stat) forward_slots
        if(parse_stat/=0) then
            if(myrank==0) write(*,'(A,A)') ' invalid PENTA_FORWARD_SLOTS: ',trim(slot_mode)
            call MPI_ABORT(MPI_COMM_WORLD,1,ierr)
        endif
    endif

    !===========================================================
    ! CUDA INIT
    !===========================================================
    ierr = CUDAGETDEVICECOUNT(ngpu)
    gpurank = mod(myrank,ngpu)
    ierr = CUDASETDEVICE(gpurank)
    ierr = CUDADEVICESYNCHRONIZE()
    if(myrank==0) write(*,*) " CUDA devices :", ngpu

    !===========================================================
    ! Set grid sizes
    !===========================================================
    n1 = 64                               ! x-dimension
    n2 = 64                               ! y-dimension
    n3 = 2048                             ! z-dimension (split across MPI ranks)

    ! CUDA thread configuration for PaScaL-TDMA
    nthread_modithomas = 128
    nthread_reduced    = 128
    if(myrank==0) write(*,*) " Grid size    :", n1,n2,n3

    !===========================================================
    ! Domain decomposition
    !===========================================================
    call para(0,n3-1,nprocs,myrank,ia,ib) ! Compute local z-range [ia, ib]
    n1sub = n1
    n2sub = n2
    n3sub = ib - ia + 1                   ! Local domain thickness
    if(myrank==0) write(*,*) " Subdomain z-size:", n3sub

    !===========================================================
    ! Allocate memory
    !===========================================================
    allocate(Aa(0:n1sub-1,0:n2sub-1,0:n3sub-1), Aa_d(0:n1sub-1,0:n2sub-1,0:n3sub-1))
    allocate(Ab(0:n1sub-1,0:n2sub-1,0:n3sub-1), Ab_d(0:n1sub-1,0:n2sub-1,0:n3sub-1))
    allocate(Ac(0:n1sub-1,0:n2sub-1,0:n3sub-1), Ac_d(0:n1sub-1,0:n2sub-1,0:n3sub-1))
    allocate(Ad(0:n1sub-1,0:n2sub-1,0:n3sub-1), Ad_d(0:n1sub-1,0:n2sub-1,0:n3sub-1))
    allocate(Ae(0:n1sub-1,0:n2sub-1,0:n3sub-1), Ae_d(0:n1sub-1,0:n2sub-1,0:n3sub-1))
    allocate(B (0:n1sub-1,0:n2sub-1,0:n3sub-1), B_d (0:n1sub-1,0:n2sub-1,0:n3sub-1))

    !===========================================================
    ! Initialize matrix system
    !   行: Aa x_{j-2} + Ab x_{j-1} + Ac x_j + Ad x_{j+1} + Ae x_{j+2} = B_j
    !   取 Aa=Ab=Ad=Ae=1, Ac=-4 (行和=0), 精确解 x ≡ 1
    !   全局边界: 幽灵系数 (x_{-2},x_{-1},x_N,x_{N+1}) 视为 0,
    !   首两行/末两行 RHS 按"行和 - 被忽略的幽灵项"设置
    !===========================================================
    Aa(:,:,:) = dble( 1)
    Ab(:,:,:) = dble( 1)
    Ac(:,:,:) = dble(-4)
    Ad(:,:,:) = dble( 1)
    Ae(:,:,:) = dble( 1)
    B (:,:,:) = dble( 0)

    ! Boundary conditions at the physical domain edges
    !   rank 0 行0: 忽略 x_{-2},x_{-1} -> 1-4+1+1 = -2
    !   rank 0 行1: 忽略 x_{-1}       -> 1+1-4+1+1 = -1
    !   last 行N-2: 忽略 x_N          -> 1+1-4+1   = -1
    !   last 行N-1: 忽略 x_N,x_{N+1}  -> 1+1-4     = -2
    if(myrank==0) then
        B(:,:,0)      = dble(-2)
        B(:,:,1)      = dble(-1)
    endif
    if(myrank==nprocs-1) then
        B(:,:,n3sub-2) = dble(-1)
        B(:,:,n3sub-1) = dble(-2)
    endif

    ! Copy host data → device
    Aa_d = Aa
    Ab_d = Ab
    Ac_d = Ac
    Ad_d = Ad
    Ae_d = Ae
    B_d  = B
    if(myrank==0) write(*,*) " Matrix system initialized"

    !===========================================================
    ! *** Pascal TDMA (pentadiagonal) example ***
    !===========================================================
    if(myrank==0) write(*,*) " Starting Pascal TDMA (pentadiagonal) solver"

    ! Create solver plan
    call pascal_plan_create(exampleplan, (n1sub*n2sub), MPI_COMM_WORLD, myrank, nprocs, &
                            nthread_modithomas, nthread_reduced, forward_slots)

    ! Execute multi-GPU distributed pentadiagonal solve along z-direction
    call pascal_solver(exampleplan, Aa_d, Ab_d, Ac_d, Ad_d, Ae_d, B_d, (n1sub*n2sub), n3sub)

    !===========================================================
    ! Print small portion of solution
    !===========================================================
    B = B_d              ! Copy device → host for printing
    local_error = maxval(abs(B-1.d0))
    call MPI_ALLREDUCE(local_error,global_error,1,MPI_DOUBLE_PRECISION,MPI_MAX, &
                       MPI_COMM_WORLD,ierr)
    if(myrank==0) write(*,'(A,I0,A,ES12.4)') ' regular forward slots=', &
        exampleplan%forward_slots,' max_error=',global_error
    if(global_error>1.d-10) then
        if(myrank==0) write(*,'(A)') ' regular solver accuracy check failed'
        call MPI_ABORT(MPI_COMM_WORLD,3,ierr)
    endif

    ! Release GPU buffers and internal structures
    call pascal_plan_clean(exampleplan)

    if(myrank==0) write(*,*) " Pascal TDMA (pentadiagonal) solver finished"

    call checkprint(B, n1sub, n2sub, n3sub, ia, myrank, nprocs)

    !===========================================================
    ! FINALIZE
    !===========================================================
    deallocate(Aa,Aa_d)
    deallocate(Ab,Ab_d)
    deallocate(Ac,Ac_d)
    deallocate(Ad,Ad_d)
    deallocate(Ae,Ae_d)
    deallocate(B ,B_d)
    call MPI_FINALIZE(ierr)
end


!=======================================================================
! checkprint : prints selected entries from the solution array B.
! This function is primarily for verification and debugging.
!=======================================================================
subroutine checkprint(B, n1sub, n2sub, n3sub, ia, myrank, nprocs)
    use mpi
    implicit none

    real*8, dimension(0:n1sub-1,0:n2sub-1,0:n3sub-1) :: B
    integer :: n1sub, n2sub, n3sub
    integer :: ia
    integer :: myrank, nprocs

    integer :: iter, k, ierr

    do iter = 0, nprocs-1
        if(myrank == iter) then
            write(*,'(1A5,1I5,1A2)') " Rank:", myrank, "--"

            do k = 0, 2
                write(*,'(1I8,1I8,F8.3,A4,F8.3,A4,F8.3)')                     &
                     k, k+ia, B(0,0,k), " ...", B(n1sub/2,n2sub/2,k), " ...", &
                     B(n1sub-1,n2sub-1,k)
            end do

            write(*,'(1A8)') "     ..."

            do k = n3sub-2, n3sub-1
                write(*,'(1I8,1I8,F8.3,A4,F8.3,A4,F8.3)')                     &
                     k, k+ia, B(0,0,k), " ...", B(n1sub/2,n2sub/2,k), " ...", &
                     B(n1sub-1,n2sub-1,k)
            end do
        endif

        call MPI_BARRIER(MPI_COMM_WORLD, ierr)
    end do

end subroutine checkprint

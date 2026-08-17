module PaScaL_TDMA_cuda_penta
    use mpi                      ! MPI for distributed communication
    use cudafor                  ! CUDA Fortran extensions (device, dim3, etc.)
    implicit none

    !===================================================================
    ! pascal_cuda_aware_mpi
    ! ---------------------
    ! 通信传输方式开关:
    !   .false. (默认): host 中转. 缩约通信先 device->host, MPI 在宿主内存
    !     完成, 再 host->device. 兼容任意 MPI (含未启用 CUDA 支持的 OpenMPI),
    !     缩约数据量小 (每线 <=128 双精度/rank), 开销可忽略.
    !   .true.        : CUDA-aware MPI 直传 device 指针 (需 MPI 编译时启用
    !     CUDA 支持, 如 OpenMPI --with-cuda; 需 GPUDirect/同一设备上下文).
    !     在驱动的示例程序中置 .true. 以启用直传路径.
    !===================================================================
    logical, public :: pascal_cuda_aware_mpi = .false.

    !===================================================================
    ! ptdma_plan_cuda
    ! ----------------
    ! 五对角版求解计划结构。
    ! 与三对角版的差异 (全部集中在缩约系统数据/描述符):
    !   - rd   (Nsys x 28)      : 本地消元产出的缩约数据, 每线 4 方程 x 7 槽
    !                             7 槽 = [L3,L2,L1,U1,U2,U3,RHS] (对角槽 D=1
    !                             恒等, 不随缩约数据传输, 组装时填回)
    !   - Atr  (tmp_N x 32*nprocs): 缩约系统 (带状(3,3), 8 槽/方程, 对角=1)
    !   - Dtr  (tmp_N x 4*nprocs): 缩约系统解 (每线 4*nprocs 个接口未知量)
    !   - Drd  (Nsys x 4)       : 每条线的 4 个接口解 {x_0,x_1,x_N-2,x_N-1}
    !   - 解回传阶段 (4 列块) 与 缩约组装阶段 (28 列块) 块宽不同,
    !     因此新增一组 gather/buf 描述符 (N*_sol_* / buf*_sol_*)
    !===================================================================
    type, public :: ptdma_plan_cuda
        ! MPI context
        integer :: ptdma_world = MPI_COMM_NULL
        integer :: myrank = -1, nprocs = 0, Nsys = 0
        logical :: is_created = .false.

        ! 本 rank 的线数 tmp_N, 与所有 rank 线数最大值 tmp_Nmax
        integer :: tmp_N, tmp_Nmax

        ! 缩约数据尺寸 (28 列/线: 4 方程 x [L3,L2,L1,U1,U2,U3,RHS])
        !   对角槽 D=1 恒等, 不随缩约数据传输 (组装时由 pascalunpack_penta 填回)
        ! Nrd_global = (/ Nsys, 28 /),  Nrd_local = (/ tmp_N, 28 /)
        integer :: Nrd_global(0:1),Nrd_local(0:1)

        ! 缩约系统尺寸 (8 槽/方程/rank, 组装后 D 槽=1)
        ! Ntr_global = (/ tmp_N, 32*nprocs /), Ntr_local = (/ tmp_N, 32 /)
        integer :: Ntr_global(0:1),Ntr_local(0:1)

        ! Host-side gather descriptors (缩约组装阶段, 32 列块)
        integer, allocatable, dimension(:,:) :: gather_Nrd_local,gather_Ntr_local
        integer, allocatable, dimension(:,:) :: gather_Nrd_start,gather_Ntr_start
        ! Device-side copies
        integer, allocatable, dimension(:,:), device :: gather_Nrd_local_d,gather_Ntr_local_d
        integer, allocatable, dimension(:,:), device :: gather_Nrd_start_d,gather_Ntr_start_d

        ! Host-side gather descriptors (解回传阶段, 4 列块)
        integer, allocatable, dimension(:,:) :: gather_Nrd_sol_local,gather_Ntr_sol_local
        integer, allocatable, dimension(:,:) :: gather_Nrd_sol_start,gather_Ntr_sol_start
        ! Device-side copies
        integer, allocatable, dimension(:,:), device :: gather_Nrd_sol_local_d,gather_Ntr_sol_local_d
        integer, allocatable, dimension(:,:), device :: gather_Nrd_sol_start_d,gather_Ntr_sol_start_d

        ! Host-side buffer descriptors (缩约组装阶段)
        integer, allocatable, dimension(:) :: bufsubsize_A,bufstart_A
        integer, allocatable, dimension(:) :: BIGbufsubsize_A,BIGbufstart_A
        integer, allocatable, dimension(:) :: bufsubsize_B,bufstart_B
        integer, allocatable, dimension(:) :: BIGbufsubsize_B,BIGbufstart_B

        ! Host-side buffer descriptors (解回传阶段, 4 列块)
        integer, allocatable, dimension(:) :: bufsubsize_sol_A,bufstart_sol_A
        integer, allocatable, dimension(:) :: bufsubsize_sol_B,bufstart_sol_B

        ! Device-side communication buffers
        real*8, allocatable, dimension(:), device :: BIGbuf_A, BIGbuf_B

        ! CUDA launch configurations
        !   t_* : thread block dimensions (dim3)
        !   b_* : grid dimensions       (dim3)
        !   tdma    : local pentadiagonal sweeps / update (覆盖 Nsys 线)
        !   rdtdma  : reduced banded solve (覆盖 tmp_N 线)
        !   pack/unpack 的 grid 与列数相关 (32 或 4), 在调用处按阶段计算
        type(dim3) :: t_tdma, t_rdtdma, t_pack
        type(dim3) :: b_tdma, b_rdtdma

        ! Device-side reduced data (Nsys x 28): 本地消元输出 (7 槽/方程, 无对角槽)
        real*8, allocatable, dimension(:,:), device :: rd
        ! Device-side reduced system (tmp_N x 32*nprocs): 带状(3,3), 8 槽/方程
        real*8, allocatable, dimension(:,:), device :: Atr
        ! Device-side reduced solution (tmp_N x 4*nprocs)
        real*8, allocatable, dimension(:,:), device :: Dtr
        ! Device-side interface solutions (Nsys x 4)
        real*8, allocatable, dimension(:,:), device :: Drd

    end type ptdma_plan_cuda

    !===================================================================
    ! ptdma_timing_cuda
    ! -----------------
    ! 性能测试阶段计时容器 (仅供 pascal_solver_profiled_penta 使用,
    ! 不影响快路径 pascal_solver)。各字段为本 rank 局部时间 (秒)。
    !===================================================================
    type, public :: ptdma_timing_cuda
        real(8) :: total = 0.0d0
        real(8) :: local_compute = 0.0d0
        real(8) :: pack_forward = 0.0d0
        real(8) :: mpi_forward = 0.0d0
        real(8) :: unpack_forward = 0.0d0
        real(8) :: reduced_compute = 0.0d0
        real(8) :: pack_backward = 0.0d0
        real(8) :: mpi_backward = 0.0d0
        real(8) :: unpack_backward = 0.0d0
        real(8) :: update_compute = 0.0d0
    end type ptdma_timing_cuda

contains

    !===================================================================
    ! Error handling helpers
    ! ----------------------
    ! API/configuration failures are fatal because the public solver API
    ! does not expose an ierr argument.  Abort the supplied communicator
    ! when MPI is active; otherwise terminate the local process.
    !===================================================================
    subroutine pascal_fail(message,communicator,error_code)
        implicit none
        character(len=*), intent(in) :: message
        integer, intent(in) :: communicator,error_code
        logical :: mpi_is_initialized
        integer :: ierr,abort_comm

        write(*,'(A)') 'PaScaL_TDMA_cuda_penta: '//trim(message)
        call MPI_INITIALIZED(mpi_is_initialized,ierr)
        if(ierr==MPI_SUCCESS .and. mpi_is_initialized) then
            abort_comm = communicator
            if(abort_comm==MPI_COMM_NULL) abort_comm = MPI_COMM_WORLD
            call MPI_ABORT(abort_comm,error_code,ierr)
        endif
        error stop 1
    end subroutine pascal_fail

    subroutine pascal_check_mpi(status,communicator,where)
        implicit none
        integer, intent(in) :: status,communicator
        character(len=*), intent(in) :: where

        if(status/=MPI_SUCCESS) then
            write(*,*) 'PaScaL_TDMA_cuda_penta: MPI error code ',status
            call pascal_fail('MPI failure at '//trim(where),communicator,status)
        endif
    end subroutine pascal_check_mpi

    subroutine pascal_check_cuda(status,communicator,where)
        implicit none
        integer, intent(in) :: status,communicator
        character(len=*), intent(in) :: where

        if(status/=0) then
            write(*,*) 'PaScaL_TDMA_cuda_penta: CUDA error code ',status
            call pascal_fail('CUDA failure at '//trim(where),communicator,status)
        endif
    end subroutine pascal_check_cuda

    subroutine pascal_check_allocation(status,communicator,where)
        implicit none
        integer, intent(in) :: status,communicator
        character(len=*), intent(in) :: where

        if(status/=0) then
            write(*,*) 'PaScaL_TDMA_cuda_penta: allocation status ',status
            call pascal_fail('allocation failure at '//trim(where),communicator,status)
        endif
    end subroutine pascal_check_allocation

    subroutine pascal_validate_solver(plan,Nsys,Nrow)
        implicit none
        type(ptdma_plan_cuda), intent(in) :: plan
        integer, intent(in) :: Nsys,Nrow

        if(.not.plan%is_created) then
            call pascal_fail('solver called before pascal_plan_create',MPI_COMM_WORLD,1)
        endif
        if(Nsys/=plan%Nsys) then
            call pascal_fail('solver Nsys does not match plan Nsys',plan%ptdma_world,1)
        endif
        if(Nrow<5) then
            call pascal_fail('Nrow must be at least 5 for the pentadiagonal solver',plan%ptdma_world,1)
        endif
        if(.not.allocated(plan%rd) .or. .not.allocated(plan%Atr) .or. &
           .not.allocated(plan%Dtr) .or. .not.allocated(plan%Drd)) then
            call pascal_fail('plan work arrays are not allocated',plan%ptdma_world,1)
        endif
    end subroutine pascal_validate_solver

    !===================================================================
    ! pascal_plan_create
    ! -------------------
    ! 设置五对角求解计划:
    !   - 计算本 rank 线数 tmp_N 与最大线数 tmp_Nmax
    !   - 分配 device 工作数组 (rd,Atr,Dtr,Drd)
    !   - 构建缩约组装 (32 列) 与解回传 (4 列) 两套 gather 描述符
    !   - 构建通信缓冲与偏移
    !   - 确定 CUDA 启动配置
    !===================================================================
    subroutine pascal_plan_create(plan,Nsys,commworld,myrank,nprocs,tmp_opti1,tmp_opti2)
        implicit none
        type(ptdma_plan_cuda) :: plan
        integer :: Nsys
        integer :: commworld,myrank,nprocs
        integer :: i,ia,ib,ierr,actual_rank,actual_nprocs,alloc_status
        logical :: mpi_is_initialized

        integer :: tmp_opti1,tmp_opti2,tmp_opti3
        integer, allocatable, dimension(:) :: tmp_int

        call MPI_INITIALIZED(mpi_is_initialized,ierr)
        if(ierr/=MPI_SUCCESS) then
            call pascal_fail('MPI_INITIALIZED failed',MPI_COMM_WORLD,ierr)
        endif
        if(.not.mpi_is_initialized) then
            call pascal_fail('pascal_plan_create requires MPI_Init',MPI_COMM_NULL,1)
        endif
        if(plan%is_created) then
            call pascal_fail('pascal_plan_create called on an active plan',commworld,1)
        endif
        if(commworld==MPI_COMM_NULL) then
            call pascal_fail('communicator must not be MPI_COMM_NULL',MPI_COMM_WORLD,1)
        endif
        if(nprocs<=0) then
            call pascal_fail('nprocs must be positive',commworld,1)
        endif
        if(myrank<0 .or. myrank>=nprocs) then
            call pascal_fail('myrank must satisfy 0 <= myrank < nprocs',commworld,1)
        endif
        if(Nsys<=0) then
            call pascal_fail('Nsys must be positive',commworld,1)
        endif
        if(Nsys<nprocs) then
            call pascal_fail('Nsys must be at least nprocs; empty partitions are unsupported',commworld,1)
        endif
        if(tmp_opti1<1 .or. tmp_opti1>1024) then
            call pascal_fail('tdma thread count must be in [1,1024]',commworld,1)
        endif
        if(tmp_opti2<1 .or. tmp_opti2>1024) then
            call pascal_fail('reduced-solver thread count must be in [1,1024]',commworld,1)
        endif

        call MPI_COMM_RANK(commworld,actual_rank,ierr)
        call pascal_check_mpi(ierr,commworld,'MPI_COMM_RANK in pascal_plan_create')
        call MPI_COMM_SIZE(commworld,actual_nprocs,ierr)
        call pascal_check_mpi(ierr,commworld,'MPI_COMM_SIZE in pascal_plan_create')
        if(actual_rank/=myrank) then
            call pascal_fail('myrank does not match communicator rank',commworld,1)
        endif
        if(actual_nprocs/=nprocs) then
            call pascal_fail('nprocs does not match communicator size',commworld,1)
        endif

        allocate(tmp_int(0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'tmp_int')

        ! MPI context
        plan%ptdma_world = commworld
        plan%myrank = myrank
        plan%nprocs = nprocs
        plan%Nsys = Nsys

        ! 本 rank 的线范围 [ia,ib] 与线数
        call para(0,Nsys-1,nprocs,myrank,ia,ib)
        plan%tmp_N = ib-ia+1
        tmp_int(:) = 0
        do i = 0, nprocs-1
            call para(0,Nsys-1,nprocs,i,ia,ib)
            tmp_int(i) = ib-ia+1
        end do
        plan%tmp_Nmax = maxval(tmp_int(:))

        ! 缩约数据尺寸 (28 列/线, 7 槽/方程, 无对角槽)
        ! 缩约系统尺寸 (32 列/线, 8 槽/方程/rank, 组装时 D 槽填 1)
        plan%Nrd_global(0:1) = (/Nsys,28/)
        plan%Nrd_local(0:1)  = (/plan%tmp_N,28/)
        plan%Ntr_global(0:1) = (/plan%tmp_N,32*nprocs/)
        plan%Ntr_local(0:1)  = (/plan%tmp_N,32/)

        ! Device arrays
        allocate(plan%rd(0:Nsys-1,0:27),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'plan%rd')
        allocate(plan%Atr(0:plan%tmp_N-1,0:32*nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'plan%Atr')
        allocate(plan%Dtr(0:plan%tmp_N-1,0:4*nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'plan%Dtr')
        allocate(plan%Drd(0:Nsys-1,0:3),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'plan%Drd')

        ! 缩约组装阶段 gather 描述符 (32 列块)
        allocate(plan%gather_Nrd_local(0:1,0:nprocs-1),plan%gather_Ntr_local(0:1,0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'forward gather sizes')
        allocate(plan%gather_Nrd_local_d(0:1,0:nprocs-1),plan%gather_Ntr_local_d(0:1,0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'forward device gather sizes')
        allocate(plan%gather_Nrd_start(0:1,0:nprocs-1),plan%gather_Ntr_start(0:1,0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'forward gather starts')
        allocate(plan%gather_Nrd_start_d(0:1,0:nprocs-1),plan%gather_Ntr_start_d(0:1,0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'forward device gather starts')

        do i = 0, nprocs-1
            call para(0,Nsys-1,nprocs,i,ia,ib)
            ! 缩约数据子块: 每 rank 的线数 x 28 列 (7 槽/方程, 无对角槽)
            plan%gather_Nrd_local(0:1,i) = (/ib-ia+1,28/)
            plan%gather_Nrd_start(0:1,i) = (/sum(plan%gather_Nrd_local(0,0:i))-plan%gather_Nrd_local(0,i),0/)
            plan%gather_Ntr_local(0:1,i) = plan%Ntr_local(0:1)
            plan%gather_Ntr_start(0:1,i) = (/0,sum(plan%gather_Ntr_local(1,0:i))-plan%gather_Ntr_local(1,i)/)
        end do

        ! 解回传阶段 gather 描述符 (4 列块)
        allocate(plan%gather_Nrd_sol_local(0:1,0:nprocs-1),plan%gather_Ntr_sol_local(0:1,0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'backward gather sizes')
        allocate(plan%gather_Nrd_sol_local_d(0:1,0:nprocs-1),plan%gather_Ntr_sol_local_d(0:1,0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'backward device gather sizes')
        allocate(plan%gather_Nrd_sol_start(0:1,0:nprocs-1),plan%gather_Ntr_sol_start(0:1,0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'backward gather starts')
        allocate(plan%gather_Nrd_sol_start_d(0:1,0:nprocs-1),plan%gather_Ntr_sol_start_d(0:1,0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'backward device gather starts')

        do i = 0, nprocs-1
            plan%gather_Ntr_sol_local(0:1,i) = (/plan%tmp_N,4/)
            plan%gather_Ntr_sol_start(0:1,i) = (/0,4*i/)
            plan%gather_Nrd_sol_local(0:1,i) = (/plan%gather_Nrd_local(0,i),4/)
            plan%gather_Nrd_sol_start(0:1,i) = (/plan%gather_Nrd_start(0,i),0/)
        end do

        ! Device-side copies of gather descriptors
        plan%gather_Nrd_local_d    = plan%gather_Nrd_local
        plan%gather_Ntr_local_d    = plan%gather_Ntr_local
        plan%gather_Nrd_start_d    = plan%gather_Nrd_start
        plan%gather_Ntr_start_d    = plan%gather_Ntr_start
        plan%gather_Nrd_sol_local_d= plan%gather_Nrd_sol_local
        plan%gather_Ntr_sol_local_d= plan%gather_Ntr_sol_local
        plan%gather_Nrd_sol_start_d= plan%gather_Nrd_sol_start
        plan%gather_Ntr_sol_start_d= plan%gather_Ntr_sol_start

        ! 缩约组装阶段缓冲描述符
        allocate(plan%bufsubsize_A(0:nprocs-1),plan%bufstart_A(0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'forward send descriptors')
        allocate(plan%BIGbufsubsize_A(0:nprocs-1),plan%BIGbufstart_A(0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'forward aggregate send descriptors')
        allocate(plan%bufsubsize_B(0:nprocs-1),plan%bufstart_B(0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'forward receive descriptors')
        allocate(plan%BIGbufsubsize_B(0:nprocs-1),plan%BIGbufstart_B(0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'forward aggregate receive descriptors')

        ! 解回传阶段缓冲描述符
        allocate(plan%bufsubsize_sol_A(0:nprocs-1),plan%bufstart_sol_A(0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'backward receive descriptors')
        allocate(plan%bufsubsize_sol_B(0:nprocs-1),plan%bufstart_sol_B(0:nprocs-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'backward send descriptors')

        do i = 0, nprocs-1
            ! 组装阶段: 单数组 rd (28 列, 7 槽/方程), 无需 3x
            plan%bufsubsize_A(i) = plan%gather_Nrd_local(0,i)*plan%gather_Nrd_local(1,i)
            plan%bufstart_A(i)   = sum(plan%bufsubsize_A(0:i)) - plan%bufsubsize_A(i)
            plan%BIGbufsubsize_A(i) = plan%bufsubsize_A(i)
            plan%BIGbufstart_A(i)   = plan%bufstart_A(i)

            ! 组装阶段接收块: tmp_N 线 x 28 列 (7 槽/方程, 无对角槽)
            plan%bufsubsize_B(i) = plan%gather_Ntr_local(0,i)*28
            plan%bufstart_B(i)   = sum(plan%bufsubsize_B(0:i)) - plan%bufsubsize_B(i)
            plan%BIGbufsubsize_B(i) = plan%bufsubsize_B(i)
            plan%BIGbufstart_B(i)   = plan%bufstart_B(i)

            ! 解回传阶段: Dtr(tmp_N x 4nprocs) -> Drd(Nsys x 4)
            plan%bufsubsize_sol_B(i) = plan%tmp_N*4
            plan%bufstart_sol_B(i)   = i*plan%tmp_N*4
            plan%bufsubsize_sol_A(i) = plan%gather_Nrd_local(0,i)*4
            plan%bufstart_sol_A(i)   = sum(plan%bufsubsize_sol_A(0:i)) - plan%bufsubsize_sol_A(i)
        end do

        ! Device-side consolidated communication buffers
        allocate(plan%BIGbuf_A(0:sum(plan%BIGbufsubsize_A(:))-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'plan%BIGbuf_A')
        allocate(plan%BIGbuf_B(0:sum(plan%BIGbufsubsize_B(:))-1),stat=alloc_status)
        call pascal_check_allocation(alloc_status,commworld,'plan%BIGbuf_B')

        ! CUDA thread block sizes
        tmp_opti3 = plan%tmp_Nmax
        if(tmp_opti3>128) tmp_opti3 = 128

        plan%t_tdma   = dim3(tmp_opti1,1,1)
        plan%t_rdtdma = dim3(tmp_opti2,1,1)
        plan%t_pack   = dim3(tmp_opti3,1,1)

        plan%b_tdma   = dim3(ceiling(dble(Nsys)/dble(plan%t_tdma%x)),1,1)
        plan%b_rdtdma = dim3(ceiling(dble(plan%tmp_N)/dble(plan%t_rdtdma%x)),1,1)

        deallocate(tmp_int)
        plan%is_created = .true.
    end subroutine pascal_plan_create

    !===================================================================
    ! pascal_plan_clean
    ! -----------------
    ! 释放计划相关所有 host/device 数组。
    !===================================================================
    subroutine pascal_plan_clean(plan)
        implicit none
        type(ptdma_plan_cuda) :: plan

        if(.not.plan%is_created) return

        ! Device work arrays
        if(allocated(plan%rd)) deallocate(plan%rd)
        if(allocated(plan%Atr)) deallocate(plan%Atr)
        if(allocated(plan%Dtr)) deallocate(plan%Dtr)
        if(allocated(plan%Drd)) deallocate(plan%Drd)

        ! Host/device gather descriptors
        if(allocated(plan%gather_Nrd_local)) deallocate(plan%gather_Nrd_local)
        if(allocated(plan%gather_Ntr_local)) deallocate(plan%gather_Ntr_local)
        if(allocated(plan%gather_Nrd_local_d)) deallocate(plan%gather_Nrd_local_d)
        if(allocated(plan%gather_Ntr_local_d)) deallocate(plan%gather_Ntr_local_d)
        if(allocated(plan%gather_Nrd_start)) deallocate(plan%gather_Nrd_start)
        if(allocated(plan%gather_Ntr_start)) deallocate(plan%gather_Ntr_start)
        if(allocated(plan%gather_Nrd_start_d)) deallocate(plan%gather_Nrd_start_d)
        if(allocated(plan%gather_Ntr_start_d)) deallocate(plan%gather_Ntr_start_d)
        if(allocated(plan%gather_Nrd_sol_local)) deallocate(plan%gather_Nrd_sol_local)
        if(allocated(plan%gather_Ntr_sol_local)) deallocate(plan%gather_Ntr_sol_local)
        if(allocated(plan%gather_Nrd_sol_local_d)) deallocate(plan%gather_Nrd_sol_local_d)
        if(allocated(plan%gather_Ntr_sol_local_d)) deallocate(plan%gather_Ntr_sol_local_d)
        if(allocated(plan%gather_Nrd_sol_start)) deallocate(plan%gather_Nrd_sol_start)
        if(allocated(plan%gather_Ntr_sol_start)) deallocate(plan%gather_Ntr_sol_start)
        if(allocated(plan%gather_Nrd_sol_start_d)) deallocate(plan%gather_Nrd_sol_start_d)
        if(allocated(plan%gather_Ntr_sol_start_d)) deallocate(plan%gather_Ntr_sol_start_d)

        ! Buffer descriptors and buffers
        if(allocated(plan%bufsubsize_A)) deallocate(plan%bufsubsize_A)
        if(allocated(plan%bufstart_A)) deallocate(plan%bufstart_A)
        if(allocated(plan%BIGbufsubsize_A)) deallocate(plan%BIGbufsubsize_A)
        if(allocated(plan%BIGbufstart_A)) deallocate(plan%BIGbufstart_A)
        if(allocated(plan%bufsubsize_B)) deallocate(plan%bufsubsize_B)
        if(allocated(plan%bufstart_B)) deallocate(plan%bufstart_B)
        if(allocated(plan%BIGbufsubsize_B)) deallocate(plan%BIGbufsubsize_B)
        if(allocated(plan%BIGbufstart_B)) deallocate(plan%BIGbufstart_B)
        if(allocated(plan%bufsubsize_sol_A)) deallocate(plan%bufsubsize_sol_A)
        if(allocated(plan%bufstart_sol_A)) deallocate(plan%bufstart_sol_A)
        if(allocated(plan%bufsubsize_sol_B)) deallocate(plan%bufsubsize_sol_B)
        if(allocated(plan%bufstart_sol_B)) deallocate(plan%bufstart_sol_B)
        if(allocated(plan%BIGbuf_A)) deallocate(plan%BIGbuf_A)
        if(allocated(plan%BIGbuf_B)) deallocate(plan%BIGbuf_B)

        plan%ptdma_world = MPI_COMM_NULL
        plan%myrank = -1
        plan%nprocs = 0
        plan%Nsys = 0
        plan%tmp_N = 0
        plan%tmp_Nmax = 0
        plan%is_created = .false.
    end subroutine pascal_plan_clean

    !===================================================================
    ! pascal_setcudathread
    ! --------------------
    ! (占位, 未实现)
    !===================================================================
    subroutine pascal_setcudathread(plan,int_tdma,int_rdtdma,int_pack)
        implicit none
        type(ptdma_plan_cuda) :: plan
        type(dim3) :: int_tdma,int_rdtdma,int_pack
    end subroutine pascal_setcudathread

    !===================================================================
    ! pascal_solver
    ! -------------
    ! 顶层驱动 (五对角 PaScaL-TDMA):
    !   单进程  : tdma_penta_cuda (5-band 直接求解)
    !   多进程  :
    !     S1 本地消元          tdma_modified_penta
    !     S2 打包+Alltoallv    pascalpack / pascal_a2av
    !     S3 组装 (对角随流)   pascalunpack -> Atr
    !     S4 缩约求解          tdma_banded_cuda -> Dtr
    !     S5 接口解回传        pascalpack / pascal_a2av / pascalunpack -> Drd
    !     S6 回带重建          pascal_update_penta
    !
    ! A,B,C,D,E : 五对角系数 (输入), RHS 原位写回解 (输出)
    !===================================================================
    subroutine pascal_solver(plan,A,B,C,D,E,RHS,Nsys,Nrow)
        implicit none
        type(ptdma_plan_cuda) :: plan
        integer :: Nsys,Nrow
        real*8, device :: A(0:Nsys-1,0:Nrow-1),B(0:Nsys-1,0:Nrow-1),C(0:Nsys-1,0:Nrow-1)
        real*8, device :: D(0:Nsys-1,0:Nrow-1),E(0:Nsys-1,0:Nrow-1),RHS(0:Nsys-1,0:Nrow-1)

        integer :: i,cuda_status
        integer :: tmp_N

        call pascal_validate_solver(plan,Nsys,Nrow)
        tmp_N = plan%tmp_N

        if(plan%nprocs==1) then
            ! 单进程: 五对角直接求解 (每线程一条线)
            call tdma_penta_cuda<<<plan%b_tdma,plan%t_tdma>>>(A,B,C,D,E,RHS, Nsys, Nrow)
            cuda_status = cudaGetLastError()
            call pascal_check_cuda(cuda_status,plan%ptdma_world,'tdma_penta_cuda launch')
        else
            !----------------------------------------------------------------
            ! S1: 本地改进消元 -> rd(Nsys,28) (7 槽/方程, 无对角槽)
            !----------------------------------------------------------------
            call tdma_modified_penta<<<plan%b_tdma,plan%t_tdma>>>(A,B,C,D,E,RHS, plan%rd, Nsys, Nrow)
            cuda_status = cudaGetLastError()
            call pascal_check_cuda(cuda_status,plan%ptdma_world,'tdma_modified_penta launch')

            !----------------------------------------------------------------
            ! S2: 打包 rd (28 列块, 7 槽/方程, 无对角槽, 每目标 1 次)
            !----------------------------------------------------------------
            do i = 0, plan%nprocs-1
                call pascalpack<<<dim3(ceiling(dble(plan%tmp_Nmax)/dble(plan%t_pack%x)),28,1),plan%t_pack>>>( &
                    plan%rd,Nsys,28                                                        &
                    ,plan%gather_Nrd_local_d(0:1,i),plan%gather_Nrd_start_d(0:1,i)        &
                    ,plan%BIGbuf_A,sum(plan%BIGbufsubsize_A(:)),plan%BIGbufstart_A(i)      )
            end do
            cuda_status = cudaGetLastError()
            call pascal_check_cuda(cuda_status,plan%ptdma_world,'forward pascalpack launch')

            !----------------------------------------------------------------
            ! 缩约数据 Alltoallv
            !----------------------------------------------------------------
            call pascal_a2av( plan%BIGbuf_A,sum(plan%BIGbufsubsize_A(:)),plan%BIGbufsubsize_A,plan%BIGbufstart_A &
                            , plan%BIGbuf_B,sum(plan%BIGbufsubsize_B(:)),plan%BIGbufsubsize_B,plan%BIGbufstart_B &
                            , plan%nprocs, plan%ptdma_world)

            !----------------------------------------------------------------
            ! S3: 解包组装缩约系统 Atr(tmp_N,32*nprocs)
            !   pascalunpack_penta: 28 列块 -> 8 槽布局, 对角槽 D 填回 1
            !----------------------------------------------------------------
            do i = 0, plan%nprocs-1
                call pascalunpack_penta<<<dim3(ceiling(dble(tmp_N)/dble(plan%t_pack%x)),28,1),plan%t_pack>>>( &
                    plan%Atr,tmp_N,32*plan%nprocs                                           &
                    ,plan%gather_Ntr_start_d(0:1,i)                                        &
                    ,plan%BIGbuf_B,sum(plan%BIGbufsubsize_B(:)),plan%BIGbufstart_B(i)      )
            end do
            cuda_status = cudaGetLastError()
            call pascal_check_cuda(cuda_status,plan%ptdma_world,'pascalunpack_penta launch')

            !----------------------------------------------------------------
            ! S4: 带状(3,3)缩约求解 -> Dtr(tmp_N,4*nprocs)
            !----------------------------------------------------------------
            call tdma_banded_cuda<<<plan%b_rdtdma,plan%t_rdtdma>>>(plan%Atr,plan%Dtr, tmp_N, 4*plan%nprocs)
            cuda_status = cudaGetLastError()
            call pascal_check_cuda(cuda_status,plan%ptdma_world,'tdma_banded_cuda launch')

            !----------------------------------------------------------------
            ! S5: 打包缩约解 Dtr (4 列块)
            !----------------------------------------------------------------
            do i = 0, plan%nprocs-1
                call pascalpack<<<dim3(ceiling(dble(tmp_N)/dble(plan%t_pack%x)),4,1),plan%t_pack>>>( &
                    plan%Dtr,tmp_N,4*plan%nprocs                                             &
                    ,plan%gather_Ntr_sol_local_d(0:1,i),plan%gather_Ntr_sol_start_d(0:1,i)  &
                    ,plan%BIGbuf_B,sum(plan%bufsubsize_sol_B(:)),plan%bufstart_sol_B(i)     )
            end do
            cuda_status = cudaGetLastError()
            call pascal_check_cuda(cuda_status,plan%ptdma_world,'backward pascalpack launch')

            !----------------------------------------------------------------
            ! 接口解 Alltoallv
            !----------------------------------------------------------------
            call pascal_a2av( plan%BIGbuf_B,sum(plan%bufsubsize_sol_B(:)),plan%bufsubsize_sol_B,plan%bufstart_sol_B &
                            , plan%BIGbuf_A,sum(plan%bufsubsize_sol_A(:)),plan%bufsubsize_sol_A,plan%bufstart_sol_A &
                            , plan%nprocs, plan%ptdma_world)

            !----------------------------------------------------------------
            ! 解包接口解 -> Drd(Nsys,4)
            !----------------------------------------------------------------
            do i = 0, plan%nprocs-1
                call pascalunpack<<<dim3(ceiling(dble(plan%tmp_Nmax)/dble(plan%t_pack%x)),4,1),plan%t_pack>>>( &
                    plan%Drd,Nsys,4                                                          &
                    ,plan%gather_Nrd_sol_local_d(0:1,i),plan%gather_Nrd_sol_start_d(0:1,i)  &
                    ,plan%BIGbuf_A,sum(plan%bufsubsize_sol_A(:)),plan%bufstart_sol_A(i)     )
            end do
            cuda_status = cudaGetLastError()
            call pascal_check_cuda(cuda_status,plan%ptdma_world,'pascalunpack launch')

            !----------------------------------------------------------------
            ! S6: 回带重建
            !----------------------------------------------------------------
            call pascal_update_penta<<<plan%b_tdma,plan%t_tdma>>>(A,B,C,D,E,RHS, plan%Drd, Nsys, Nrow)
            cuda_status = cudaGetLastError()
            call pascal_check_cuda(cuda_status,plan%ptdma_world,'pascal_update_penta launch')

        endif
    end subroutine pascal_solver

    !===================================================================
    ! pascal_timing_reset
    ! -------------------
    ! 清零计时容器。
    !===================================================================
    subroutine pascal_timing_reset(timing)
        implicit none
        type(ptdma_timing_cuda) :: timing

        timing%total = 0.0d0
        timing%local_compute = 0.0d0
        timing%pack_forward = 0.0d0
        timing%mpi_forward = 0.0d0
        timing%unpack_forward = 0.0d0
        timing%reduced_compute = 0.0d0
        timing%pack_backward = 0.0d0
        timing%mpi_backward = 0.0d0
        timing%unpack_backward = 0.0d0
        timing%update_compute = 0.0d0
    end subroutine pascal_timing_reset

    !===================================================================
    ! pascal_solver_profiled_penta
    ! ----------------------------
    ! 性能测试入口: 与 pascal_solver 数值流程完全相同, 仅在各阶段周围
    ! 插入 CudaDeviceSynchronize + MPI_Wtime 以便分阶段计时。
    !   timing 字段与三对角版一致:
    !     local_compute   : S1 本地改进消元
    !     pack_forward    : S2 打包 rd
    !     mpi_forward     : 缩约数据 Alltoallv
    !     unpack_forward  : S3 解包组装 Atr
    !     reduced_compute : S4 带状缩约求解
    !     pack_backward   : S5 打包缩约解
    !     mpi_backward    : 接口解 Alltoallv
    !     unpack_backward : 解包接口解 -> Drd
    !     update_compute  : S6 回带重建
    ! 仅用于性能测试; 生产路径请调用 pascal_solver (无计时开销)。
    !===================================================================
    subroutine pascal_solver_profiled_penta(plan,A,B,C,D,E,RHS,Nsys,Nrow,timing)
        implicit none
        type(ptdma_plan_cuda) :: plan
        type(ptdma_timing_cuda) :: timing
        integer :: Nsys,Nrow
        real*8, device :: A(0:Nsys-1,0:Nrow-1),B(0:Nsys-1,0:Nrow-1),C(0:Nsys-1,0:Nrow-1)
        real*8, device :: D(0:Nsys-1,0:Nrow-1),E(0:Nsys-1,0:Nrow-1),RHS(0:Nsys-1,0:Nrow-1)

        integer :: i, ierr
        real(8) :: t_start, t_phase

        call pascal_validate_solver(plan,Nsys,Nrow)
        call pascal_timing_reset(timing)
        ierr = CudaDeviceSynchronize()
        call pascal_check_cuda(ierr,plan%ptdma_world,'profiled solver initial synchronization')
        t_start = MPI_WTIME()

        if(plan%nprocs==1) then
            t_phase = MPI_WTIME()
            call tdma_penta_cuda<<<plan%b_tdma,plan%t_tdma>>>(A,B,C,D,E,RHS, Nsys, Nrow)
            ierr = CudaDeviceSynchronize()
            call pascal_check_cuda(ierr,plan%ptdma_world,'profiled tdma_penta_cuda')
            timing%local_compute = MPI_WTIME() - t_phase
            timing%total = MPI_WTIME() - t_start
        else
            t_phase = MPI_WTIME()
            call tdma_modified_penta<<<plan%b_tdma,plan%t_tdma>>>(A,B,C,D,E,RHS, plan%rd, Nsys, Nrow)
            ierr = CudaDeviceSynchronize()
            call pascal_check_cuda(ierr,plan%ptdma_world,'profiled tdma_modified_penta')
            timing%local_compute = MPI_WTIME() - t_phase

            t_phase = MPI_WTIME()
            do i = 0, plan%nprocs-1
                call pascalpack<<<dim3(ceiling(dble(plan%tmp_Nmax)/dble(plan%t_pack%x)),28,1),plan%t_pack>>>( &
                    plan%rd,Nsys,28, plan%gather_Nrd_local_d(0:1,i),plan%gather_Nrd_start_d(0:1,i)   &
                    ,plan%BIGbuf_A,sum(plan%BIGbufsubsize_A(:)),plan%BIGbufstart_A(i)      )
            end do
            ierr = CudaDeviceSynchronize()
            call pascal_check_cuda(ierr,plan%ptdma_world,'profiled forward pascalpack')
            timing%pack_forward = MPI_WTIME() - t_phase

            t_phase = MPI_WTIME()
            call pascal_a2av( plan%BIGbuf_A,sum(plan%BIGbufsubsize_A(:)),plan%BIGbufsubsize_A,plan%BIGbufstart_A &
                            , plan%BIGbuf_B,sum(plan%BIGbufsubsize_B(:)),plan%BIGbufsubsize_B,plan%BIGbufstart_B &
                            , plan%nprocs, plan%ptdma_world)
            timing%mpi_forward = MPI_WTIME() - t_phase

            t_phase = MPI_WTIME()
            do i = 0, plan%nprocs-1
                call pascalunpack_penta<<<dim3(ceiling(dble(plan%tmp_N)/dble(plan%t_pack%x)),28,1),plan%t_pack>>>( &
                    plan%Atr,plan%tmp_N,32*plan%nprocs, plan%gather_Ntr_start_d(0:1,i)          &
                    ,plan%BIGbuf_B,sum(plan%BIGbufsubsize_B(:)),plan%BIGbufstart_B(i)      )
            end do
            ierr = CudaDeviceSynchronize()
            call pascal_check_cuda(ierr,plan%ptdma_world,'profiled pascalunpack_penta')
            timing%unpack_forward = MPI_WTIME() - t_phase

            t_phase = MPI_WTIME()
            call tdma_banded_cuda<<<plan%b_rdtdma,plan%t_rdtdma>>>(plan%Atr,plan%Dtr, plan%tmp_N, 4*plan%nprocs)
            ierr = CudaDeviceSynchronize()
            call pascal_check_cuda(ierr,plan%ptdma_world,'profiled tdma_banded_cuda')
            timing%reduced_compute = MPI_WTIME() - t_phase

            t_phase = MPI_WTIME()
            do i = 0, plan%nprocs-1
                call pascalpack<<<dim3(ceiling(dble(plan%tmp_N)/dble(plan%t_pack%x)),4,1),plan%t_pack>>>( &
                    plan%Dtr,plan%tmp_N,4*plan%nprocs                                             &
                    ,plan%gather_Ntr_sol_local_d(0:1,i),plan%gather_Ntr_sol_start_d(0:1,i)  &
                    ,plan%BIGbuf_B,sum(plan%bufsubsize_sol_B(:)),plan%bufstart_sol_B(i)     )
            end do
            ierr = CudaDeviceSynchronize()
            call pascal_check_cuda(ierr,plan%ptdma_world,'profiled backward pascalpack')
            timing%pack_backward = MPI_WTIME() - t_phase

            t_phase = MPI_WTIME()
            call pascal_a2av( plan%BIGbuf_B,sum(plan%bufsubsize_sol_B(:)),plan%bufsubsize_sol_B,plan%bufstart_sol_B &
                            , plan%BIGbuf_A,sum(plan%bufsubsize_sol_A(:)),plan%bufsubsize_sol_A,plan%bufstart_sol_A &
                            , plan%nprocs, plan%ptdma_world)
            timing%mpi_backward = MPI_WTIME() - t_phase

            t_phase = MPI_WTIME()
            do i = 0, plan%nprocs-1
                call pascalunpack<<<dim3(ceiling(dble(plan%tmp_Nmax)/dble(plan%t_pack%x)),4,1),plan%t_pack>>>( &
                    plan%Drd,Nsys,4                                                          &
                    ,plan%gather_Nrd_sol_local_d(0:1,i),plan%gather_Nrd_sol_start_d(0:1,i)  &
                    ,plan%BIGbuf_A,sum(plan%bufsubsize_sol_A(:)),plan%bufstart_sol_A(i)     )
            end do
            ierr = CudaDeviceSynchronize()
            call pascal_check_cuda(ierr,plan%ptdma_world,'profiled pascalunpack')
            timing%unpack_backward = MPI_WTIME() - t_phase

            t_phase = MPI_WTIME()
            call pascal_update_penta<<<plan%b_tdma,plan%t_tdma>>>(A,B,C,D,E,RHS, plan%Drd, Nsys, Nrow)
            ierr = CudaDeviceSynchronize()
            call pascal_check_cuda(ierr,plan%ptdma_world,'profiled pascal_update_penta')
            timing%update_compute = MPI_WTIME() - t_phase

            timing%total = MPI_WTIME() - t_start
        endif
    end subroutine pascal_solver_profiled_penta

    !===================================================================
    ! para
    ! ----
    ! 1D 块划分 [nsta,nend] -> nprocs 段; 本 rank 得 [indx_a,indx_b]
    !===================================================================
    subroutine para(nsta,nend,nprocs,myrank,indx_a,indx_b)
        implicit none
        integer :: nsta,nend,nprocs,myrank,indx_a,indx_b
        integer :: iwork1, iwork2

        iwork1 = int((nend-nsta+1)/nprocs)
        iwork2 = mod((nend-nsta+1),nprocs)
        indx_a = myrank*iwork1 + nsta +min(myrank,iwork2)
        indx_b = indx_a + iwork1 -1
        if(iwork2 > myrank) indx_b = indx_b +1
    end subroutine para

    !===================================================================
    ! pascalpack
    ! ----------
    ! CUDA 核: 把 A 的 2D 子块打包进一维缓冲 (用于 Alltoallv 发送)
    !===================================================================
    attributes(global) subroutine pascalpack(A,n1,n2,pack_subsize,pack_start,buf_A,bufsize,bufpoint)
        use cudafor
        implicit none
        integer,value :: n1,n2,bufsize,bufpoint
        integer, device :: pack_subsize(0:1),pack_start(0:1)
        real*8, device :: A(0:n1-1,0:n2-1)
        real*8, device :: buf_A(0:bufsize-1)

        integer :: i,j
        integer :: indexi,indexj,indexbf

        i = (blockidx%x - 1)*blockdim%x + (threadidx%x-1)
        j = (blockidx%y - 1)*blockdim%y + (threadidx%y-1)

        indexi = i + pack_start(0)
        indexj = j + pack_start(1)

        ! 子块边界守卫: 保证 i/j 落在 pack_subsize 内, 防止线数不均衡时
        ! 网格多余线程越过本子块写入相邻块的缓冲
        if ( (i<pack_subsize(0))  &
        .and.(j<pack_subsize(1))  &
        .and.(indexi<n1).and.(indexj<n2)  ) then
            indexbf =i + j*pack_subsize(0) + bufpoint
            buf_A(indexbf) = A(indexi,indexj)
        end if
    end subroutine pascalpack

    !===================================================================
    ! pascalunpack
    ! ------------
    ! CUDA 核: 把一维缓冲解包回 A 的 2D 子块 (pascalpack 的逆)
    !===================================================================
    attributes(global) subroutine pascalunpack(A,n1,n2,pack_subsize,pack_start,buf_A,bufsize,bufpoint)
        use cudafor
        implicit none
        integer,value :: n1,n2,bufsize,bufpoint
        integer, device :: pack_subsize(0:1),pack_start(0:1)
        real*8, device :: A(0:n1-1,0:n2-1)
        real*8, device :: buf_A(0:bufsize-1)

        integer :: i,j
        integer :: indexi,indexj,indexbf

        i = (blockidx%x - 1)*blockdim%x + (threadidx%x-1)
        j = (blockidx%y - 1)*blockdim%y + (threadidx%y-1)

        indexi = i + pack_start(0)
        indexj = j + pack_start(1)

        ! 子块边界守卫 (同 pascalpack)
        if ( (i<pack_subsize(0))  &
        .and.(j<pack_subsize(1))  &
        .and.(indexi<n1).and.(indexj<n2)  ) then
            indexbf =i + j*pack_subsize(0) + bufpoint
            A(indexi,indexj) = buf_A(indexbf)
        end if
    end subroutine pascalunpack

    !===================================================================
    ! pascalunpack_penta
    ! ------------------
    ! S3 专用解包核: 把 28 列块 (7 槽/方程, 无对角槽) 组装进 Atr 的
    ! 32 列块 (8 槽/方程, 对角槽 D 填回 1)。
    !   pack_start 给 Atr 子块偏移: (0, 32*rank) —— 接收块在缓冲中按
    !   tmp_N 线 x 28 列连续排列, 缓冲行步长 = n1 = Atr 行数。
    !
    ! 与 pascalunpack (8 槽版) 的等价关系: 原 32 列版解包的 D 槽值恒为
    ! 1.d0 (S1 归一化写入), 本核以 1.d0 填回, 故组装的 Atr 与原版逐元素
    ! 一致, 后续求解 (tdma_banded_cuda) 完全不变。
    !   7 槽 -> 8 槽映射: [L3,L2,L1,U1,U2,U3,RHS] -> [L3,L2,L1,D,U1,U2,U3,RHS]
    !     槽 0,1,2 -> 0,1,2 ; 槽 3,4,5,6 -> 4,5,6,7
    !===================================================================
    attributes(global) subroutine pascalunpack_penta(A,n1,n2,pack_start,buf_A,bufsize,bufpoint)
        use cudafor
        implicit none
        integer,value :: n1,n2,bufsize,bufpoint
        integer, device :: pack_start(0:1)
        real*8, device :: A(0:n1-1,0:n2-1)
        real*8, device :: buf_A(0:bufsize-1)

        integer :: i,j,eq,slot7,slot8
        integer :: indexi,indexj,indexbf

        i = (blockidx%x - 1)*blockdim%x + (threadidx%x-1)
        j = (blockidx%y - 1)*blockdim%y + (threadidx%y-1)

        ! 边界守卫: 线数不均衡时网格 x 方向多余线程不写入
        if ( (i<n1).and.(j<28) ) then
            eq    = j/7                    ! 当前方程 0..3
            slot7 = j - eq*7               ! 7 槽内的位置
            if(slot7<3) then
                slot8 = slot7              ! L3,L2,L1 -> 0,1,2
            else
                slot8 = slot7 + 1          ! U1,U2,U3,RHS -> 4,5,6,7
            endif
            indexi = i + pack_start(0)
            indexj = pack_start(1) + eq*8 + slot8
            indexbf = i + j*n1 + bufpoint
            if(indexj<n2) then
                A(indexi,indexj) = buf_A(indexbf)
                ! 对角槽 D = 1 (本方程各线程写同值, 无竞争)
                A(indexi,pack_start(1) + eq*8 + 3) = 1.d0
            endif
        endif
    end subroutine pascalunpack_penta

    !===================================================================
    ! tdma_penta_cuda
    ! ---------------
    ! 单进程五对角直接求解: 每线程一条线, 5-band 原位 LU (L=U=2)。
    !   前向消元把 L 乘子写回 b/a 槽 (第 k 步消 k+1,k+2 行),
    !   回代用 U (c,d,e) 自后向前解。
    !   数值验证: 带宽保持 2 (无填充), 对角占优系统机器精度。
    !   (与分布式路径 S1 的约定一致: 只假设 nrow>=5)
    !===================================================================
    attributes(global) subroutine tdma_penta_cuda(a,b,c,d,e,rhs, nsys, nrow)
        integer, value :: nsys, nrow
        real*8, device :: a(0:nsys-1,0:nrow-1),b(0:nsys-1,0:nrow-1),c(0:nsys-1,0:nrow-1)
        real*8, device :: d(0:nsys-1,0:nrow-1),e(0:nsys-1,0:nrow-1),rhs(0:nsys-1,0:nrow-1)

        integer :: i,k
        integer :: ti
        real*8  :: piv, mult, tt

        ti = (threadidx%x-1)
        i  = (threadidx%x-1) + (blockidx%x-1)*blockdim%x
        if(i<nsys) then
            !------------ 前向消元 (L=2, U=2) ------------
            do k=0, nrow-2
                piv = c(i,k)
                ! 消行 k+1
                mult = b(i,k+1)/piv
                b(i,k+1) = mult
                c(i,k+1) = c(i,k+1) - mult*d(i,k)
                d(i,k+1) = d(i,k+1) - mult*e(i,k)
                rhs(i,k+1) = rhs(i,k+1) - mult*rhs(i,k)
                ! 消行 k+2 (若存在)
                if(k<=nrow-3) then
                    mult = a(i,k+2)/piv
                    a(i,k+2) = mult
                    b(i,k+2) = b(i,k+2) - mult*d(i,k)
                    c(i,k+2) = c(i,k+2) - mult*e(i,k)
                    rhs(i,k+2) = rhs(i,k+2) - mult*rhs(i,k)
                endif
            enddo
            !------------ 回代 ------------
            do k=nrow-1, 0, -1
                tt = rhs(i,k)
                if(k+1<nrow) tt = tt - d(i,k)*rhs(i,k+1)
                if(k+2<nrow) tt = tt - e(i,k)*rhs(i,k+2)
                rhs(i,k) = tt/c(i,k)
            enddo
        endif
    end subroutine tdma_penta_cuda

    !===================================================================
    ! tdma_modified_penta
    ! -------------------
    ! 五对角本地改进消元 (第 1 段)。
    ! 对每条线:
    !   前向扫 j=2..nrow-3 : x_j = P x_0 + Q x_1 + R x_{j+1} + S x_{j+2} + T
    !   后向扫 j=nrow-3..2 : x_j = P x_0 + Q x_1 + R x_{nrow-2} + S x_{nrow-1} + T
    !   重建系数 {P,Q,R,S,T} 原位写回 a,b,d,e,rhs (内点行)
    !   4 条边界方程 (行 0,1,nrow-2,nrow-1) 写入 rd (7 槽: [L3,L2,L1,U1,U2,U3,RHS])
    !
    ! 7 槽布局 (缩约行 m=4r+k 在缩约系统的列 = m + 偏移):
    !   与 8 槽 [L3,L2,L1,D,U1,U2,U3,RHS] 相比丢弃恒等对角槽 D (消元中归一化
    !   为 1), 传输量 32->28; D 槽由组装核 pascalunpack_penta 填回 1。
    !   rd0 (own x_0    ): L3=0, L2=x_-2, L1=x_-1, U1=x_1,   U2=x_N-2, U3=x_N-1
    !   rd1 (own x_1    ): L3=0, L2=x_-1, L1=x_0,  U1=x_N-2, U2=x_N-1, U3=0
    !   rd2 (own x_N-2  ): L3=0, L2=x_0,  L1=x_1,  U1=x_N-1, U2=x_N,   U3=0
    !   rd3 (own x_N-1  ): L3=x_0, L2=x_1, L1=x_N-2, U1=x_N,  U2=x_N+1, U3=0
    ! 假设 nrow>=5 (保证内点 x_2..x_N-3 非空)。
    ! 边界方程初值对角为 1 (消元中归一化), 随数据流动, 本地重建。
    !===================================================================
    attributes(global) subroutine tdma_modified_penta(a,b,c,d,e,rhs, rd, nsys, nrow)
        integer, value :: nsys, nrow
        real*8, device :: a(0:nsys-1,0:nrow-1),b(0:nsys-1,0:nrow-1),c(0:nsys-1,0:nrow-1)
        real*8, device :: d(0:nsys-1,0:nrow-1),e(0:nsys-1,0:nrow-1),rhs(0:nsys-1,0:nrow-1)
        real*8, device :: rd(0:nsys-1,0:27)

        ! 前向扫状态: (p..)=fw[j-2], (q..)=fw[j-1], (r..)=当前 fw[j]
        real*8 :: p2_sh,q2_sh,r2_sh,s2_sh,t2_sh
        real*8 :: p1_sh,q1_sh,r1_sh,s1_sh,t1_sh
        real*8 :: p0_sh,q0_sh,r0_sh,s0_sh,t0_sh
        ! 后向扫状态: (u..)=bw[j+2], (v..)=bw[j+1]
        real*8 :: u2_sh,v2_sh,w2_sh,x2_sh,y2_sh
        real*8 :: u1_sh,v1_sh,w1_sh,x1_sh,y1_sh
        real*8 :: u0_sh,v0_sh,w0_sh,x0_sh,y0_sh
        ! 当前行系数与临时量
        real*8 :: aj,bj,cj,dj,ej,tt,den,diag
        ! 边界方程槽位
        real*8 :: l3_sh,l2_sh,l1_sh,up1_sh,up2_sh,up3_sh,rr_sh
        integer :: i,j
        integer :: ti

        ti = (threadidx%x-1)
        i  = (threadidx%x-1) + (blockidx%x-1)*blockdim%x

        if(i<nsys) then
            !------------------------------------------------------------
            ! 前向扫 种子 j=2 : P=-A/C, Q=-B/C, R=-D/C, S=-E/C, T=rhs/C
            !------------------------------------------------------------
            den = c(i,2)
            p1_sh = -a(i,2)/den
            q1_sh = -b(i,2)/den
            r1_sh = -d(i,2)/den
            s1_sh = -e(i,2)/den
            t1_sh =  rhs(i,2)/den
            a(i,2)=p1_sh; b(i,2)=q1_sh; d(i,2)=r1_sh; e(i,2)=s1_sh; rhs(i,2)=t1_sh

            !------------------------------------------------------------
            ! 前向扫 种子 j=3 : 只代入 x_2, x_1 是接口
            !   x_3 仅当 nrow>=6 时是内点; nrow==5 时行3是边界行 x_{N-2},
            !   其原始系数不能被覆盖 (rd2 需要读取), 故不计算 fw[3]
            !------------------------------------------------------------
            if(nrow>=6) then
                den = c(i,3) + b(i,3)*r1_sh
                p0_sh = -b(i,3)*p1_sh/den
                q0_sh = -(a(i,3) + b(i,3)*q1_sh)/den
                r0_sh = -(d(i,3) + b(i,3)*s1_sh)/den
                s0_sh = -e(i,3)/den
                t0_sh = (rhs(i,3) - b(i,3)*t1_sh)/den
                a(i,3)=p0_sh; b(i,3)=q0_sh; d(i,3)=r0_sh; e(i,3)=s0_sh; rhs(i,3)=t0_sh
            endif

            !------------------------------------------------------------
            ! 前向扫 一般公式 j=4..nrow-3
            !   状态: p2..=fw[j-2], p1..=fw[j-1]
            !------------------------------------------------------------
            if(nrow>6) then
                p2_sh = p1_sh; q2_sh = q1_sh; r2_sh = r1_sh; s2_sh = s1_sh; t2_sh = t1_sh
                p1_sh = p0_sh; q1_sh = q0_sh; r1_sh = r0_sh; s1_sh = s0_sh; t1_sh = t0_sh
                do j=4, nrow-3
                    aj=a(i,j); bj=b(i,j); cj=c(i,j); dj=d(i,j); ej=e(i,j); tt=rhs(i,j)
                    den = cj + aj*(r2_sh*r1_sh + s2_sh) + bj*r1_sh
                    p0_sh = -(aj*(p2_sh + r2_sh*p1_sh) + bj*p1_sh)/den
                    q0_sh = -(aj*(q2_sh + r2_sh*q1_sh) + bj*q1_sh)/den
                    r0_sh = -(aj*r2_sh*s1_sh + bj*s1_sh + dj)/den
                    s0_sh = -ej/den
                    t0_sh = (tt - aj*(t2_sh + r2_sh*t1_sh) - bj*t1_sh)/den
                    a(i,j)=p0_sh; b(i,j)=q0_sh; d(i,j)=r0_sh; e(i,j)=s0_sh; rhs(i,j)=t0_sh
                    p2_sh=p1_sh; q2_sh=q1_sh; r2_sh=r1_sh; s2_sh=s1_sh; t2_sh=t1_sh
                    p1_sh=p0_sh; q1_sh=q0_sh; r1_sh=r0_sh; s1_sh=s0_sh; t1_sh=t0_sh
                enddo
            endif

            !------------------------------------------------------------
            ! 后向扫
            !   锚点 bw[nrow-3] = fw[nrow-3] (右耦合已是接口 x_{nrow-2},x_{nrow-1})
            !   状态: u1..=bw[j+1], u2..=bw[j+2]; 首个 j+2=nrow-2 为接口(恒等 R=1)
            !------------------------------------------------------------
            if(nrow>=5) then
                u1_sh = a(i,nrow-3)
                v1_sh = b(i,nrow-3)
                w1_sh = d(i,nrow-3)
                x1_sh = e(i,nrow-3)
                y1_sh = rhs(i,nrow-3)
                u2_sh = 0.d0; v2_sh = 0.d0; w2_sh = 1.d0; x2_sh = 0.d0; y2_sh = 0.d0
                do j=nrow-4, 2, -1
                    p0_sh = a(i,j); q0_sh = b(i,j); r0_sh = d(i,j); s0_sh = e(i,j); t0_sh = rhs(i,j)
                    u0_sh = p0_sh + r0_sh*u1_sh + s0_sh*u2_sh
                    v0_sh = q0_sh + r0_sh*v1_sh + s0_sh*v2_sh
                    w0_sh = r0_sh*w1_sh + s0_sh*w2_sh
                    x0_sh = r0_sh*x1_sh + s0_sh*x2_sh
                    y0_sh = t0_sh + r0_sh*y1_sh + s0_sh*y2_sh
                    a(i,j)=u0_sh; b(i,j)=v0_sh; d(i,j)=w0_sh; e(i,j)=x0_sh; rhs(i,j)=y0_sh
                    u2_sh=u1_sh; v2_sh=v1_sh; w2_sh=w1_sh; x2_sh=x1_sh; y2_sh=y1_sh
                    u1_sh=u0_sh; v1_sh=v0_sh; w1_sh=w0_sh; x1_sh=x0_sh; y1_sh=y0_sh
                enddo
            endif

            !------------------------------------------------------------
            ! 4 条边界方程 -> rd(i, 0..27)
            !   槽 [L3,L2,L1,U1,U2,U3,RHS] (对角槽=1 不写, 组装时填回)
            !   内点 k: 系数从 a,b,d,e,rhs(i,k) 读 {P,Q,R,S,T}
            !   假设 nrow>=5
            !------------------------------------------------------------
            !--- rd0 (行0, own x_0): a x_-2 + b x_-1 + c x_0 + d x_1 + e x_2
            l3_sh=0.d0; l2_sh=a(i,0); l1_sh=b(i,0); up1_sh=d(i,0); up2_sh=0.d0; up3_sh=0.d0
            rr_sh=rhs(i,0); diag=c(i,0)
            if(nrow>=5) then    ! 代入 x_2 (内部): x_1->U1, x_{N-2}->U2, x_{N-1}->U3
                diag  = diag  + e(i,0)*a(i,2)
                up1_sh= up1_sh+ e(i,0)*b(i,2)
                up2_sh= up2_sh+ e(i,0)*d(i,2)
                up3_sh= up3_sh+ e(i,0)*e(i,2)
                rr_sh = rr_sh - e(i,0)*rhs(i,2)
            endif
            rd(i,0)=l3_sh/diag; rd(i,1)=l2_sh/diag; rd(i,2)=l1_sh/diag
            rd(i,3)=up1_sh/diag; rd(i,4)=up2_sh/diag; rd(i,5)=up3_sh/diag; rd(i,6)=rr_sh/diag

            !--- rd1 (行1, own x_1): a x_-1 + b x_0 + c x_1 + d x_2 + e x_3
            l3_sh=0.d0; l2_sh=a(i,1); l1_sh=b(i,1); up1_sh=0.d0; up2_sh=0.d0; up3_sh=0.d0
            rr_sh=rhs(i,1); diag=c(i,1)
            if(nrow>=5) then    ! 代入 x_2 (内部): x_0->L1, x_1->D, x_{N-2}->U1, x_{N-1}->U2
                l1_sh= l1_sh+ d(i,1)*a(i,2)
                diag = diag + d(i,1)*b(i,2)
                up1_sh=up1_sh+d(i,1)*d(i,2)
                up2_sh=up2_sh+d(i,1)*e(i,2)
                rr_sh = rr_sh - d(i,1)*rhs(i,2)
            endif
            if(nrow>=6) then    ! 代入 x_3 (内部)
                l1_sh= l1_sh+ e(i,1)*a(i,3)
                diag = diag + e(i,1)*b(i,3)
                up1_sh=up1_sh+e(i,1)*d(i,3)
                up2_sh=up2_sh+e(i,1)*e(i,3)
                rr_sh = rr_sh - e(i,1)*rhs(i,3)
            else                ! nrow==5: x_3 = x_{N-2} 接口 -> U1
                up1_sh=up1_sh+e(i,1)
            endif
            rd(i,7)=0.d0; rd(i,8)=l2_sh/diag; rd(i,9)=l1_sh/diag
            rd(i,10)=up1_sh/diag; rd(i,11)=up2_sh/diag; rd(i,12)=0.d0; rd(i,13)=rr_sh/diag

            !--- rd2 (行 nrow-2, own x_{N-2}): a x_{N-4}+b x_{N-3}+c x_{N-2}+d x_{N-1}+e x_N
            !    L2/L1 对应 x_0/x_1, 由代入 x_{N-4},x_{N-3} 填充, 初始为 0
            l3_sh=0.d0; l2_sh=0.d0; l1_sh=0.d0; up1_sh=d(i,nrow-2); up2_sh=e(i,nrow-2)
            up3_sh=0.d0; rr_sh=rhs(i,nrow-2); diag=c(i,nrow-2)
            if(nrow>=6) then    ! 代入 x_{N-4} (内部): x_0->L2, x_1->L1, x_{N-2}->D, x_{N-1}->U1
                l2_sh= l2_sh+ a(i,nrow-2)*a(i,nrow-4)
                l1_sh= l1_sh+ a(i,nrow-2)*b(i,nrow-4)
                diag = diag + a(i,nrow-2)*d(i,nrow-4)
                up1_sh=up1_sh+a(i,nrow-2)*e(i,nrow-4)
                rr_sh = rr_sh - a(i,nrow-2)*rhs(i,nrow-4)
            else                ! nrow==5: x_{N-4}=x_1 接口 -> L1
                l1_sh= l1_sh+ a(i,nrow-2)
            endif
            if(nrow>=5) then    ! 代入 x_{N-3} (内部)
                l2_sh= l2_sh+ b(i,nrow-2)*a(i,nrow-3)
                l1_sh= l1_sh+ b(i,nrow-2)*b(i,nrow-3)
                diag = diag + b(i,nrow-2)*d(i,nrow-3)
                up1_sh=up1_sh+b(i,nrow-2)*e(i,nrow-3)
                rr_sh = rr_sh - b(i,nrow-2)*rhs(i,nrow-3)
            endif
            rd(i,14)=0.d0; rd(i,15)=l2_sh/diag; rd(i,16)=l1_sh/diag
            rd(i,17)=up1_sh/diag; rd(i,18)=up2_sh/diag; rd(i,19)=0.d0; rd(i,20)=rr_sh/diag

            !--- rd3 (行 nrow-1, own x_{N-1}): a x_{N-3}+b x_{N-2}+c x_{N-1}+d x_N+e x_{N+1}
            l3_sh=0.d0; l2_sh=0.d0; l1_sh=0.d0; up1_sh=d(i,nrow-1); up2_sh=e(i,nrow-1); up3_sh=0.d0
            rr_sh=rhs(i,nrow-1); diag=c(i,nrow-1)
            if(nrow>=5) then    ! 代入 x_{N-3} (内部): x_0->L3, x_1->L2, x_{N-2}->L1, x_{N-1}->D
                l3_sh= l3_sh+ a(i,nrow-1)*a(i,nrow-3)
                l2_sh= l2_sh+ a(i,nrow-1)*b(i,nrow-3)
                l1_sh= l1_sh+ a(i,nrow-1)*d(i,nrow-3)
                diag = diag + a(i,nrow-1)*e(i,nrow-3)
                rr_sh = rr_sh - a(i,nrow-1)*rhs(i,nrow-3)
            endif
            l1_sh= l1_sh+ b(i,nrow-1)     ! x_{N-2} 接口 -> L1
            rd(i,21)=l3_sh/diag; rd(i,22)=l2_sh/diag; rd(i,23)=l1_sh/diag
            rd(i,24)=up1_sh/diag; rd(i,25)=up2_sh/diag; rd(i,26)=0.d0; rd(i,27)=rr_sh/diag

        endif
    end subroutine tdma_modified_penta

    !===================================================================
    ! tdma_banded_cuda
    ! ----------------
    ! 五对角缩约系统求解 (带状(3,3), 单位对角初值)。
    !   每条线一个线程; 原位消元于 rd(line, 8m..8m+7) = [L3,L2,L1,D,U1,U2,U3,RHS]
    !   L 乘子覆盖 L 槽, U 因子留 D/U 槽, RHS 槽变 y; 回代写入 sol(line,m)
    !   数值验证: L/U 带宽保持 3 (无填充), 对角占优系统机器精度。
    !===================================================================
    attributes(global) subroutine tdma_banded_cuda(rd, sol, nsys, nrd)
        integer, value :: nsys, nrd              ! nrd = 4*nprocs
        real*8, device :: rd(0:nsys-1,0:8*nrd-1)
        real*8, device :: sol(0:nsys-1,0:nrd-1)

        integer :: i,k,m,j,off,ti
        real*8  :: piv, mult, tt

        ti = (threadidx%x-1)
        i  = (threadidx%x-1) + (blockidx%x-1)*blockdim%x

        if(i<nsys) then
            !------------ 前向消元 + 前代 (Ly=b) ------------
            do k=0, nrd-2
                piv = rd(i,8*k+3)                ! 当前主元 (随消元变化)
                do m=k+1, min(k+3,nrd-1)
                    off = m-k                    ! 1..3 -> L1(slot2),L2(slot1),L3(slot0)
                    mult = rd(i,8*m+(3-off))/piv
                    rd(i,8*m+(3-off)) = mult     ! 存 L 乘子
                    do j=k+1, min(k+3,m+3)
                        rd(i,8*m+(j-m+3)) = rd(i,8*m+(j-m+3)) - mult*rd(i,8*k+(j-k+3))
                    enddo
                    rd(i,8*m+7) = rd(i,8*m+7) - mult*rd(i,8*k+7)
                enddo
            enddo
            !------------ 回代 (Ux=y) ------------
            do m=nrd-1, 0, -1
                tt = rd(i,8*m+7)
                do j=m+1, min(m+3,nrd-1)
                    tt = tt - rd(i,8*m+(j-m+3))*sol(i,j)
                enddo
                sol(i,m) = tt/rd(i,8*m+3)        ! 除以 U 对角
            enddo
        endif
    end subroutine tdma_banded_cuda

    !===================================================================
    ! pascal_update_penta
    ! -------------------
    ! 五对角回带: 用 4 个接口解重建全部未知数。
    !   内点 j=2..nrow-3: x_j = T + P x_0 + Q x_1 + R x_{N-2} + S x_{N-1}
    !     (P,Q,R,S,T 由 S1 后向扫存于 a,b,d,e,rhs 的对应行)
    !   接口点 {0,1,nrow-2,nrow-1} 直接赋 Drd 的 4 个接口解
    !===================================================================
    attributes(global) subroutine pascal_update_penta(a,b,c,d,e,rhs, d_rd, nsys, nrow)
        integer, value :: nsys, nrow
        real*8, device :: a(0:nsys-1,0:nrow-1),b(0:nsys-1,0:nrow-1),c(0:nsys-1,0:nrow-1)
        real*8, device :: d(0:nsys-1,0:nrow-1),e(0:nsys-1,0:nrow-1),rhs(0:nsys-1,0:nrow-1)
        real*8, device :: d_rd(0:nsys-1,0:3)

        real*8 :: x0_sh,x1_sh,xn2_sh,xn1_sh
        integer :: i,j
        integer :: ti

        ti = (threadidx%x-1)
        i  = (threadidx%x-1) + (blockidx%x-1)*blockdim%x
        if(i<nsys) then
            x0_sh  = d_rd(i,0)
            x1_sh  = d_rd(i,1)
            xn2_sh = d_rd(i,2)
            xn1_sh = d_rd(i,3)

            ! 接口点直接赋解
            rhs(i,0)      = x0_sh
            rhs(i,1)      = x1_sh
            rhs(i,nrow-2) = xn2_sh
            rhs(i,nrow-1) = xn1_sh

            ! 内点重建 (4 项修正)
            do j=2, nrow-3
                rhs(i,j) = rhs(i,j) + a(i,j)*x0_sh + b(i,j)*x1_sh + d(i,j)*xn2_sh + e(i,j)*xn1_sh
            enddo
        endif
    end subroutine pascal_update_penta

    !===================================================================
    ! pascal_a2av
    ! -----------
    ! MPI_ALLTOALLV 封装。
    !   pascal_cuda_aware_mpi == .true.  : device 指针直传 MPI (需 CUDA-aware MPI)
    !   pascal_cuda_aware_mpi == .false. : host 中转 (兼容任意 MPI, 默认)
    !===================================================================
    subroutine pascal_a2av(A,Asize,sendcount,senddisp, B,Bsize,recvcount,recvdisp, nprocs,communicator)
        use mpi
        use cudafor
        implicit none
        integer:: Asize,Bsize
        integer :: nprocs
        real*8, dimension(:), device :: A(0:Asize-1),B(0:Bsize-1)
        integer, dimension(:) :: sendcount(0:nprocs-1),senddisp(0:nprocs-1)
        integer, dimension(:) :: recvcount(0:nprocs-1),recvdisp(0:nprocs-1)
        integer :: communicator

        integer :: ierr,alloc_status
        real*8, allocatable :: hA(:), hB(:)

        ierr = CudaDeviceSynchronize()
        call pascal_check_cuda(ierr,communicator,'pascal_a2av pre-MPI synchronization')

        if(pascal_cuda_aware_mpi) then
            ! 直传 device 指针 (需 CUDA-aware MPI)
            call MPI_ALLTOALLV(A,sendcount,senddisp,MPI_DOUBLE, B,recvcount,recvdisp,MPI_DOUBLE, communicator, ierr)
        else
            ! host 中转: device -> host -> MPI -> host -> device
            allocate(hA(0:Asize-1), hB(0:Bsize-1),stat=alloc_status)
            call pascal_check_allocation(alloc_status,communicator,'pascal_a2av host staging')
            hA = A
            call MPI_ALLTOALLV(hA,sendcount,senddisp,MPI_DOUBLE, hB,recvcount,recvdisp,MPI_DOUBLE, communicator, ierr)
            if (ierr == MPI_SUCCESS) B = hB
            deallocate(hA,hB)
        endif

        call pascal_check_mpi(ierr,communicator,'MPI_ALLTOALLV in pascal_a2av')
    end subroutine pascal_a2av

end module PaScaL_TDMA_cuda_penta

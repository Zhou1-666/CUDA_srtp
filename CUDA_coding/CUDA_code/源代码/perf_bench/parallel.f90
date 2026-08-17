!=======================================================================
! parallel.f90
! ------------
! 对照组 (control group/pentadiagonal.f90) 依赖的 MPI 拓扑模块。
!
! 参考求解器支持 dir='x'/'y'/'z' 三方向求解, 使用 3D 笛卡尔拓扑
! (npx, npy, npz)。本基准测试统一沿 z 方向求解 (与实验组 PaScaL_TDMA
! 的 1D 线划分等价), 故拓扑取 npx=npy=1, npz=nprocs, 全部 rank 沿 z。
! comm_x / comm_y 在 z 路径中不被使用, 置为 MPI_COMM_WORLD 占位。
!
! 注意: use 关联默认 public —— pentadiagonal.f90 通过本模块获得
!   MPI_AllToAll 等 MPI 符号, 以及 MPI_REAL_WP。
!=======================================================================
module parallel
    use mpi
    use precision
    implicit none

    ! 对照组使用的 MPI 数据类型 (双精度)
    integer, parameter :: MPI_REAL_WP = MPI_DOUBLE_PRECISION

    ! 3D 笛卡尔拓扑分解 (本基准: 1 x 1 x nprocs)
    integer :: npx = 1
    integer :: npy = 1
    integer :: npz = 1

    ! 各方向 rank 编号
    integer :: irank_x = 0
    integer :: irank_y = 0
    integer :: irank_z = 0

    ! 各方向通信子
    integer :: comm_x = MPI_COMM_WORLD
    integer :: comm_y = MPI_COMM_WORLD
    integer :: comm_z = MPI_COMM_WORLD

    ! 各方向周期性 (0=非周期, 1=周期); 基准测试均为非周期
    integer :: periodicity(3) = (/0, 0, 0/)

contains

    !===================================================================
    ! parallel_init
    ! -------------
    ! 用 MPI_COMM_WORLD (或 comm 参数) 初始化 z 方向 1D 拓扑。
    !   comm    : 全局通信子
    !   periodic: 三方向周期性 (仅 z 方向的 nper 会被参考求解器读取)
    !===================================================================
    subroutine parallel_init(comm, periodic)
        implicit none
        integer, intent(in) :: comm
        logical, intent(in) :: periodic(3)
        integer :: myrank, nprocs, ierr

        call MPI_COMM_RANK(comm, myrank, ierr)
        call MPI_COMM_SIZE(comm, nprocs, ierr)

        npx = 1
        npy = 1
        npz = nprocs
        irank_x = 0
        irank_y = 0
        irank_z = myrank
        comm_x = comm
        comm_y = comm
        comm_z = comm

        periodicity = 0
        if (periodic(1)) periodicity(1) = 1
        if (periodic(2)) periodicity(2) = 1
        if (periodic(3)) periodicity(3) = 1
    end subroutine parallel_init

end module parallel

!=======================================================================
! benchmark_penta.f90
! -------------------
! 五对角求解器性能 + 精度对比基准驱动。
!
! 对比对象 (同一 x≡1 精确解测试系统, 同一全局问题):
!   penta-exp   : 实验组 PaScaL_TDMA_cuda_penta (28 槽通信, 分阶段计时)
!   penta-ref   : 对照组 ref_pentadiagonal.f90::pentadiagonal_cuda (论文原版,
!                 MPI_Wtime 整段计时, 无阶段分解)
!   penta-serial: 对照组 pentadiagonal_serial_cuda (单 GPU 串行基线, 仅 np=1)
!
! 显存优化: exp 与对照组共用同一组设备系数数组 (1-based A_sh..R_sh),
!   实验组按 Fortran 下界重映射按 0-based 读取同一份数据。峰值设备数组
!   从 16 个减到 10 个二维等价数组：A..R 为 6 个，s1(:,:,1:2) 与
!   s2(:,:,1:2) 各为 2 个；容量模型按实际 allocate 计数，兼容单卡小显存。
!
! 用法:
!   mpirun -np NP ./benchmark_penta n1 n2 n3 iterations [tdma_threads] [reduced_threads]
!   np=1 时运行 penta-exp + penta-serial; np>1 时运行 penta-exp + penta-ref。
!
! CSV 输出 (rank 0, stdout): 性能阶段计时 (各 rank MAX / 总平均) + 精度
!   (RMS/∞范数误差 vs 精确解 x≡1, exp-other 互差)。
!
! 统计协议: 每迭代前用设备核重建输入 (不计入计时窗口), iterations 为计时
!   次数; 报告层对多次迭代取中位数。
!=======================================================================
program benchmark_penta
    use mpi
    use cudafor
    use precision
    use parallel
    use PaScaL_TDMA_cuda_penta
    use bench_kernels
    implicit none

    integer :: ierr, myrank, nprocs
    integer :: ngpu, gpurank
    integer :: n1, n2, n3, iterations, forward_slots
    integer :: nthread_modithomas, nthread_reduced
    integer :: n1sub, n2sub, n3sub, nsys, nrow
    integer :: ia, ib, iter, i
    integer :: nrow_min, nrow_max
    integer :: head_rank, tail_rank
    integer, parameter :: n_timing_fields = 13

    ! 共享设备数组 (1-based 布局, exp 按 0-based 重映射读取同一份数据)
    real(WP), allocatable, dimension(:,:), device :: A_sh, B_sh, C_sh, D_sh, E_sh, R_sh
    real(WP), allocatable, dimension(:,:,:), device :: s1_d, s2_d
    ! 宿主解副本 (用于精度/互差)
    real(WP), allocatable, dimension(:,:) :: B_h, R_h

    type(ptdma_plan_cuda) :: plan
    type(ptdma_timing_cuda) :: t_exp

    ! 计时与统计
    real(8) :: t0
    real(8) :: phase_local(n_timing_fields)
    real(8) :: phase_max_exp(n_timing_fields), phase_max_oth(n_timing_fields)
    real(8) :: phase_sum(n_timing_fields)
    real(8) :: total_exp_avg, total_oth_avg

    ! 精度
    real(8) :: loc_err2_exp, loc_linf_exp, loc_err2_oth, loc_linf_oth, loc_cross
    real(8) :: glo_err2_exp, glo_linf_exp, glo_err2_oth, glo_linf_oth, glo_cross
    real(8) :: rms_exp, rms_oth, npoints

    character(len=16) :: oth_label
    character(len=32) :: case_mode, slot_mode
    integer :: env_stat, parse_stat
    logical :: run_ref_dist, use_mfd
    real(8) :: t_exp_sum = 0.d0, t_oth_sum = 0.d0

    call MPI_INIT(ierr)
    call MPI_COMM_SIZE(MPI_COMM_WORLD, nprocs, ierr)
    call MPI_COMM_RANK(MPI_COMM_WORLD, myrank, ierr)

    ! 测试用例: PENTA_TEST_CASE = exact1 (默认, x≡1) | manufactured (制造解, 已知正确结果)
    case_mode = "exact1"
    call get_environment_variable("PENTA_TEST_CASE", case_mode, status=env_stat)
    if (env_stat /= 0) case_mode = "exact1"      ! 变量未设置时保持默认
    use_mfd = (trim(case_mode) == "manufactured")

    ! Forward layout selector.  The public API defaults to 28; the benchmark
    ! exposes the same switch through an environment variable for paired runs.
    forward_slots = PASCAL_PENTA_FORWARD_SLOTS_28
    slot_mode = ""
    call get_environment_variable("PENTA_FORWARD_SLOTS", slot_mode, status=env_stat)
    if(env_stat==0 .and. len_trim(slot_mode)>0) then
        read(slot_mode,*,iostat=parse_stat) forward_slots
        if(parse_stat/=0) then
            if(myrank==0) write(*,'(A,A)') 'invalid PENTA_FORWARD_SLOTS: ',trim(slot_mode)
            call MPI_ABORT(MPI_COMM_WORLD,1,ierr)
        endif
    endif

    call parse_positive_arg(1, 128, n1, "n1", myrank)
    call parse_positive_arg(2, 128, n2, "n2", myrank)
    call parse_positive_arg(3, 2048, n3, "n3", myrank)
    call parse_positive_arg(4, 10, iterations, "iterations", myrank)
    call parse_positive_arg(5, 128, nthread_modithomas, "tdma_threads", myrank)
    call parse_positive_arg(6, 128, nthread_reduced, "reduced_threads", myrank)
    if (command_argument_count() > 6) then
        if (myrank == 0) then
            write(*,*) "usage: benchmark_penta n1 n2 n3 iterations [tdma_threads] [reduced_threads]"
        endif
        call MPI_ABORT(MPI_COMM_WORLD, 1, ierr)
    endif

    ! CUDA: 单卡 (多 rank 共享同一 GPU)
    ierr = cudaGetDeviceCount(ngpu)
    if (ngpu <= 0) then
        if (myrank == 0) write(*,*) "No CUDA device is visible."
        call MPI_ABORT(MPI_COMM_WORLD, 1, ierr)
    endif
    gpurank = mod(myrank, ngpu)
    ierr = cudaSetDevice(gpurank)
    ierr = cudaDeviceSynchronize()

    ! 对照组拓扑初始化 (z 方向 1D, 非周期)
    call parallel_init(MPI_COMM_WORLD, (/ .false., .false., .false. /))

    ! z 方向全局划分
    call para(0, n3 - 1, nprocs, myrank, ia, ib)
    n1sub = n1
    n2sub = n2
    n3sub = ib - ia + 1
    nsys  = n1sub * n2sub
    nrow  = n3sub
    head_rank = 0
    tail_rank = 0
    if (myrank == 0)          head_rank = 1
    if (myrank == nprocs - 1) tail_rank = 1

    call MPI_REDUCE(n3sub, nrow_min, 1, MPI_INTEGER, MPI_MIN, 0, MPI_COMM_WORLD, ierr)
    call MPI_REDUCE(n3sub, nrow_max, 1, MPI_INTEGER, MPI_MAX, 0, MPI_COMM_WORLD, ierr)

    ! np==1 时跑串行基线 (penta-serial), 否则跑参考分布式 (penta-ref)
    run_ref_dist = (nprocs > 1)

    ! ---------------- 分配 (共享数组, 峰值 8 个设备数组) ---------------
    allocate(A_sh(1:nsys,1:nrow), B_sh(1:nsys,1:nrow), C_sh(1:nsys,1:nrow))
    allocate(D_sh(1:nsys,1:nrow), E_sh(1:nsys,1:nrow), R_sh(1:nsys,1:nrow))
    allocate(s1_d(1:nsys,1:nrow,1:2), s2_d(1:nsys,1:nrow,1:2))
    allocate(B_h(1:nsys,1:nrow), R_h(1:nsys,1:nrow))

    call pascal_plan_create(plan, nsys, MPI_COMM_WORLD, myrank, nprocs, &
                            nthread_modithomas, nthread_reduced, forward_slots)

    ! ---------------- CSV 表头 (rank 0) ---------------
    if (myrank == 0) call write_csv_header()

    ! ---------------- 主循环 ---------------
    do iter = 0, iterations - 1
        call MPI_BARRIER(MPI_COMM_WORLD, ierr)

        ! ---- 实验组 (分阶段计时) ----
        if (use_mfd) then
            call init_ref_mfd<<<dim3(ceiling(dble(nsys*nrow)/128.d0),1,1),dim3(128,1,1)>>>( &
                A_sh,B_sh,C_sh,D_sh,E_sh,R_sh, nsys, nrow, ia, n3)
        else
            call init_ref<<<dim3(ceiling(dble(nsys*nrow)/128.d0),1,1),dim3(128,1,1)>>>( &
                A_sh,B_sh,C_sh,D_sh,E_sh,R_sh, nsys, nrow, head_rank, tail_rank)
        endif
        call pascal_solver_profiled_penta(plan, A_sh,B_sh,C_sh,D_sh,E_sh,R_sh, nsys, nrow, t_exp)
        call fill_exp_timing(t_exp, phase_local)

        call MPI_REDUCE(phase_local, phase_max_exp, n_timing_fields, MPI_DOUBLE_PRECISION, MPI_MAX, 0, MPI_COMM_WORLD, ierr)
        call MPI_REDUCE(phase_local, phase_sum, n_timing_fields, MPI_DOUBLE_PRECISION, MPI_SUM, 0, MPI_COMM_WORLD, ierr)
        total_exp_avg = phase_sum(1) / dble(nprocs)
        t_exp_sum = t_exp_sum + total_exp_avg

        if (iter == 0) B_h = R_sh      ! exp 解 (R_sh 被 exp 覆写为解)

        ! ---- 对照组 (整段计时) ----
        if (use_mfd) then
            call init_ref_mfd<<<dim3(ceiling(dble(nsys*nrow)/128.d0),1,1),dim3(128,1,1)>>>( &
                A_sh,B_sh,C_sh,D_sh,E_sh,R_sh, nsys, nrow, ia, n3)
        else
            call init_ref<<<dim3(ceiling(dble(nsys*nrow)/128.d0),1,1),dim3(128,1,1)>>>( &
                A_sh,B_sh,C_sh,D_sh,E_sh,R_sh, nsys, nrow, head_rank, tail_rank)
        endif
        call MPI_BARRIER(MPI_COMM_WORLD, ierr)
        t0 = MPI_WTIME()
        if (run_ref_dist) then
            call pentadiagonal_cuda(A_sh,B_sh,C_sh,D_sh,E_sh,R_sh, nrow, nsys, 'z', s1_d, s2_d)
            oth_label = "ref"
        else
            call pentadiagonal_serial_cuda(A_sh,B_sh,C_sh,D_sh,E_sh,R_sh, nrow, nsys)
            oth_label = "serial"
        endif
        ierr = CudaDeviceSynchronize()
        phase_local(:) = 0.d0
        phase_local(1) = MPI_WTIME() - t0

        call MPI_REDUCE(phase_local, phase_max_oth, n_timing_fields, MPI_DOUBLE_PRECISION, MPI_MAX, 0, MPI_COMM_WORLD, ierr)
        call MPI_REDUCE(phase_local, phase_sum, n_timing_fields, MPI_DOUBLE_PRECISION, MPI_SUM, 0, MPI_COMM_WORLD, ierr)
        total_oth_avg = phase_sum(1) / dble(nprocs)
        t_oth_sum = t_oth_sum + total_oth_avg

        if (iter == 0) R_h = R_sh      ! 对照解

        ! ---- 精度 (iter==0 计算一次; 每迭代输入重建, 结果恒定) ----
        if (iter == 0) then
            call err_vs_case(B_h, nsys, nrow, ia, n3, case_mode, loc_err2_exp, loc_linf_exp)
            call err_vs_case(R_h, nsys, nrow, ia, n3, case_mode, loc_err2_oth, loc_linf_oth)
            loc_cross = 0.d0
            do i = 1, nsys
                loc_cross = max(loc_cross, maxval(abs(B_h(i,1:nrow) - R_h(i,1:nrow))))
            end do
            call MPI_REDUCE(loc_err2_exp, glo_err2_exp, 1, MPI_DOUBLE_PRECISION, MPI_SUM, 0, MPI_COMM_WORLD, ierr)
            call MPI_REDUCE(loc_linf_exp, glo_linf_exp, 1, MPI_DOUBLE_PRECISION, MPI_MAX, 0, MPI_COMM_WORLD, ierr)
            call MPI_REDUCE(loc_err2_oth, glo_err2_oth, 1, MPI_DOUBLE_PRECISION, MPI_SUM, 0, MPI_COMM_WORLD, ierr)
            call MPI_REDUCE(loc_linf_oth, glo_linf_oth, 1, MPI_DOUBLE_PRECISION, MPI_MAX, 0, MPI_COMM_WORLD, ierr)
            call MPI_REDUCE(loc_cross, glo_cross, 1, MPI_DOUBLE_PRECISION, MPI_MAX, 0, MPI_COMM_WORLD, ierr)
            npoints = dble(nsys) * dble(n3)
            rms_exp = sqrt(glo_err2_exp / npoints)
            rms_oth = sqrt(glo_err2_oth / npoints)
        endif

        ! ---- CSV 行 (rank 0) ----
        if (myrank == 0) then
            call write_csv_row("exp", nprocs, n1, n2, n3, nsys, nrow_min, nrow_max, &
                               iter, iterations, phase_max_exp, total_exp_avg, &
                               rms_exp, glo_linf_exp, glo_cross)
            call write_csv_row(oth_label, nprocs, n1, n2, n3, nsys, nrow_min, nrow_max, &
                               iter, iterations, phase_max_oth, total_oth_avg, &
                               rms_oth, glo_linf_oth, glo_cross)
        endif
    end do

    ! ---- 屏幕汇总输出 (rank 0) ----
    if (myrank == 0) then
        write(*,'(A)') ''
        write(*,'(A)') '==== PaScaL-TDMA 五对角验证 (vs 对照组) ===='
        write(*,'(A,I0,A,I0,A,I0,A,I0)') 'config : ', n1, 'x', n2, 'x', n3, '   np = ', nprocs
        write(*,'(A,A)') 'case   : ', trim(case_mode)
        write(*,'(A,I0)') 'forward slots: ', plan%forward_slots
        write(*,'(A)') 'solver     avg_time(s)  err_rms       err_linf      cross_err'
        write(*,'(A,ES11.4,ES14.4,ES14.4,ES14.4)') ' exp        ', t_exp_sum/dble(iterations), rms_exp, glo_linf_exp, glo_cross
        write(*,'(A,ES11.4,ES14.4,ES14.4,ES14.4)') ' ' // trim(oth_label) // '     ', t_oth_sum/dble(iterations), rms_oth, glo_linf_oth, glo_cross
    endif

    call pascal_plan_clean(plan)
    deallocate(A_sh,B_sh,C_sh,D_sh,E_sh,R_sh, s1_d, s2_d, B_h, R_h)
    call MPI_FINALIZE(ierr)

contains

    subroutine parse_positive_arg(index, default_value, value, name, rank)
        integer, intent(in) :: index, default_value, rank
        integer, intent(out) :: value
        character(len=*), intent(in) :: name
        character(len=64) :: arg
        integer :: stat, ierr_local

        value = default_value
        if (command_argument_count() >= index) then
            call get_command_argument(index, arg)
            read(arg, *, iostat=stat) value
            if (stat /= 0 .or. value <= 0) then
                if (rank == 0) write(*,*) trim(name), " must be a positive integer."
                call MPI_ABORT(MPI_COMM_WORLD, 1, ierr_local)
            endif
        endif
    end subroutine parse_positive_arg

    subroutine fill_exp_timing(t, vals)
        type(ptdma_timing_cuda), intent(in) :: t
        real(8), intent(out) :: vals(n_timing_fields)

        vals(1)  = t%total
        vals(2)  = t%local_compute
        vals(3)  = t%pack_forward
        vals(4)  = t%mpi_forward
        vals(5)  = t%unpack_forward
        vals(6)  = t%reduced_compute
        vals(7)  = t%pack_backward
        vals(8)  = t%mpi_backward
        vals(9)  = t%unpack_backward
        vals(10) = t%update_compute
        vals(11) = t%local_compute + t%reduced_compute + t%update_compute
        vals(12) = t%mpi_forward + t%mpi_backward
        vals(13) = t%pack_forward + t%unpack_forward + t%pack_backward + t%unpack_backward
    end subroutine fill_exp_timing

    ! 制造解的宿主版参考场: x_true(j) = 1 + 0.1 sin(2πj/n3) + 0.05 cos(4πj/n3)
    real(WP) function xt_ref_host(g, n3)
        integer, intent(in) :: g, n3
        real(8) :: pi
        pi = 4.d0*atan(1.d0)
        xt_ref_host = 1.0_WP + 0.1_WP*sin(2.d0*pi*dble(g)/dble(n3)) &
                             + 0.05_WP*cos(4.d0*pi*dble(g)/dble(n3))
    end function xt_ref_host

    ! 误差 vs 已知解 (exact1: x≡1; manufactured: x_true 场)
    subroutine err_vs_case(sol, nsys, nrow, ia, n3, case_mode, err2, linf)
        real(WP), intent(in) :: sol(1:nsys,1:nrow)
        integer, intent(in) :: nsys, nrow, ia, n3
        character(len=*), intent(in) :: case_mode
        real(8), intent(out) :: err2, linf
        integer :: l, k, g
        real(WP) :: xr

        err2 = 0.d0
        linf = 0.d0
        do l = 1, nsys
            do k = 1, nrow
                g = ia + (k - 1)
                if (trim(case_mode) == "manufactured") then
                    xr = xt_ref_host(g, n3)
                else
                    xr = 1.0_WP
                endif
                err2 = err2 + (sol(l,k) - xr)**2
                linf = max(linf, abs(sol(l,k) - xr))
            end do
        end do
    end subroutine err_vs_case

    subroutine write_csv_header()
        write(*,'(A)',advance='no') "solver,implementation,nranks,n1,n2,n3,nsys,"
        write(*,'(A)',advance='no') "nrow_min,nrow_max,iter,iterations,mpi_mode,forward_slots,"
        write(*,'(A)',advance='no') "total_s_max,total_s_avg,"
        write(*,'(A)',advance='no') "local_compute_s_max,pack_forward_s_max,mpi_forward_s_max,"
        write(*,'(A)',advance='no') "unpack_forward_s_max,reduced_compute_s_max,pack_backward_s_max,"
        write(*,'(A)',advance='no') "mpi_backward_s_max,unpack_backward_s_max,update_compute_s_max,"
        write(*,'(A)',advance='no') "compute_s_max,communication_s_max,packing_s_max,"
        write(*,'(A)') "err_rms,err_linf,cross_err_max"
    end subroutine write_csv_header

    subroutine write_csv_row(impl, nprocs_arg, n1_arg, n2_arg, n3_arg, nsys_arg, &
                             nrow_min_arg, nrow_max_arg, iter_arg, iterations_arg, &
                             phase_max_arg, total_avg_arg, err_rms_arg, err_linf_arg, cross_arg)
        character(len=*), intent(in) :: impl
        integer, intent(in) :: nprocs_arg, n1_arg, n2_arg, n3_arg, nsys_arg
        integer, intent(in) :: nrow_min_arg, nrow_max_arg, iter_arg, iterations_arg
        real(8), intent(in) :: phase_max_arg(n_timing_fields), total_avg_arg
        real(8), intent(in) :: err_rms_arg, err_linf_arg, cross_arg
        integer :: j

        write(*,'(A)',advance='no') "penta,"
        write(*,'(A)',advance='no') trim(impl), ","
        write(*,'(I0,A)',advance='no') nprocs_arg, ","
        write(*,'(I0,A)',advance='no') n1_arg, ","
        write(*,'(I0,A)',advance='no') n2_arg, ","
        write(*,'(I0,A)',advance='no') n3_arg, ","
        write(*,'(I0,A)',advance='no') nsys_arg, ","
        write(*,'(I0,A)',advance='no') nrow_min_arg, ","
        write(*,'(I0,A)',advance='no') nrow_max_arg, ","
        write(*,'(I0,A)',advance='no') iter_arg, ","
        write(*,'(I0,A)',advance='no') iterations_arg, ","
        write(*,'(A)',advance='no') "host,"
        write(*,'(I0,A)',advance='no') plan%forward_slots, ","
        write(*,'(ES24.16,A)',advance='no') phase_max_arg(1), ","
        write(*,'(ES24.16,A)',advance='no') total_avg_arg, ","
        do j = 2, n_timing_fields - 1
            write(*,'(ES24.16,A)',advance='no') phase_max_arg(j), ","
        enddo
        write(*,'(ES24.16,A)',advance='no') phase_max_arg(n_timing_fields), ","
        write(*,'(ES24.16,A)',advance='no') err_rms_arg, ","
        write(*,'(ES24.16,A)',advance='no') err_linf_arg, ","
        write(*,'(ES24.16)') cross_arg
    end subroutine write_csv_row

end program benchmark_penta

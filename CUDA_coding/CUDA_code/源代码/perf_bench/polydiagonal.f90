!=======================================================================
! polydiagonal.f90
! ----------------
! 对照组 (ref_pentadiagonal.f90) 的缩约系统求解依赖:
!   polydiagonal_serial          : 带状 (2p+1 对角) 串行求解, 真正被调用
!   polydiagonal_periodic_serial : 周期变体, nper=0 时永不调用 (链接占位)
!   tridiagonal_periodic_serial      : 周期三对角, 永不调用 (链接占位)
!   tridiagonal_periodic_serial_cuda : 周期三对角 GPU 版, 永不调用 (占位)
!
! 本基准只测非周期 (nper=0) 情况, 周期桩子用 stop 报错兜底 (不可达)。
! 注意: 这些是外部子程序 (不在 module 内), 因为 ref_pentadiagonal.f90
! 对 tridiagonal_periodic_serial_cuda 显式声明了 external interface。
!=======================================================================

!-----------------------------------------------------------------------
! 带状 (2p+1 对角) 串行求解器 (无选主元)。
!   每个 lot 独立系统: sum_{k=-p}^{p} AA(l,j,k) * x(l,j+k) = R(l,j)
!   带外元素视为 0; 解写回 R(l,j)。p 为半带宽。
! 缩约系统来自对角占优的原系统, 消元无选主元数值稳定 (参考同款策略)。
!-----------------------------------------------------------------------
subroutine polydiagonal_serial(p, AA, R, n, lot)
    use precision
    implicit none

    integer, intent(in) :: p, n, lot
    real(WP), dimension(lot, n, -p:p), intent(inout) :: AA
    real(WP), dimension(lot, n), intent(inout) :: R

    integer :: l, i, j, c
    real(WP) :: mult, acc

    ! 前向消元: 用行 i 消去行 j>i 的第 i 列
    do i = 1, n - 1
        do j = i + 1, min(i + p, n)
            do l = 1, lot
                mult = AA(l, j, i - j) / AA(l, i, 0)
                do c = i + 1, min(i + p, n)
                    AA(l, j, c - j) = AA(l, j, c - j) - mult * AA(l, i, c - i)
                end do
                R(l, j) = R(l, j) - mult * R(l, i)
            end do
        end do
    end do

    ! 回代
    do i = n, 1, -1
        do l = 1, lot
            acc = R(l, i)
            do c = i + 1, min(i + p, n)
                acc = acc - AA(l, i, c - i) * R(l, c)
            end do
            R(l, i) = acc / AA(l, i, 0)
        end do
    end do
end subroutine polydiagonal_serial


!-----------------------------------------------------------------------
! 以下均为非周期基准不会触达的占位 (仅保证链接)。

subroutine polydiagonal_periodic_serial(p, AA, R, n, lot)
    use precision
    implicit none
    integer, intent(in) :: p, n, lot
    real(WP), dimension(lot, n, -p:p), intent(inout) :: AA
    real(WP), dimension(lot, n), intent(inout) :: R

    write(*,*) 'polydiagonal_periodic_serial: periodic path not used in benchmark'
    stop 1
end subroutine polydiagonal_periodic_serial

subroutine tridiagonal_periodic_serial(a, b, c, r, n, lot)
    use precision
    implicit none
    integer, intent(in) :: n, lot
    real(WP), dimension(lot, n), intent(inout) :: a, b, c, r

    write(*,*) 'tridiagonal_periodic_serial: periodic path not used in benchmark'
    stop 1
end subroutine tridiagonal_periodic_serial

subroutine tridiagonal_periodic_serial_cuda(a, b, c, r, n, lot)
    use cudafor
    use precision
    implicit none
    integer, intent(in) :: n, lot
    real(WP), device, intent(inout), dimension(lot, n) :: a, b, c, r

    write(*,*) 'tridiagonal_periodic_serial_cuda: periodic path not used in benchmark'
    stop 1
end subroutine tridiagonal_periodic_serial_cuda

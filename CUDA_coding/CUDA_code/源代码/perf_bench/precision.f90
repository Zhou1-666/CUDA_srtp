!=======================================================================
! precision.f90
! -------------
! 对照组 (control group/pentadiagonal.f90, 论文原版五对角求解器) 依赖的
! 精度模块。与 PaScaL_TDMA 原版库保持一致: WP = 双精度 (real*8)。
!=======================================================================
module precision
    implicit none

    ! 双精度 (IEEE 754 double, 15 位有效十进制, 指数范围 1e-307..1e308)
    integer, parameter :: WP = selected_real_kind(15, 307)

end module precision

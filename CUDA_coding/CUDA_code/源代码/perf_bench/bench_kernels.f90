!=======================================================================
! bench_kernels.f90
! -----------------
! 基准测试用的设备初始化核: 生成 x≡1 精确解测试系统。
!   系数: Aa=Ab=Ad=Ae=1, Ac=-4 (行和=0), RHS 全 0;
!   物理边界: 全局首 slice 行 0,1 的 RHS = -2,-1; 末 slice 行 N-2,N-1 = -1,-2
!   (忽略幽灵点 x_-2,x_-1 / x_N,x_{N+1} 的行和补偿, 精确解 x≡1)
!
! init_exp: 0-based 布局 (实验组 PaScaL_TDMA 输入)
! init_ref: 1-based 布局 (对照组 pentadiagonal 输入)
! head_rank/tail_rank: 1=本 rank 是全局首/末 slice (物理边界), 否则 0
!=======================================================================
module bench_kernels
    use cudafor
    implicit none

contains

    attributes(global) subroutine init_exp(aa,ab,ac,ad,ae,rhs, nsys, nrow, head_rank, tail_rank)
        integer, value :: nsys, nrow, head_rank, tail_rank
        real*8, device :: aa(0:nsys-1,0:nrow-1),ab(0:nsys-1,0:nrow-1),ac(0:nsys-1,0:nrow-1)
        real*8, device :: ad(0:nsys-1,0:nrow-1),ae(0:nsys-1,0:nrow-1),rhs(0:nsys-1,0:nrow-1)

        integer :: idx, i, k

        idx = (threadidx%x-1) + (blockidx%x-1)*blockdim%x
        if (idx < nsys*nrow) then
            i = idx / nrow
            k = mod(idx, nrow)
            aa(i,k)=1.d0; ab(i,k)=1.d0; ac(i,k)=-4.d0; ad(i,k)=1.d0; ae(i,k)=1.d0; rhs(i,k)=0.d0
            if (head_rank==1) then
                if (k==0) rhs(i,k) = -2.d0
                if (k==1) rhs(i,k) = -1.d0
            endif
            if (tail_rank==1) then
                if (k==nrow-2) rhs(i,k) = -1.d0
                if (k==nrow-1) rhs(i,k) = -2.d0
            endif
        endif
    end subroutine init_exp

    attributes(global) subroutine init_ref(aa,ab,ac,ad,ae,rhs, lot, nrow, head_rank, tail_rank)
        integer, value :: lot, nrow, head_rank, tail_rank
        real*8, device :: aa(1:lot,1:nrow),ab(1:lot,1:nrow),ac(1:lot,1:nrow)
        real*8, device :: ad(1:lot,1:nrow),ae(1:lot,1:nrow),rhs(1:lot,1:nrow)

        integer :: idx, l, k

        idx = (threadidx%x-1) + (blockidx%x-1)*blockdim%x
        if (idx < lot*nrow) then
            l = idx / nrow + 1
            k = mod(idx, nrow) + 1
            aa(l,k)=1.d0; ab(l,k)=1.d0; ac(l,k)=-4.d0; ad(l,k)=1.d0; ae(l,k)=1.d0; rhs(l,k)=0.d0
            if (head_rank==1) then
                if (k==1) rhs(l,k) = -2.d0
                if (k==2) rhs(l,k) = -1.d0
            endif
            if (tail_rank==1) then
                if (k==nrow-1) rhs(l,k) = -1.d0
                if (k==nrow)   rhs(l,k) = -2.d0
            endif
        endif
    end subroutine init_ref

    !===================================================================
    ! 制造解 (已知正确结果) 初始化核, 1-based 布局 (共享数组)
    !   x_true(j) = 1 + 0.1 sin(2π j/n3) + 0.05 cos(4π j/n3)
    !   系数: Aa=Ab=Ad=Ae=1, Ac=-4 (uniform band)
    !   RHS(j) = sum_{k=-2}^{2} coeff_k * x_true(j+k), 越界 (物理边界) 视为 0
    !   故 x_true 是精确解: M·x_true = RHS, 两求解器都应机器精度复现。
    !   ia = 本 rank 的全局起始行; n3 = 全局线长
    !===================================================================
    attributes(device) real*8 function xt_ref(g, n3)
        integer, value :: g, n3
        real*8 :: pi
        pi = 4.d0*atan(1.d0)
        xt_ref = 1.d0 + 0.1d0*sin(2.d0*pi*dble(g)/dble(n3)) &
                     + 0.05d0*cos(4.d0*pi*dble(g)/dble(n3))
    end function xt_ref

    attributes(global) subroutine init_ref_mfd(aa,ab,ac,ad,ae,rhs, lot, nrow, ia, n3)
        integer, value :: lot, nrow, ia, n3
        real*8, device :: aa(1:lot,1:nrow),ab(1:lot,1:nrow),ac(1:lot,1:nrow)
        real*8, device :: ad(1:lot,1:nrow),ae(1:lot,1:nrow),rhs(1:lot,1:nrow)

        integer :: idx, l, k, g, gg

        idx = (threadidx%x-1) + (blockidx%x-1)*blockdim%x
        if (idx < lot*nrow) then
            l = idx / nrow + 1
            k = mod(idx, nrow) + 1
            g = ia + (k-1)                 ! 全局行
            aa(l,k)=1.d0; ab(l,k)=1.d0; ac(l,k)=-4.d0; ad(l,k)=1.d0; ae(l,k)=1.d0
            rhs(l,k) = 0.d0
            gg = g - 2
            if (gg >= 0)      rhs(l,k) = rhs(l,k) + 1.d0*xt_ref(gg,n3)
            gg = g - 1
            if (gg >= 0)      rhs(l,k) = rhs(l,k) + 1.d0*xt_ref(gg,n3)
            gg = g
            if (gg < n3)      rhs(l,k) = rhs(l,k) - 4.d0*xt_ref(gg,n3)
            gg = g + 1
            if (gg < n3)      rhs(l,k) = rhs(l,k) + 1.d0*xt_ref(gg,n3)
            gg = g + 2
            if (gg < n3)      rhs(l,k) = rhs(l,k) + 1.d0*xt_ref(gg,n3)
        endif
    end subroutine init_ref_mfd

end module bench_kernels

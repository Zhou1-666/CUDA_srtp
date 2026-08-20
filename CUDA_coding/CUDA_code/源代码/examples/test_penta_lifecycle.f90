program test_penta_lifecycle
    use mpi
    use cudafor
    use PaScaL_TDMA_cuda_penta
    implicit none

    type(ptdma_plan_cuda) :: plan
    integer :: ierr,myrank,nprocs,ngpu,gpurank,cuda_status
    integer :: forward_slots,cycles,cycle,nsys,nrow,n3,i,j,g,gg,ios
    integer :: local_clean,global_clean
    character(len=32) :: arg
    real(8) :: offsum,local_error,global_error,max_error
    real(8), parameter :: error_limit=1.0d-10
    real(8), allocatable :: A_h(:,:),B_h(:,:),C_h(:,:),D_h(:,:),E_h(:,:),R_h(:,:)
    real(8), allocatable, device :: A_d(:,:),B_d(:,:),C_d(:,:),D_d(:,:),E_d(:,:),R_d(:,:)

    call MPI_INIT(ierr)
    call MPI_COMM_RANK(MPI_COMM_WORLD,myrank,ierr)
    call MPI_COMM_SIZE(MPI_COMM_WORLD,nprocs,ierr)

    if(command_argument_count()/=2) then
        if(myrank==0) write(*,'(A)') 'usage: test_penta_lifecycle <28|22> <positive-cycles>'
        call MPI_FINALIZE(ierr)
        stop 2
    endif
    call get_command_argument(1,arg)
    read(arg,*,iostat=ios) forward_slots
    if(ios/=0 .or. (forward_slots/=28 .and. forward_slots/=22)) then
        if(myrank==0) write(*,'(A)') 'LIFECYCLE_FAIL: forward slots must be 28 or 22'
        call MPI_ABORT(MPI_COMM_WORLD,2,ierr)
    endif
    call get_command_argument(2,arg)
    read(arg,*,iostat=ios) cycles
    if(ios/=0 .or. cycles<=0) then
        if(myrank==0) write(*,'(A)') 'LIFECYCLE_FAIL: cycles must be positive'
        call MPI_ABORT(MPI_COMM_WORLD,2,ierr)
    endif

    cuda_status=cudaGetDeviceCount(ngpu)
    if(cuda_status/=0 .or. ngpu<=0) then
        if(myrank==0) write(*,'(A,I0)') 'LIFECYCLE_FAIL: no CUDA device, status=',cuda_status
        call MPI_ABORT(MPI_COMM_WORLD,3,ierr)
    endif
    gpurank=mod(myrank,ngpu)
    cuda_status=cudaSetDevice(gpurank)
    if(cuda_status/=0) then
        if(myrank==0) write(*,'(A,I0)') 'LIFECYCLE_FAIL: cudaSetDevice status=',cuda_status
        call MPI_ABORT(MPI_COMM_WORLD,3,ierr)
    endif

    ! Five independent systems and eight rows per rank are deliberately
    ! small enough for sanitizer runs while still exercising np=2 exchange.
    nsys=max(5,nprocs)
    nrow=8
    n3=nrow*nprocs
    allocate(A_h(0:nsys-1,0:nrow-1),B_h(0:nsys-1,0:nrow-1),C_h(0:nsys-1,0:nrow-1))
    allocate(D_h(0:nsys-1,0:nrow-1),E_h(0:nsys-1,0:nrow-1),R_h(0:nsys-1,0:nrow-1))
    allocate(A_d(0:nsys-1,0:nrow-1),B_d(0:nsys-1,0:nrow-1),C_d(0:nsys-1,0:nrow-1))
    allocate(D_d(0:nsys-1,0:nrow-1),E_d(0:nsys-1,0:nrow-1),R_d(0:nsys-1,0:nrow-1))

    max_error=0.0d0
    do cycle=1,cycles
        do i=0,nsys-1
            do j=0,nrow-1
                g=myrank*nrow+j
                A_h(i,j)=0.0d0; B_h(i,j)=0.0d0
                D_h(i,j)=0.0d0; E_h(i,j)=0.0d0
                if(g>=2) A_h(i,j)=-0.11d0-0.01d0*dble(mod(g,3))
                if(g>=1) B_h(i,j)= 0.31d0+0.02d0*dble(mod(g,2))
                if(g+1<n3) D_h(i,j)=-0.27d0-0.01d0*dble(mod(g,4))
                if(g+2<n3) E_h(i,j)= 0.09d0+0.01d0*dble(mod(g,3))
                offsum=abs(A_h(i,j))+abs(B_h(i,j))+abs(D_h(i,j))+abs(E_h(i,j))
                C_h(i,j)=1.0d0+2.0d0*offsum
                R_h(i,j)=C_h(i,j)*x_true(g,i,cycle)
                gg=g-2; if(gg>=0) R_h(i,j)=R_h(i,j)+A_h(i,j)*x_true(gg,i,cycle)
                gg=g-1; if(gg>=0) R_h(i,j)=R_h(i,j)+B_h(i,j)*x_true(gg,i,cycle)
                gg=g+1; if(gg<n3) R_h(i,j)=R_h(i,j)+D_h(i,j)*x_true(gg,i,cycle)
                gg=g+2; if(gg<n3) R_h(i,j)=R_h(i,j)+E_h(i,j)*x_true(gg,i,cycle)
            enddo
        enddo

        A_d=A_h; B_d=B_h; C_d=C_h; D_d=D_h; E_d=E_h; R_d=R_h
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128,forward_slots)
        if(.not.plan%is_created .or. plan%forward_slots/=forward_slots) then
            if(myrank==0) write(*,'(A,I0)') 'LIFECYCLE_FAIL: invalid active plan at cycle ',cycle
            call MPI_ABORT(MPI_COMM_WORLD,4,ierr)
        endif
        call pascal_solver(plan,A_d,B_d,C_d,D_d,E_d,R_d,nsys,nrow)
        cuda_status=cudaDeviceSynchronize()
        if(cuda_status/=0) then
            if(myrank==0) write(*,'(A,I0,A,I0)') 'LIFECYCLE_FAIL: CUDA status ',cuda_status,' at cycle ',cycle
            call MPI_ABORT(MPI_COMM_WORLD,5,ierr)
        endif
        R_h=R_d

        local_error=0.0d0
        do i=0,nsys-1
            do j=0,nrow-1
                g=myrank*nrow+j
                local_error=max(local_error,abs(R_h(i,j)-x_true(g,i,cycle)))
            enddo
        enddo
        call MPI_ALLREDUCE(local_error,global_error,1,MPI_DOUBLE_PRECISION,MPI_MAX,MPI_COMM_WORLD,ierr)
        max_error=max(max_error,global_error)
        if(global_error>error_limit) then
            if(myrank==0) write(*,'(A,I0,A,ES12.4)') 'LIFECYCLE_FAIL: cycle=',cycle,' error=',global_error
            call MPI_ABORT(MPI_COMM_WORLD,6,ierr)
        endif

        call pascal_plan_clean(plan)
        if(plan_is_clean(plan)) then
            local_clean=1
        else
            local_clean=0
        endif
        call MPI_ALLREDUCE(local_clean,global_clean,1,MPI_INTEGER,MPI_MIN,MPI_COMM_WORLD,ierr)
        if(global_clean/=1) then
            if(myrank==0) write(*,'(A,I0)') 'LIFECYCLE_FAIL: plan still owns state after cycle ',cycle
            call MPI_ABORT(MPI_COMM_WORLD,7,ierr)
        endif
        ! clean is documented as idempotent; exercising it here also catches
        ! stale is_created state without changing the create-solve-clean count.
        call pascal_plan_clean(plan)
    enddo

    deallocate(A_d,B_d,C_d,D_d,E_d,R_d)
    deallocate(A_h,B_h,C_h,D_h,E_h,R_h)
    if(myrank==0) write(*,'(A,I0,A,I0,A,I0,A,ES12.4)') &
        'LIFECYCLE_PASS: slots=',forward_slots,' cycles=',cycles,' ranks=',nprocs,' max_error=',max_error
    call MPI_FINALIZE(ierr)

contains

    real(8) function x_true(index,system,iteration)
        integer, intent(in) :: index,system,iteration
        x_true=sin(0.37d0*dble(index+1))+0.25d0*cos(0.11d0*dble(index)) &
            +0.01d0*dble(system)+1.0d-4*dble(iteration)
    end function x_true

    logical function plan_is_clean(candidate)
        type(ptdma_plan_cuda), intent(in) :: candidate

        plan_is_clean=.not.candidate%is_created .and. candidate%ptdma_world==MPI_COMM_NULL .and. &
            candidate%myrank==-1 .and. candidate%nprocs==0 .and. candidate%Nsys==0 .and. &
            candidate%forward_slots==28 .and. candidate%tmp_N==0 .and. candidate%tmp_Nmax==0
        plan_is_clean=plan_is_clean .and. .not.allocated(candidate%rd) .and. .not.allocated(candidate%Atr) &
            .and. .not.allocated(candidate%Dtr) .and. .not.allocated(candidate%Drd) &
            .and. .not.allocated(candidate%pivot_flag_h) .and. .not.allocated(candidate%pivot_flag)
        plan_is_clean=plan_is_clean .and. .not.allocated(candidate%gather_Nrd_local) &
            .and. .not.allocated(candidate%gather_Ntr_local) .and. .not.allocated(candidate%gather_Nrd_start) &
            .and. .not.allocated(candidate%gather_Ntr_start) .and. .not.allocated(candidate%gather_Nrd_local_d) &
            .and. .not.allocated(candidate%gather_Ntr_local_d) .and. .not.allocated(candidate%gather_Nrd_start_d) &
            .and. .not.allocated(candidate%gather_Ntr_start_d)
        plan_is_clean=plan_is_clean .and. .not.allocated(candidate%gather_Nrd_sol_local) &
            .and. .not.allocated(candidate%gather_Ntr_sol_local) .and. .not.allocated(candidate%gather_Nrd_sol_start) &
            .and. .not.allocated(candidate%gather_Ntr_sol_start) .and. .not.allocated(candidate%gather_Nrd_sol_local_d) &
            .and. .not.allocated(candidate%gather_Ntr_sol_local_d) .and. .not.allocated(candidate%gather_Nrd_sol_start_d) &
            .and. .not.allocated(candidate%gather_Ntr_sol_start_d)
        plan_is_clean=plan_is_clean .and. .not.allocated(candidate%bufsubsize_A) &
            .and. .not.allocated(candidate%bufstart_A) .and. .not.allocated(candidate%BIGbufsubsize_A) &
            .and. .not.allocated(candidate%BIGbufstart_A) .and. .not.allocated(candidate%bufsubsize_B) &
            .and. .not.allocated(candidate%bufstart_B) .and. .not.allocated(candidate%BIGbufsubsize_B) &
            .and. .not.allocated(candidate%BIGbufstart_B) .and. .not.allocated(candidate%bufsubsize_sol_A) &
            .and. .not.allocated(candidate%bufstart_sol_A) .and. .not.allocated(candidate%bufsubsize_sol_B) &
            .and. .not.allocated(candidate%bufstart_sol_B) .and. .not.allocated(candidate%BIGbuf_A) &
            .and. .not.allocated(candidate%BIGbuf_B)
    end function plan_is_clean

end program test_penta_lifecycle

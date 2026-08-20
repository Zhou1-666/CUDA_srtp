program test_penta_api_validation
    use mpi
    use cudafor
    use PaScaL_TDMA_cuda_penta
    implicit none

    type(ptdma_plan_cuda) :: plan
    integer :: ierr,myrank,nprocs,nsys,nrow
    character(len=64) :: case_name
    logical :: should_fail
    real(8), allocatable, device :: A(:,:),B(:,:),C(:,:),D(:,:),E(:,:),RHS(:,:)

    call MPI_INIT(ierr)
    call MPI_COMM_RANK(MPI_COMM_WORLD,myrank,ierr)
    call MPI_COMM_SIZE(MPI_COMM_WORLD,nprocs,ierr)

    if(command_argument_count()/=1) then
        if(myrank==0) write(*,'(A)') 'usage: test_penta_api_validation <case>'
        call MPI_FINALIZE(ierr)
        stop 2
    endif
    call get_command_argument(1,case_name)

    nsys = max(1,nprocs)
    nrow = 5
    should_fail = .true.

    select case(trim(case_name))
    case('valid')
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128)
        call pascal_plan_clean(plan)
        should_fail = .false.
    case('valid_forward22')
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128, &
                                PASCAL_PENTA_FORWARD_SLOTS_22)
        if(plan%forward_slots/=PASCAL_PENTA_FORWARD_SLOTS_22) then
            if(myrank==0) write(*,'(A)') 'API_VALIDATION_FAIL: 22-slot plan metadata mismatch'
            call MPI_ABORT(MPI_COMM_WORLD,3,ierr)
        endif
        call pascal_plan_clean(plan)
        should_fail = .false.
    case('double_clean')
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128)
        call pascal_plan_clean(plan)
        call pascal_plan_clean(plan)
        should_fail = .false.
    case('clean_uncreated')
        call pascal_plan_clean(plan)
        should_fail = .false.
    case('nsys_zero')
        call pascal_plan_create(plan,0,MPI_COMM_WORLD,myrank,nprocs,128,128)
    case('empty_partition')
        call pascal_plan_create(plan,nprocs-1,MPI_COMM_WORLD,myrank,nprocs,128,128)
    case('rank_mismatch')
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,mod(myrank+1,nprocs),nprocs,128,128)
    case('nprocs_mismatch')
        call pascal_plan_create(plan,nprocs+1,MPI_COMM_WORLD,myrank,nprocs+1,128,128)
    case('comm_null')
        call pascal_plan_create(plan,nsys,MPI_COMM_NULL,myrank,nprocs,128,128)
    case('threads_zero')
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,0,128)
    case('threads_too_large')
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,1025)
    case('forward_slots_invalid')
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128,21)
    case('plan_index_overflow')
        nsys = huge(nsys)/32 + 1
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128)
    case('double_create')
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128)
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128)
    case('solver_before_create')
        allocate(A(0:nsys-1,0:nrow-1),B(0:nsys-1,0:nrow-1),C(0:nsys-1,0:nrow-1))
        allocate(D(0:nsys-1,0:nrow-1),E(0:nsys-1,0:nrow-1),RHS(0:nsys-1,0:nrow-1))
        call pascal_solver(plan,A,B,C,D,E,RHS,nsys,nrow)
    case('solver_nrow')
        nrow = 4
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128)
        allocate(A(0:nsys-1,0:nrow-1),B(0:nsys-1,0:nrow-1),C(0:nsys-1,0:nrow-1))
        allocate(D(0:nsys-1,0:nrow-1),E(0:nsys-1,0:nrow-1),RHS(0:nsys-1,0:nrow-1))
        call pascal_solver(plan,A,B,C,D,E,RHS,nsys,nrow)
    case('solver_nsys_mismatch')
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128)
        allocate(A(0:nsys,0:nrow-1),B(0:nsys,0:nrow-1),C(0:nsys,0:nrow-1))
        allocate(D(0:nsys,0:nrow-1),E(0:nsys,0:nrow-1),RHS(0:nsys,0:nrow-1))
        call pascal_solver(plan,A,B,C,D,E,RHS,nsys+1,nrow)
    case('solver_matrix_index_overflow')
        nsys = max(2,nprocs)
        call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128)
        allocate(A(0:0,0:0),B(0:0,0:0),C(0:0,0:0))
        allocate(D(0:0,0:0),E(0:0,0:0),RHS(0:0,0:0))
        nrow = huge(nrow)
        call pascal_solver(plan,A,B,C,D,E,RHS,nsys,nrow)
    case default
        if(myrank==0) write(*,'(A,A)') 'unknown validation case: ',trim(case_name)
        call MPI_FINALIZE(ierr)
        stop 2
    end select

    if(should_fail) then
        if(myrank==0) write(*,'(A,A)') 'API_VALIDATION_FAIL: case returned: ',trim(case_name)
        call MPI_ABORT(MPI_COMM_WORLD,3,ierr)
    else
        if(myrank==0) write(*,'(A,A)') 'API_VALIDATION_PASS: ',trim(case_name)
        call MPI_FINALIZE(ierr)
    endif
end program test_penta_api_validation

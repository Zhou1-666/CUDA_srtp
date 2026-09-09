#!/usr/bin/env bash
#SBATCH --job-name=task007-nsys-host
#SBATCH --partition=gpu
#SBATCH --qos=gpugpu
#SBATCH --nodes=2
#SBATCH --ntasks-per-node=1
#SBATCH --gpus=2
#SBATCH --gpus-per-node=1
#SBATCH --exclude=paraai-n32-h-01-agent-[92-93]
#SBATCH --time=00:20:00
#SBATCH --output=task007-nsys-host-%j.out
#SBATCH --error=task007-nsys-host-%j.err

set -euo pipefail
module purge
module load nvhpc/24.5/nvhpc-hpcx-cuda12/24.5
source_dir="$HOME/CUDA_srtp_zhou1_task009/CUDA_coding/CUDA_code/源代码/perf_bench"
out_dir="$HOME/task007-nsys-host-logs/${SLURM_JOB_ID}"
mkdir -p "$out_dir" "$HOME/tmp"
export TMPDIR="$HOME/tmp"
exec > >(tee "$out_dir/job.log") 2>&1

echo "job=${SLURM_JOB_ID} nodes=${SLURM_JOB_NUM_NODES} tasks=${SLURM_NTASKS}"
command -v mpifort
mpirun --version | head -n 2
srun --nodes=2 --ntasks=2 --ntasks-per-node=1 --gpus-per-task=1 --label bash -c "echo host=\$(hostname) rank=\${SLURM_PROCID} visible=\${CUDA_VISIBLE_DEVICES:-unset}; nvidia-smi -L"
cd "$source_dir"
make veryclean
make FC=mpifort OPT="-O3"

set +e
PENTA_TEST_CASE=manufactured PENTA_MPI_MODE=host PENTA_FORWARD_SLOTS=28 timeout 180s mpirun -x PENTA_TEST_CASE -x PENTA_MPI_MODE -x PENTA_FORWARD_SLOTS --mca plm_slurm_args "--gpus=1" -np 2 --map-by ppr:1:node --bind-to none --mca pml ob1 --mca btl self,vader,tcp --mca coll_hcoll_enable 0 --mca oob_tcp_if_include eth0 --mca btl_tcp_if_include eth0 nsys profile --force-overwrite true --trace=cuda,mpi,osrt --sample=none --cpuctxsw=none -o "$out_dir/nsys-rank-%q{OMPI_COMM_WORLD_RANK}" ./benchmark_penta 256 256 1024 1 128 128
rc=$?
set -e
echo "TASK009_CROSSNODE_PENTA_SMOKE_RC=$rc"
exit "$rc"

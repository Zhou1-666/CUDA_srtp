# 超算(HPC 集群)操作手册 — 五对角基准

> 面向第一次用 SSH / 超算的人。跟着做即可。全程把命令里的 `用户名@超算地址` 换成你的真实账号。

## 0. 先建立三个概念

| 概念 | 是什么 | 你要做的 |
|---|---|---|
| **登录节点** (login node) | 你 SSH 进来所在的前端机器 | 在这里传文件、编译、提交作业；**不要在这里跑重型计算** |
| **计算节点** (compute node) | 真正有 GPU 的机器，只有作业运行时才分配给你 | 你**不直接登录它**，通过调度系统把作业投过去 |
| **调度系统** (SLURM/PBS) | 排队平台：`sbatch` 提交、`squeue` 看队、`sacct` 看历史 | 用 `sbatch` 提交作业，等它运行 |

你日常只跟登录节点 + 调度系统打交道。

---

## 1. 连接超算（SSH）

Windows 10/11 自带 SSH 客户端，不用装额外软件。打开 **PowerShell** 或 **Windows 终端**：

```bash
ssh 用户名@超算地址
```

- 首次连接会问 "Are you sure...? " 输入 `yes`。
- 输密码（第一次登录很多超算中心**强制改密码**）。
- 部分超算中心要求先连**学校 VPN** 或用**网页版 SSH 控制台**，以你们中心的说明为准。

**登录成功后，你看到的提示符就属于登录节点了。**

---

## 2. 把代码传到超算

只在超算上传**源码 + Makefile + 脚本**，`.o`/二进制不用传（要在超算上重新编译）。

在你自己电脑（WSL 或 Windows PowerShell）里，先进入项目目录：

```bash
export PROJECT_ROOT=/path/to/CUDA_srtp/CUDA_coding/CUDA_code
cd "$PROJECT_ROOT"
scp -r 源代码 用户名@超算地址:~/
```

> 嫌 scp 慢可以用 `rsync -av --exclude='*.o' --exclude='*.mod' 源代码 用户名@超算地址:~/`。
> 图方便也可以用 WinSCP（图形界面拖拽）。

传完后，在超算登录节点确认：

```bash
ls ~/源代码
cd ~/源代码/hpc
bash check_env.sh      # ← 最重要的一步, 见下一节
```

> 如果 `.sh` 脚本报错提示换行符问题（Windows CRLF），跑一句：`sed -i 's/\r$//' *.sh`。

---

## 3. 环境检查（必做，决定后面怎么走）

```bash
cd ~/源代码/hpc
bash check_env.sh
```

把输出**整段贴回给我**，我帮你判断。你自己先盯三个结果：

1. **GPU**：`nvidia-smi` 有没有列出 A100/H100/…？记下卡型和显存、每节点几张卡。
2. **nvfortran**：有没有？这是**关键**。
3. **module 里有没有 nvhpc / cuda / openmpi**。

### 没有 nvfortran 怎么办（大概率会遇到）

超算上默认通常只有 CUDA C（nvcc），**很多集群没装 CUDA Fortran（nvfortran）**。按顺序选：

1. **先找管理员**：给超算中心技术支持发邮件，说"需要 NVIDIA HPC SDK（nvfortran）编译 CUDA Fortran 程序，能否加载 nvhpc 模块"。多数中心会给你装好。这是最省事的。
2. **自己装到 home 目录**（不需要 root，可用）：
   ```bash
   cd ~ && curl -L -o nvhpc.tar.gz <NVIDIA HPC SDK Linux x86_64 下载链接>
   tar xf nvhpc.tar.gz && cd nvhpc_* && ./install --prefix $HOME/nvhpc
   export PATH=$HOME/nvhpc/Linux_x86_64/24.7/compilers/bin:$PATH
   export LD_LIBRARY_PATH=$HOME/nvhpc/Linux_x86_64/24.7/compilers/lib:$LD_LIBRARY_PATH
   export PATH=$HOME/nvhpc/Linux_x86_64/24.7/comm_libs/mpi/bin:$PATH
   ```
   下载链接在 https://developer.nvidia.com/hpc-sdk （免费注册 NVIDIA 开发者账号即可）。

---

## 4. 编译

```bash
cd ~/源代码/perf_bench
make clean
make        # 如果编译过不了, 把报错贴给我
```

### 可能需要的调整

- **GPU 计算能力**：默认 `-cuda` 可能没针对你们卡优化。查 `nvidia-smi --query-gpu=compute_cap --format=csv`，然后：
  - A100 / A30 / RTX 30 系 → `cc80`
  - H100 / H800 → `cc90`
  - A40 → `cc86`
  ```bash
  make clean && make CUDAFLAG="-cuda -gpu=cc80"
  ```
- **module 里 MPI 不同**：如果 `make` 报找不到 mpif90，先 `module load openmpi`（或 mpich），再 make。
- 你的 Makefile 用的是 `mpif90`（OpenMPI 包装 nvfortran）。如果集群的 OpenMPI 不认识 nvfortran，改为用 nvfortran 自带的 MPI：
  ```bash
  make FC="$HOME/nvhpc/Linux_x86_64/24.7/comm_libs/mpi/bin/mpif90"
  ```
  或者直接 `export PATH=.../comm_libs/mpi/bin:$PATH` 让 `mpif90` 指向它。

---

## 5. 运行：先小规模验证，再正式跑

### 第一步：交互式快速验证（几分钟出结果）

```bash
srun --gres=gpu:1 -n 1 ./benchmark_penta 64 64 1024 2 128 128
```

- 会打印求解器、耗时、err_rms/err_linf、cross。
- 看 `err` 是否在 1e-12 量级、`cross` 是否 ~1e-12。**对上就说明编译没问题、算法正常**。
- 如果 `srun` 不能用（权限限制），跳过这步直接提交作业。

### 第二步：正式提交

```bash
cd ~/源代码/perf_bench
sbatch ~/源代码/hpc/run_benchmark.slurm
squeue -u $USER        # 看排队/运行状态
```

- 结束后结果在 `slurm-<jobid>.out`，性能 CSV 在同目录。
- 改规模：`N3=4096 sbatch ~/源代码/hpc/run_benchmark.slurm`
- 换测试系统：`PENTA_TEST_CASE=manufactured sbatch ...`

### 规模怎么加（针对你本机 8GB 显存崩溃过的问题）

超算上显存大得多（A100 40/80GB），可以放开跑。但**每次只加一档，先确认前一档精度正常**：

| 规模 | 含义 | 说明 |
|---|---|---|
| 128×128×2048 | 33.5M | 你本机跑过的安全档，先在这验证 |
| 128×128×4096 | 67M | 你本机崩溃档，超算上应该没问题 |
| 128×128×8192 | 134M | 继续往上 |
| 256×256×4096 | 268M | 更大 |

多卡：`run_benchmark.slurm` 里 `--ntasks-per-node` 和 `--gres=gpu:N` 设成每节点 GPU 数，就会把进程铺到多张卡上。想跨节点再加 `--nodes=2`。

---

## 6. 拉回结果、在本地画图

回到你自己电脑：

```bash
export PROJECT_ROOT=/path/to/CUDA_srtp/CUDA_coding/CUDA_code
scp 用户名@超算地址:~/源代码/perf_bench/penta_*.csv "$PROJECT_ROOT/源代码/perf_bench/"
cd "$PROJECT_ROOT/源代码/perf_bench"
python3 plot_performance.py penta_xxxx_penta_perf.csv
python3 plot_accuracy.py    penta_xxxx_penta_perf.csv
```

---

## 7. 你项目特有的提醒

1. **MPI 走 host 中转（默认）**：你的代码里 `pascal_cuda_aware_mpi` 默认 `.false.`，走 host 中转——这在任何集群上都正确。先用它把正确性验证了；如果集群的 MPI 是 CUDA-aware，之后可以再测开 CUDA-aware 的加速（怎么开之后再弄，不影响正确性）。
2. **精度结果跟之前完全一致**：编译产物里的内核算术不变，驱动版本不影响数值误差。你在本机验证过的机器精度结论，超算上应该复现。
3. **性能数字要绑定驱动版本**：写论文时把超算的 `nvidia-smi` 驱动版本记进报告。不同机器/驱动下时间不可直接比较。
4. **作业失败先看日志**：`slurm-<jobid>.out` / `.err` 里有报错，贴回来我帮你看。
5. **算力是共享的，别霸占**：提交前先 `sinfo` 看分区，用对分区；时间设保守点，排到就开跑。

---

## 常见问题速查

| 症状 | 处理 |
|---|---|
| `ssh: connect to host ... timed out` | 先连 VPN；确认地址端口 |
| `command not found: module` | 重启登录 shell 或 `source /etc/profile.d/modules.sh` |
| `make: mpif90: No such file` | `module load openmpi`（或 mpich/intelmpi） |
| `nvfortran: No such file` | 见 §3 没有 nvfortran 的处理 |
| 编译报 `-cuda` 不认识 | 你的 FC 不是 nvfortran，检查 PATH / FC 变量 |
| `srun: error: ... gpu` | 分区没有 GPU 或 `--gres` 写错，先 `sinfo` 看 |
| 作业 `PENDING (Resources)` | 在排队等资源，正常，用 `squeue` 看 |
| 结果全 0 / err 巨大 | 多进程通信异常，检查是不是走了 CUDA-aware MPI 分支 |

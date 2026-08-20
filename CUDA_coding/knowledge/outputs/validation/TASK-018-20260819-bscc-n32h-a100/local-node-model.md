# 本机 Node.js 容量模型：用户终端转录

> 说明：以下为 2026-08-19 用户提供的终端输出转录。修复后的模型工作树尚未提交。

## 自检

```text
penta capacity model self-test: cases=6 failures=0
```

## 安全规模

```text
config: Nsys=65536, local_Nrow=1024, local_tmp_N=65536, slots=28
device persistent total: 5.061 GiB
device budget: 30.000 GiB; classification: FIT

config: Nsys=65536, local_Nrow=1024, local_tmp_N=65536, slots=22
device persistent total: 5.052 GiB
device budget: 30.000 GiB; classification: FIT

28->22 projected device saving: 9.000 MiB
```

## 受控拒绝

```text
config: Nsys=262144, local_Nrow=2048, local_tmp_N=262144, slots=28
device persistent total: 40.242 GiB
device budget: 30.000 GiB; classification: REJECT

config: Nsys=262144, local_Nrow=2048, local_tmp_N=262144, slots=22
device persistent total: 40.207 GiB
device budget: 30.000 GiB; classification: REJECT

28->22 projected device saving: 36.000 MiB
exit_code=2
```

模型为纯 Node.js 算术，未调用 CUDA；退出码 2 是预期的受控拒绝。

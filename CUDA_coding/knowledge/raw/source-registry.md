# 原始资料登记表

> 这是知识库的来源账本。Wiki 页面使用 `source_ids` 引用这里的记录。

| ID | 类型 | 名称 | 位置/URL | SHA-256 | 隐私 | 编译状态 |
| --- | --- | --- | --- | --- | --- | --- |
| SRC-001 | proposal | SRTP 项目申报书 | `C:/Users/30575/Desktop/cfd.md` | `F4BE8A4D6D6873C78C68D9459A2CB1D50D9FD6738C04B8015DDC298E882E6397` | private，含个人信息 | 已部分编译 |
| SRC-002 | paper | PaScaL_TDMA 2.1 CPC 论文 | `CUDA_code/源代码/[2026][CPC]PaScaL_TDMA 2.1 ... .pdf` | `950454A141CDA7C87C6D2E82D15D665CC869E26698E28A57DF89C06E16E9C646` | internal | 已编译三→五迁移边界；许可仍需代码级核验 |
| SRC-003 | repo | 当前 CUDA Fortran/MPI 源码树 | `CUDA_code/源代码/` | Git `b97f919`（2026-08-17 初始协作基线） | internal | 已审计，持续编译 |
| SRC-003P | source | 五对角活动实现快照 | `CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90` | `2A189E7950F6D03A9D7B105E7762A7975B03F9B101B5E56E433A7DB5740CA20E` | internal | TASK-001 代码修复已编译，待目标验证 |
| SRC-003T | source | 三对角上游参考快照 | `CUDA_code/源代码/src/PaScaL_TDMA_cuda.f90` | `52EC9286488980F8137F914DA31EF93BF5CA12A93BFBE248666C3ED60FC91AF0` | internal | TASK-001 代码修复已编译，待目标验证 |
| SRC-004 | theory | 一般带宽理论与验证说明 | `CUDA_code/源代码/verify/mband_theory.md` | `346B7BA6BF95A00F09EC8F814BB99F5E72EAEC3E929A1D53663E316D6BEBB0AD` | internal | 已编译 |
| SRC-005 | dataset | 历史五对角性能 CSV | `CUDA_code/源代码/perf_bench/260810_161948_penta_perf.csv` | `EB424AC616128E29FDEE578CECF1B6D2ABF26AD4D4F6A4DE8D4E0A100CDC25AB` | internal | 已编译 |
| SRC-006 | web | Karpathy：LLM Knowledge Bases | `https://x.com/karpathy/status/2039805659525644595` | 网页，2026-08-17 核验 | public | 已编译 |

## 状态定义

- `待编译`：未生成任何 wiki 页面；
- `已部分编译`：已有页面，但来源覆盖检查未完成；
- `已编译`：相关页面、反向链接和索引已更新；
- `需重编译`：来源版本或哈希改变；
- `忽略`：已记录但确认不进入本项目知识域。

## 新来源登记模板

```text
ID：SRC-XXX
类型：
名称：
作者/机构：
稳定位置：
SHA-256/抓取日期：
隐私：public / internal / private
许可/引用：
希望支持的问题：
编译状态：待编译
```

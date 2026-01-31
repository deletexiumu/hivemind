---
type: context-core
source: context/layers/layering-system.md
version: 1.0.0
updated_at: 2026-01-31
tokens_budget: 600-800
---

# 分层体系精简版

## 四层定义速查

| 层级 | 全称 | 职责 | 数据特征 |
|------|------|------|----------|
| **ODS** | Operational Data Store | 原始数据落地，保持源结构 | 未清洗、冗余 |
| **DWD** | Data Warehouse Detail | 清洗、标准化、建事实/维度表 | 明细粒度、编码统一 |
| **DWS** | Data Warehouse Summary | 按主题轻度汇总、构建宽表 | 轻度聚合、可直接分析 |
| **ADS** | Application Data Service | 面向应用的指标结果表 | 高度聚合、场景化 |

---

## 分层落点决策规则

| 场景 | 落层 | 命名 |
|------|------|------|
| 原始数据未加工 | ODS | `ods_{source}_{table}` |
| 明细粒度事实表 | DWD | `dwd_fact_{domain}_{entity}` |
| 描述性维度表 | DWD | `dim_{entity}` |
| 按维度汇总 | DWS | `dws_{domain}_{granularity}` |
| 面向应用报表 | ADS | `ads_{application}_{report}` |

---

## 跨层引用规则矩阵

| 目标层 | 可引用 | 禁止引用 |
|--------|--------|----------|
| **DWD** | ODS | DWD, DWS, ADS |
| **DWS** | DWD, DIM | ODS, ADS |
| **ADS** | DWS, DIM, (DWD 特例) | ODS |

### 维度表跨层引用

**维度表例外**: `dim_*` 可被 DWD/DWS/ADS 共同引用（一致性维度需求）

---

## 回刷窗口约束

| 层级 | 默认窗口 | 最大窗口 |
|------|----------|----------|
| ODS | 当日 | 7 天 |
| DWD | 当日 | 30 天 |
| DWS | 当日 | 30 天 |
| ADS | 当日 | 90 天 |

---

## 检查清单

- [ ] 新表是否选择正确层级
- [ ] 表命名是否使用分层前缀
- [ ] 是否遵循跨层引用规则
- [ ] 维度表是否放 DWD 层用 `dim_` 前缀
- [ ] 回刷传播是否级联下游

---

Source: layering-system.md | Updated: 2026-01-31

---
type: scenario-support
scenario: review-existing-model
document: review-checklist
version: 1.0.0
token_budget: 1000
---

# 评审检查清单

## 1. 命名规范检查

> 规则来源: `docs/naming-core.md`

### 表名检查

| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| N01 | 分层前缀 | P1 | 表名必须以 ods_/dwd_/dws_/ads_/dim_ 开头 |
| N02 | 表名格式 | P1 | 全小写 + 下划线分隔 |
| N03 | 保留字 | P1 | 避免使用 SQL 保留字 |
| N04 | 完整模式 | P3 | 符合 `{layer}_{type?}_{domain}_{entity}` |

### 字段名检查

| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| N05 | 字段格式 | P1 | 全小写 + 下划线分隔 |
| N06 | 键后缀 | P1 | 主键 `_id`/`_sk`，外键 `_key` |
| N07 | 日期后缀 | P1 | 日期 `_date`，时间 `_time` |
| N08 | 金额后缀 | P2 | 金额 `_amt`/`_amount` |
| N09 | 数量后缀 | P2 | 数量 `_cnt`/`_count` |
| N10 | 标志前缀 | P2 | 标志 `is_`/`has_` |

---

## 2. 分层引用检查

> 规则来源: `context/layers/layering-system-core.md`

| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| L01 | DWD 引用 | P0 | DWD 仅可引用 ODS |
| L02 | DWS 引用 | P0 | DWS 仅可引用 DWD/DIM |
| L03 | ADS 引用 | P0 | ADS 仅可引用 DWS/DIM/DWD(特例) |
| L04 | 禁止引用 | P0 | 禁止直接引用 ODS（除 DWD 外） |
| L05 | 维度引用 | P2 | DIM 表可被多层引用 |

---

## 3. 粒度与主键检查

> 规则来源: `context/methodology/fact-table-types-core.md`

| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| G01 | 粒度声明 | P0 | 必须有明确粒度声明 |
| G02 | 主键一致 | P0 | 主键必须唯一标识粒度 |
| G03 | 隐藏扇形 | P0 | JOIN 不得改变粒度（fan-out） |
| G04 | 唯一性 | P1 | 业务键 + 分区键组合唯一 |
| G05 | 去重逻辑 | P1 | 分区内按业务键去重 |

---

## 4. 字段类型与注释检查

> 规则来源: `context/methodology/fact-table-types-core.md`, `docs/naming-core.md`

| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| F01 | 日期类型 | P1 | 日期用 DATE，时间用 TIMESTAMP |
| F02 | 金额类型 | P1 | 金额用 DECIMAL(18,2) |
| F03 | 字段注释 | P2 | 所有字段应有中文注释 |
| F04 | 可加性标注 | P2 | 度量字段标注可加性 |
| F05 | 标准字段 | P1 | 事实表包含 is_deleted/etl_date |
| F06 | SCD 字段 | P1 | Type 2 维度包含 dw_valid_from/dw_valid_to |

---

## 5. dbt 配置检查

> 规则来源: `context/platform/dbt-hive-limitations-core.md`

| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| D01 | description | P0 | 模型必须有 description |
| D02 | 主键 test | P0 | 主键必须有 unique + not_null |
| D03 | meta 标签 | P2 | 应有 owner/layer/grain |
| D04 | 可加性标注 | P2 | 度量应有 meta.additivity |
| D05 | 外键 test | P3 | 外键应有 relationships test |
| D06 | 增量配置 | P1 | insert_overwrite + partition_by |
| D07 | schema_change | P2 | on_schema_change='fail' |

---

## 检查项统计

| 维度 | 数量 | P0 | P1 | P2 | P3 |
|------|------|----|----|----|----|
| 命名规范 | 10 | 0 | 6 | 3 | 1 |
| 分层引用 | 5 | 4 | 0 | 1 | 0 |
| 粒度主键 | 5 | 3 | 2 | 0 | 0 |
| 字段类型 | 6 | 0 | 3 | 3 | 0 |
| dbt 配置 | 7 | 2 | 1 | 3 | 1 |
| **合计** | **33** | **9** | **12** | **10** | **2** |

---

Source: *-core.md 规范文档 | Updated: 2026-02-01

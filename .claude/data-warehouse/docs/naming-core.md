---
type: context-core
source: docs/naming.md
version: 1.0.0
updated_at: 2026-01-31
tokens_budget: 600-800
---

# 命名规范精简版

## 分层前缀速查

| 前缀 | 全称 | 用途 |
|------|------|------|
| `ods_` | Operational Data Store | 原始数据落地 |
| `dwd_` | Data Warehouse Detail | 明细事实表 |
| `dws_` | Data Warehouse Summary | 汇总/宽表 |
| `ads_` | Application Data Service | 应用/报表 |
| `dim_` | Dimension | 维度表 |
| `stg_` | Staging | 暂存/过渡表 |

## 表类型标识

| 标识 | 含义 | 示例 |
|------|------|------|
| `fact_` | 事实表 | `dwd_fact_order_detail` |
| `bridge_` | 桥接表 | `dwd_bridge_order_product` |
| `agg_` | 聚合表 | `dws_agg_sales_monthly` |
| `snapshot_` | 快照表 | `dws_snapshot_inventory_daily` |

## 完整命名模式

```
{layer}_{type?}_{domain}_{entity}_{suffix?}
```

---

## 字段类型后缀速查

| 类型 | 后缀/前缀 | 示例 |
|------|----------|------|
| 主键/外键 | `_id` | `order_id`, `customer_id` |
| 日期 | `_date` | `order_date`, `expire_date` |
| 时间戳 | `_time` | `create_time`, `update_time` |
| 金额 | `_amt` / `_amount` | `order_amt`, `payment_amount` |
| 数量 | `_cnt` / `_count` | `order_cnt`, `item_count` |
| 比率 | `_rate` / `_ratio` | `refund_rate` |
| 百分比 | `_pct` | `discount_pct` |
| 标志 | `is_` / `has_` | `is_deleted`, `has_refund` |

---

## 事实表标准字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `is_deleted` | TINYINT | 逻辑删除 (0=有效, 1=删除) |
| `data_source` | STRING | 数据来源 |
| `dw_create_time` | TIMESTAMP | 入仓时间 |
| `dw_modify_time` | TIMESTAMP | 修改时间 |
| `etl_date` | DATE | ETL 处理日期 |

## 维度表 SCD 标准字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `dw_valid_from` | DATE | SCD 有效起始 |
| `dw_valid_to` | DATE | SCD 有效截止 (9999-12-31=当前) |
| `is_current` | TINYINT | 当前版本标志 |

---

## 键命名约定

| 表类型 | 键命名 | 说明 |
|--------|--------|------|
| 维度表 | `*_sk` | 代理键 (surrogate key) |
| 事实表 | `*_key` | 外键，指向维度 `*_sk` |

---

## 检查清单

- [ ] 表名是否使用分层前缀
- [ ] 表名是否全小写 + 下划线分隔
- [ ] 主键是否使用 `_id` 后缀
- [ ] 日期/时间是否使用 `_date`/`_time` 后缀
- [ ] 金额/数量是否使用 `_amt`/`_cnt` 后缀
- [ ] 标志字段是否使用 `is_`/`has_` 前缀
- [ ] 是否包含必要的技术元数据字段
- [ ] 事实表是否包含 `is_deleted`
- [ ] 维度表 SCD2 是否包含有效期字段

---

Source: naming.md | Updated: 2026-01-31

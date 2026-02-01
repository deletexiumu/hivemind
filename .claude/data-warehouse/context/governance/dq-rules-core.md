---
type: context-core
domain: governance
document: dq-rules-core
source: 06-RESEARCH.md + 06-CONTEXT.md + dbt-expectations
version: 1.0.0
token_budget: 1000
---

# DQ 规则推断与阈值策略

## 字段类型驱动规则映射表

| 后缀模式 | 示例 | 推荐规则 | 严格程度 |
|----------|------|----------|----------|
| `_id`, `_sk`, `_key` | `customer_id`, `order_sk` | `unique` + `not_null` | P0 |
| `_amt`, `_amount` | `order_amt`, `total_amount` | `not_null` + 范围检测 `>= 0` | P1 |
| `_cnt`, `_count` | `item_cnt`, `order_count` | `not_null` + 范围检测 `>= 0` (INTEGER) | P1 |
| `_status`, `_type` | `order_status`, `pay_type` | `accepted_values` | P1 |
| `_date`, `_time` | `order_date`, `create_time` | `not_null` + 格式检查 | P1 |
| `is_`, `has_` | `is_deleted`, `has_coupon` | `accepted_values: [0, 1]` | P2 |
| `*_key` (FK) | `customer_key` | `relationships` | P2 |

**Source:** 06-CONTEXT.md 用户决策 + docs/naming.md 字段命名规范

## 分层阈值策略（Codex 共识）

| 分层 | warn_if | error_if | 适用场景 |
|------|---------|----------|----------|
| ODS | 5% | 10% | 贴源数据，容忍度高 |
| DWD/DWS | 1% | 5% | 中间层，质量要求中等 |
| ADS | 0% | 1% | 应用层，质量要求严格 |

**Source:** 06-CONTEXT.md 告警阈值分层决策

## 三类阈值实现方式（Codex 共识）

| 类型 | 实现方式 | 适用场景 | 示例 |
|------|----------|----------|------|
| 0 容忍 | dbt 原生 tests | 主键唯一、非空等硬约束 | `unique`, `not_null` |
| 比例阈值 | dbt-expectations `mostly` | 允许小比例异常 | `mostly: 0.99` |
| 行数阈值 | `warn_if/error_if` | 允许固定行数异常 | `warn_if: ">100"` |

## 新鲜度检测配置（T+1 标准）

```yaml
freshness:
  warn_after: {count: 1, period: day}
  error_after: {count: 2, period: day}
loaded_at_field: etl_time
```

**Source:** 06-CONTEXT.md 新鲜度检测决策

## dbt-hive 特定约束

| 约束 | 说明 | 规避方案 |
|------|------|----------|
| 不给 `ephemeral` 挂 tests | ephemeral 模型无物化结果 | 改挂下游物化模型 |
| SCD2 默认 `where` | 只测当前有效行 | 添加 `is_current = 1` 或 `end_dt = '9999-12-31'` |
| 分区窗口过滤 | 降低 Hive 全表扫描成本 | 默认加 `where dt >= date_sub(current_date, N)` |
| Hive 函数兼容 | 正则/日期函数可能需调整 | 输出中标注 Hive 方言注意事项 |

**Source:** 06-RESEARCH.md Codex 共识

## 与 Phase 5 检查清单的对应

| 检查清单 ID | 规则描述 | DQ 实现 |
|-------------|----------|---------|
| G01 | 粒度主键唯一 | `unique` test |
| D01 | description 必填 | schema.yml 配置 |
| D03 | tests 覆盖率 | 本文件字段类型规则 |
| N01 | 表名符合规范 | 人工检查（非自动化） |

**Source:** review-checklist.md 规则 ID 映射

## 常用 dbt-expectations 测试

| 测试 | 用途 | 关键参数 |
|------|------|----------|
| `expect_column_values_to_be_between` | 范围检查 | `min_value`, `max_value` |
| `expect_column_values_to_match_regex` | 正则匹配 | `regex` |
| `expect_column_values_to_be_in_set` | 枚举值 | `value_set` |
| `expect_row_values_to_have_recent_data` | 新鲜度 | `datepart`, `interval` |

**Source:** [dbt-expectations GitHub](https://github.com/calogica/dbt-expectations)

---

*Token budget: ~950 tokens*

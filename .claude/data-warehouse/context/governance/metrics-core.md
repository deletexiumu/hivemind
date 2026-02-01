---
type: context-core
domain: governance
document: metrics-core
source: 06-RESEARCH.md + dbt Semantic Layer 2.0
version: 1.0.0
token_budget: 1000
---

# 指标分类与 Semantic Layer 格式

## 指标分类体系（三分法）

| 类别 | 英文 | 定义 | MetricFlow 类型映射 | 示例 |
|------|------|------|---------------------|------|
| 原子指标 | Atomic | 直接聚合的基础度量，不依赖其他指标 | `type: simple` | `SUM(order_amount)` |
| 派生指标 | Derived | 基于原子指标的计算，引用 1-2 个指标 | `type: derived` / `type: ratio` | `订单总额 / 订单数` |
| 复合指标 | Composite | 多指标组合或复杂逻辑，引用 2+ 派生指标 | `type: derived`（嵌套） | `(销售额 - 退款额) / 用户数` |

**Source:** 06-CONTEXT.md 用户决策 + MetricFlow 官方文档

## 派生/复合指标关联规则

- 派生/复合指标**必须关联**已定义的原子指标 ID
- 在 `type_params.metrics` 中声明依赖
- 确保指标血缘可追溯

## Semantic Layer 2.0 格式速查

### semantic_models 结构要点

| 组件 | 用途 | 关键配置 |
|------|------|----------|
| `entities` | 定义实体 | `type: primary` / `type: foreign` |
| `dimensions` | 定义维度 | `type: time` / `type: categorical` |
| `measures` | 定义度量 | `agg: sum/count/count_distinct/avg/min/max` |
| `defaults` | 默认配置 | `agg_time_dimension: {time_dim}` |

### metrics 结构要点

| 属性 | 说明 |
|------|------|
| `type` | `simple` / `derived` / `ratio` / `cumulative` / `conversion` |
| `type_params.measure` | 引用 semantic_models 中的 measure（simple 类型） |
| `type_params.expr` | 派生指标的计算表达式 |
| `type_params.metrics` | 派生指标依赖的其他指标列表 |

**Source:** [dbt Semantic Models](https://docs.getdbt.com/docs/build/semantic-models)

## Stage 1 必问项（Codex 共识）

| 必问项 | 用途 | 缺失影响 |
|--------|------|----------|
| **grain（粒度声明）** | 确定 semantic_model 的主 entity | 无法正确定义 entities |
| **时间字段** | 用于 time dimension 和 agg_time_dimension | 无法支持时间序列查询 |
| **可切维度** | 用于 dimensions 定义 | 限制指标分析能力 |

## 示例片段

```yaml
# semantic_models 关键结构
semantic_models:
  - name: order_facts
    model: ref('dwd_fact_order_detail')
    defaults:
      agg_time_dimension: order_date
    entities:
      - name: order
        type: primary
        expr: order_sk
    measures:
      - name: order_amount
        agg: sum
        expr: line_amount

# metrics 关键结构
metrics:
  - name: total_order_amount
    type: simple
    type_params:
      measure: order_amount
  - name: avg_order_value
    type: derived
    type_params:
      expr: total_order_amount / order_count
      metrics:
        - name: total_order_amount
        - name: order_count
```

---

*Token budget: ~900 tokens*

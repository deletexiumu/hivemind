---
type: scenario-example
scenario: define-metrics
example: atomic-metric
complexity: simple
metric_type: simple
domain: order
---

# 案例：订单总额（原子指标）

## 输入

```yaml
metric_name: 订单总额
description: 统计一段时间内所有已完成订单的金额总和
```

## Stage 1 输出

### 指标规格书

#### 基本信息

| 属性 | 值 |
|------|-----|
| **指标名称** | 订单总额 |
| **指标 ID** | `order_total_amount` |
| **分类** | 原子指标 |
| **业务描述** | 统计一段时间内所有已完成订单的金额总和 |

#### 分类判定

**判定：原子指标**
- 直接聚合单一字段（`SUM(order_amount)`）
- 不依赖其他已定义指标
- 可作为其他派生指标的基础

#### 计算定义

| 属性 | 值 |
|------|-----|
| **计算公式** | `SUM(order_amount)` |
| **聚合方式** | SUM |
| **粒度** | (待确认) |
| **时间维度** | (待确认) |
| **可切维度** | (待确认) |

#### 数据来源

| 属性 | 值 |
|------|-----|
| **源模型** | `dwd_fact_order_detail` (推测) |
| **源字段** | `order_amount` |
| **数据分层** | DWD |

### 待确认

1. **粒度**：按日汇总还是保留订单级别明细？
2. **时间字段**：使用 `order_date` 还是 `payment_date`？
3. **可切维度**：需要按哪些维度分析（如：渠道、地区、客户类型）？
4. **状态过滤**：是否仅统计 `status = 'completed'` 的订单？
5. **源模型确认**：是否使用 `dwd_fact_order_detail` 模型？

---

回复"**生成 YAML**"获取 dbt Semantic Layer 配置。

---

## 用户确认

```
粒度：每日
时间字段：order_date
可切维度：渠道(channel)、地区(region)、客户类型(customer_type)
状态过滤：是，仅 completed
源模型：确认 dwd_fact_order_detail
```

---

## Stage 2 输出

### File: models/semantic/order_semantic.yml

```yaml
version: 2

semantic_models:
  - name: order_facts
    model: ref('dwd_fact_order_detail')
    description: |
      订单事实表语义模型
      粒度：每笔订单明细
      用于订单相关指标计算
    defaults:
      agg_time_dimension: order_date

    entities:
      - name: order
        type: primary
        expr: order_detail_sk

    dimensions:
      - name: order_date
        type: time
        type_params:
          time_granularity: day
      - name: channel
        type: categorical
        expr: channel_code
      - name: region
        type: categorical
        expr: region_code
      - name: customer_type
        type: categorical
        expr: customer_type

    measures:
      - name: order_amount_sum
        description: "订单金额累计"
        agg: sum
        expr: order_amount
        create_metric: true

metrics:
  - name: order_total_amount
    description: "统计一段时间内所有已完成订单的金额总和"
    type: simple
    label: "订单总额"
    type_params:
      measure: order_amount_sum
    filter: |
      {{ Dimension('order__order_status') }} = 'completed'
    meta:
      owner: data-platform
      category: atomic
      domain: order
```

### File: docs/metrics/order_total_amount.md

```markdown
# 订单总额

## 业务口径

统计一段时间内所有已完成订单的金额总和。

**分类：** 原子指标

## 计算逻辑

**公式：** `SUM(order_amount)`

**聚合方式：** SUM

**数据来源：** `dwd_fact_order_detail.order_amount`

**过滤条件：** `order_status = 'completed'`

## 维度切面

| 维度 | 说明 |
|------|------|
| order_date | 时间维度（按日） |
| channel | 销售渠道 |
| region | 地区 |
| customer_type | 客户类型 |

## 使用说明

1. 用于分析订单销售趋势
2. 可按渠道、地区、客户类型进行下钻分析
3. 仅包含已完成订单，退款订单不计入

## 关联指标

| 指标 ID | 关系 |
|---------|------|
| order_count | 可组合计算平均客单价 |
| order_refund_amount | 互斥关系（退款不计入订单总额） |

## 变更历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0 | 2026-02-01 | 初始版本 |
```

---

## 案例要点

**关键决策点：**
- 判定为原子指标：直接 SUM 聚合，无指标依赖
- MetricFlow 类型映射：`type: simple`
- 使用 `filter` 而非在 measure 中过滤，保持 measure 通用性

**适用场景：**
- 基础业务度量定义
- 作为派生指标的组成部分

**注意事项：**
- 原子指标应尽量保持纯净（不含业务过滤）
- 业务过滤在 metric 层通过 filter 实现
- 确保指标 ID 遵循 `{domain}_{name}` 命名规范

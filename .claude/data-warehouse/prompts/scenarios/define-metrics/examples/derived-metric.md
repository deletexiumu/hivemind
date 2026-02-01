---
type: scenario-example
scenario: define-metrics
example: derived-metric
complexity: medium
metric_type: derived
domain: order
---

# 案例：平均客单价（派生指标）

## 输入

```yaml
metric_name: 平均客单价
description: 每笔订单的平均金额，用于衡量客户消费水平
related_metrics:
  - 订单总额
  - 订单数
```

## Stage 1 输出

### 指标规格书

#### 基本信息

| 属性 | 值 |
|------|-----|
| **指标名称** | 平均客单价 |
| **指标 ID** | `order_avg_value` |
| **分类** | 派生指标 |
| **业务描述** | 每笔订单的平均金额，用于衡量客户消费水平 |

#### 分类判定

**判定：派生指标**
- 基于两个原子指标计算：订单总额 / 订单数
- 引用已定义的原子指标 ID
- 是比率类指标（分子/分母结构）

#### 计算定义

| 属性 | 值 |
|------|-----|
| **计算公式** | `order_total_amount / order_count` |
| **聚合方式** | 派生（ratio） |
| **粒度** | 继承自依赖指标 |
| **时间维度** | 继承自依赖指标 |
| **可切维度** | 继承自依赖指标（取交集） |

#### 数据来源

| 属性 | 值 |
|------|-----|
| **源模型** | 无直接来源（通过依赖指标派生） |
| **源字段** | - |
| **数据分层** | - |

#### 指标依赖

| 依赖指标 ID | 指标名称 | 依赖类型 |
|-------------|----------|----------|
| `order_total_amount` | 订单总额 | 分子 |
| `order_count` | 订单数 | 分母 |

### 待确认

1. **分母为零处理**：订单数为 0 时返回 NULL 还是 0？
2. **是否排除退款订单**：退款后的订单是否计入？
3. **依赖指标确认**：`order_total_amount` 和 `order_count` 是否已定义？

---

回复"**生成 YAML**"获取 dbt Semantic Layer 配置。

---

## 用户确认

```
分母为零：返回 NULL
排除退款：是，与订单总额一致
依赖指标：已定义
```

---

## Stage 2 输出

### File: models/semantic/order_semantic.yml

> 追加到现有的 order_semantic.yml 文件

```yaml
version: 2

semantic_models:
  - name: order_facts
    model: ref('dwd_fact_order_detail')
    description: |
      订单事实表语义模型
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
      - name: order_count
        description: "订单数量"
        agg: count_distinct
        expr: order_no

metrics:
  # 原子指标：订单总额
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

  # 原子指标：订单数
  - name: order_count
    description: "已完成订单的数量"
    type: simple
    label: "订单数"
    type_params:
      measure: order_count
    filter: |
      {{ Dimension('order__order_status') }} = 'completed'
    meta:
      owner: data-platform
      category: atomic
      domain: order

  # 派生指标：平均客单价
  - name: order_avg_value
    description: "每笔订单的平均金额，用于衡量客户消费水平"
    type: derived
    label: "平均客单价"
    type_params:
      expr: order_total_amount / NULLIF(order_count, 0)
      metrics:
        - name: order_total_amount
        - name: order_count
    meta:
      owner: data-platform
      category: derived
      domain: order
      depends_on:
        - order_total_amount
        - order_count
```

### File: docs/metrics/order_avg_value.md

```markdown
# 平均客单价

## 业务口径

每笔订单的平均金额，用于衡量客户消费水平。

**分类：** 派生指标

## 计算逻辑

**公式：** `订单总额 / 订单数`

**表达式：** `order_total_amount / NULLIF(order_count, 0)`

**聚合方式：** 派生计算（derived）

## 指标依赖

| 指标 ID | 指标名称 | 依赖类型 |
|---------|----------|----------|
| `order_total_amount` | 订单总额 | 分子 |
| `order_count` | 订单数 | 分母 |

## 维度切面

| 维度 | 说明 |
|------|------|
| order_date | 时间维度（按日） |
| channel | 销售渠道 |
| region | 地区 |
| customer_type | 客户类型 |

> 可切维度为依赖指标的交集

## 使用说明

1. 用于评估客户消费能力
2. 可按渠道对比不同销售渠道的客单价表现
3. 分母为零时返回 NULL（无订单不计算）
4. 仅包含已完成订单（继承自依赖指标过滤条件）

## 注意事项

- 派生指标的过滤条件继承自依赖的原子指标
- 修改 `order_total_amount` 或 `order_count` 的口径会影响本指标
- 时间范围跨度较大时注意数据波动

## 关联指标

| 指标 ID | 关系 |
|---------|------|
| order_total_amount | 分子（直接依赖） |
| order_count | 分母（直接依赖） |
| order_max_value | 相关（最高客单价） |

## 变更历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0 | 2026-02-01 | 初始版本 |
```

---

## 案例要点

**关键决策点：**
- 判定为派生指标：引用两个原子指标进行计算
- MetricFlow 类型映射：`type: derived`
- 使用 `NULLIF` 处理分母为零场景
- 在 `meta.depends_on` 中声明依赖，确保血缘可追溯

**适用场景：**
- 比率类业务指标（如转化率、客单价、毛利率）
- 需要组合多个基础指标的场景

**注意事项：**
- 派生指标必须关联已定义的原子指标 ID
- `type_params.metrics` 列出所有依赖指标
- `meta.depends_on` 冗余声明以支持血缘分析工具
- 派生指标的维度切面是依赖指标的交集

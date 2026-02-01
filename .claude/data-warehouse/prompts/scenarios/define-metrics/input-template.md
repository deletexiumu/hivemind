---
type: input-template
scenario: define-metrics
version: 1.0.0
---

# 定义指标 - 输入模板

## 字段定义

| 字段名 | 说明 | 类型 | 必填/推荐/可选 |
|--------|------|------|----------------|
| `metric_name` | 指标名称（中文业务名称） | string | **必填** |
| `business_desc` | 业务描述（指标的业务含义和用途） | string | **必填** |
| `calculation_logic` | 计算逻辑草稿（公式或口径描述） | string | 推荐 |
| `grain` | 统计粒度（grain + 时间字段 + 可切维度） | object | 推荐 |
| `source_table` | 数据来源表（dbt 模型名称） | string | 可选 |
| `metric_type` | 指标类型（原子/派生/复合） | string | 可选 |

---

## YAML 模板

复制以下模板并填写：

```yaml
# === 必填信息 ===
metric_name: ""        # [必填] 指标名称（中文），如"订单总额"
business_desc: ""      # [必填] 业务描述，如"统计一段时间内所有已完成订单的金额总和"

# === 推荐信息 ===
calculation_logic: ""  # [推荐] 计算逻辑，如 "SUM(order_amount)"

grain:                 # [推荐] 统计粒度（Semantic Layer 必需）
  entity: ""           # 主实体，如 "订单"
  time_field: ""       # 时间字段，如 "order_date"
  dimensions: []       # 可切维度，如 ["渠道", "地区", "客户类型"]

# === 可选信息 ===
source_table: ""       # [可选] 数据来源表，如 "dwd_fact_order_detail"
metric_type: ""        # [可选] 指标类型：atomic（原子）/ derived（派生）/ composite（复合）
depends_on: []         # [可选] 依赖指标 ID（派生/复合指标必填）
filter_condition: ""   # [可选] 过滤条件，如 "status = 'completed'"
```

---

## 示例输入

### 示例 1：原子指标（完整输入）

```yaml
metric_name: 订单总额
business_desc: 统计一段时间内所有已完成订单的金额总和

calculation_logic: SUM(order_amount)

grain:
  entity: 订单
  time_field: order_date
  dimensions:
    - 渠道
    - 地区
    - 客户类型

source_table: dwd_fact_order_detail
metric_type: atomic
filter_condition: "order_status = 'completed'"
```

### 示例 2：派生指标（依赖已有指标）

```yaml
metric_name: 平均客单价
business_desc: 每笔订单的平均金额，衡量客户消费水平

calculation_logic: 订单总额 / 订单数量
metric_type: derived

depends_on:
  - order_total_amount
  - order_count

grain:
  entity: 订单
  time_field: order_date
  dimensions:
    - 渠道
    - 地区
```

### 示例 3：最小输入

```yaml
metric_name: 日活用户数
business_desc: 当日有登录行为的去重用户数
```

> **说明：** 仅提供必填字段时，系统会在 Stage 1 追问 grain（粒度）、时间字段、可切维度等关键信息。

---

## 常见错误提示

| 错误类型 | 错误示例 | 正确示例 |
|----------|----------|----------|
| 业务描述过于简单 | `business_desc: 订单金额` | `business_desc: 统计一段时间内所有已完成订单的金额总和` |
| 派生指标缺少依赖 | 派生指标未声明 `depends_on` | 明确列出依赖的原子指标 ID |
| 缺少时间字段 | 未说明按什么时间聚合 | 在 `grain.time_field` 中声明 |

---

## Semantic Layer 提示

本场景输出会生成 **dbt Semantic Layer 2.0 格式** 的 YAML 配置：

1. **semantic_models** — 定义数据模型和度量
2. **metrics** — 定义指标（simple/derived/ratio）

**指标类型与 MetricFlow 映射：**

| 指标类型 | MetricFlow 类型 | 说明 |
|----------|-----------------|------|
| 原子指标 | `type: simple` | 直接聚合单一 measure |
| 派生指标 | `type: derived` / `type: ratio` | 基于其他指标计算 |
| 复合指标 | `type: derived`（嵌套） | 多层指标组合 |

---

## 输入后的交互流程

1. **Stage 1（规格书）：** 系统输出指标规格书（分类、公式、源表追踪、待确认问题）
2. **Stage 2（完整产物）：** 用户确认后，系统生成 Semantic Layer YAML + 口径说明文档

回复"生成 YAML"或"确认"可触发 Stage 2 生成完整产物。

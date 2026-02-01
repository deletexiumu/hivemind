---
type: input-template
scenario: analyze-lineage
version: 1.0.0
---

# 分析血缘 - 输入模板

## 字段定义

| 字段名 | 说明 | 类型 | 必填/推荐/可选 |
|--------|------|------|----------------|
| `target_model` | 目标模型名称或 SQL 代码 | string | **必填** |
| `analysis_mode` | 分析模式（table_level / column_level / impact_assessment） | string | 推荐 |
| `change_description` | 变更描述（影响评估模式必填） | object | 可选* |
| `project_context` | dbt 项目路径或 sources.yml | string | 可选 |

> *当 `analysis_mode: impact_assessment` 时，`change_description` 为必填。

---

## YAML 模板

复制以下模板并填写：

```yaml
# === 必填信息 ===
target_model: |        # [必填] 目标模型 SQL 或模型名称
  -- 直接粘贴 SQL/dbt 模型代码
  SELECT ...

# === 推荐信息 ===
analysis_mode: ""      # [推荐] 分析模式：table_level / column_level / impact_assessment

# === 可选信息 ===
change_description:    # [可选] 变更描述（影响评估模式必填）
  object: ""           # 变更对象，如 "dim_customer.customer_level"
  change_type: ""      # 变更类型：add / modify / delete / rename
  content: ""          # 变更内容描述

project_context: ""    # [可选] dbt 项目路径，用于解析 ref()/source()

upstream_schemas: []   # [可选] 上游表结构（提高字段级精度）
```

---

## 示例输入

### 示例 1：表级血缘分析

```yaml
target_model: |
  SELECT
      o.order_id,
      c.customer_name,
      p.product_name,
      o.order_amount
  FROM {{ ref('dwd_fact_orders') }} o
  LEFT JOIN {{ ref('dim_customer') }} c ON o.customer_key = c.customer_sk
  LEFT JOIN {{ ref('dim_product') }} p ON o.product_key = p.product_sk

analysis_mode: table_level
```

### 示例 2：字段级血缘分析

```yaml
target_model: |
  SELECT
      CAST(conv(substr(md5(concat_ws('||', o.order_id, o.item_id)), 1, 15), 16, 10) AS BIGINT) AS order_detail_sk,
      c.customer_sk AS customer_key,
      o.order_amount AS line_amount,
      CASE
          WHEN o.status = 'PAID' THEN 'completed'
          ELSE 'pending'
      END AS order_status
  FROM {{ source('ods', 'order_detail') }} o
  LEFT JOIN {{ ref('dim_customer') }} c
      ON o.customer_id = c.customer_id AND c.is_current = 1

analysis_mode: column_level

upstream_schemas:
  - table: ods.order_detail
    columns: [order_id, item_id, customer_id, order_amount, status]
  - table: dim_customer
    columns: [customer_sk, customer_id, customer_name, is_current]
```

### 示例 3：变更影响评估

```yaml
target_model: dim_customer

analysis_mode: impact_assessment

change_description:
  object: dim_customer.customer_level
  change_type: modify
  content: "将 customer_level 从 VARCHAR(10) 扩展为 VARCHAR(50)，并新增枚举值 'PLATINUM'"
```

### 示例 4：最小输入

```yaml
target_model: |
  SELECT * FROM {{ ref('dwd_fact_orders') }}
```

> **说明：** 仅提供 SQL 时，默认进行表级血缘分析（Stage 1）。回复"字段级"可进入 Stage 2。

---

## 常见错误提示

| 错误类型 | 错误示例 | 正确示例 |
|----------|----------|----------|
| 影响评估无变更描述 | `analysis_mode: impact_assessment` 但无 `change_description` | 同时提供变更对象、类型、内容 |
| SQL 不完整 | `SELECT * FROM ...`（无表名） | 完整的 SELECT 语句或 dbt 模型 |
| 缺少上游结构 | 复杂 SQL 无法推断字段来源 | 在 `upstream_schemas` 中提供源表结构 |

---

## 精度提示

**字段级血缘精度受以下因素影响：**

| 因素 | 影响 | 建议 |
|------|------|------|
| `SELECT *` | 无法确定字段来源 | 列出具体字段 |
| 窗口函数 | 复杂表达式精度降为 B/C 级 | 接受或人工确认 |
| 动态 SQL / UDF | 无法解析，标记 D 级 | 需人工确认 |
| 递归 CTE | 可能无法完全追踪 | 标记需验证 |

**置信度等级说明：**

| 等级 | 含义 | 处理 |
|------|------|------|
| **A** | AST 可确定、无歧义 | 直接采信 |
| **B** | 可解析但存在复杂性 | 一般可信 |
| **C** | 存在歧义，启发式推断 | 需验证 |
| **D** | 无法可靠判断 | 需人工确认 |

---

## 分析模式说明

| 模式 | 输出内容 | 适用场景 |
|------|----------|----------|
| `table_level` | 表级依赖图 + JOIN 关联分析 | 快速了解依赖关系 |
| `column_level` | 字段级映射表 + 边置信度 | 详细追踪字段来源 |
| `impact_assessment` | 变更影响链路 + 处理清单 | 评估变更影响范围 |

---

## 输入后的交互流程

1. **Stage 1（表级血缘）：** 系统输出依赖图、JOIN 关联分析、识别统计
2. **Stage 2（字段级血缘）：** 用户回复"字段级"，获取字段映射表和边置信度
3. **Stage 3（影响评估）：** 用户提供变更描述或回复"影响评估"，获取变更影响链路

回复"字段级"、"详细血缘"可进入 Stage 2。
提供变更描述或回复"影响评估"可进入 Stage 3。

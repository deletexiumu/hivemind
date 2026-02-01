---
type: input-template
scenario: review-existing-model
version: 1.0.0
---

# 评审已有模型 - 输入模板

## 字段定义

| 字段名 | 说明 | 类型 | 必填/推荐/可选 |
|--------|------|------|----------------|
| `model_code` | SQL 代码或 dbt 模型（待评审的模型） | string | **必填** |
| `dbt_config` | schema.yml 配置（dbt 元数据） | string | 推荐 |
| `layer_context` | 分层信息（ODS/DWD/DWS/ADS） | string | 可选 |
| `review_focus` | 重点评审维度（命名/分层/粒度/类型/配置） | array | 可选 |

---

## 输入格式说明

**model_code 支持两种方式：**

1. **直接粘贴 SQL/dbt 代码**
2. **提供文件路径**（如 `models/dwd/dwd_fact_orders.sql`）

---

## YAML 模板

复制以下模板并填写：

```yaml
# === 必填信息 ===
model_code: |
  # [必填] 直接粘贴 SQL 代码或 dbt 模型代码
  SELECT ...

# === 推荐信息 ===
dbt_config: |
  # [推荐] schema.yml 配置（便于评审 dbt 配置维度）
  version: 2
  models:
    - name: xxx
      columns: ...

# === 可选信息 ===
layer_context: ""      # [可选] 分层声明，如 "DWD"
grain: ""              # [可选] 粒度声明，如 "一笔订单一行"
review_focus:          # [可选] 重点评审维度
  - naming             # 命名规范
  - layer_ref          # 分层引用
  - grain_pk           # 粒度与主键
  - field_type         # 字段类型与注释
  - dbt_config         # dbt 配置
```

---

## 示例输入

### 示例 1：完整输入（SQL + 元信息 + schema.yml）

```yaml
model_code: |
  {{
    config(
      materialized='incremental',
      incremental_strategy='insert_overwrite',
      partition_by=['dt']
    )
  }}

  SELECT
      order_id AS order_sk,
      customer_id AS customer_key,
      orderAmt AS order_amount,
      order_status,
      dt
  FROM {{ source('ods', 'orders') }}
  WHERE dt = '{{ var("ds") }}'

dbt_config: |
  version: 2
  models:
    - name: dwd_fact_orders
      columns:
        - name: order_sk
          tests: [unique, not_null]

layer_context: DWD
grain: 一笔订单 = 一行
```

### 示例 2：最小输入（仅 SQL）

```yaml
model_code: |
  SELECT
      order_id,
      customer_id,
      order_amount,
      status,
      dt
  FROM ods.orders
  WHERE dt >= '2024-01-01'
```

> **说明：** 仅提供 SQL 时，系统会尽可能推断分层和粒度，未能评审的维度会标记为"未评审（信息不足）"。

---

## 常见错误提示

| 错误类型 | 错误示例 | 正确示例 |
|----------|----------|----------|
| SQL 不完整 | `SELECT * FROM ...`（无表名） | 完整的 SELECT 语句 |
| 分层与表名不一致 | `layer_context: DWS` 但表名是 `dwd_xxx` | 分层与表名前缀一致 |
| schema.yml 格式错误 | YAML 缩进不正确 | 标准 YAML 格式 |

---

## 评审维度说明

| 评审维度 | 检查内容 | 需要的输入 |
|----------|----------|-----------|
| **命名规范** | 表名前缀、字段命名、保留字 | SQL |
| **分层引用** | 跨层依赖、维度表引用 | SQL + layer_context |
| **粒度与主键** | 粒度声明、主键一致性、隐藏扇形 | SQL + grain |
| **字段类型与注释** | 类型合理性、注释完整性 | SQL + DDL（可选） |
| **dbt 配置** | description、tests、meta 标签 | dbt_config |

---

## 输入后的交互流程

1. **Stage 1（问题概览）：** 系统输出评审总览、检查清单、问题摘要
2. **Stage 2（修复建议）：** 用户回复"查看修复建议"，获取每个问题的详细修复方案

回复"查看修复建议"或"详细"可触发 Stage 2 输出完整修复建议。

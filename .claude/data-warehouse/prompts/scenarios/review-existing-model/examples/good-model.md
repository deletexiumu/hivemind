---
type: scenario-example
scenario: review-existing-model
example: good-model
quality_level: high
expected_result: 通过
expected_score: 95-100
---

# 案例：高质量订单事实表

展示一个符合规范的高质量模型评审过程。

## 输入

### SQL 代码

```sql
-- dwd_fact_order_detail.sql
-- 订单明细事实表，粒度：每个订单行

{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    on_schema_change='fail'
  )
}}

WITH order_detail AS (
    SELECT
        order_id,
        order_item_id,
        customer_id,
        product_id,
        order_date,
        quantity,
        unit_price,
        quantity * unit_price AS line_amount,
        updated_at,
        dt
    FROM {{ ref('ods_order_detail') }}
    WHERE dt >= date_sub('{{ var("ds") }}', 7)
),

deduplicated AS (
    SELECT *, ROW_NUMBER() OVER (
        PARTITION BY order_id, order_item_id, dt
        ORDER BY updated_at DESC
    ) AS rn
    FROM order_detail
)

SELECT
    CAST(conv(substr(md5(concat_ws('||', order_id, order_item_id, dt)), 1, 15), 16, 10) AS BIGINT) AS order_detail_sk,
    order_id,
    order_item_id,
    COALESCE(c.customer_sk, -1) AS customer_key,
    COALESCE(p.product_sk, -1) AS product_key,
    order_date,
    quantity,
    unit_price,
    line_amount,
    0 AS is_deleted,
    CURRENT_TIMESTAMP AS dw_create_time,
    CURRENT_TIMESTAMP AS dw_modify_time,
    CAST('{{ var("ds") }}' AS DATE) AS etl_date,
    dt
FROM deduplicated d
LEFT JOIN {{ ref('dim_customer') }} c ON d.customer_id = c.customer_id AND c.is_current = 1
LEFT JOIN {{ ref('dim_product') }} p ON d.product_id = p.product_id
WHERE d.rn = 1
```

### 元信息

| 项目 | 值 |
|------|-----|
| 分层 | DWD |
| 粒度 | 一个订单行（order_id + order_item_id） |

### schema.yml

```yaml
version: 2

models:
  - name: dwd_fact_order_detail
    description: "订单明细事实表，记录每个订单行的详细信息"
    meta:
      owner: data-team
      layer: dwd
      grain: order_item
    columns:
      - name: order_detail_sk
        description: "订单明细代理键"
        tests: [unique, not_null]
      - name: customer_key
        description: "客户维度外键"
        tests:
          - not_null
          - relationships:
              to: ref('dim_customer')
              field: customer_sk
      - name: line_amount
        description: "订单行金额（可加）"
        meta:
          additivity: additive
```

---

## Stage 1 输出

### 评审总览

| 指标 | 值 |
|------|-----|
| **结论** | 通过 |
| **评审范围** | 完整 |
| **质量分** | 97/100 |
| **P0 问题** | 0 个 |
| **P1 问题** | 0 个 |
| **P2 问题** | 1 个 |
| **P3 问题** | 0 个 |

### 检查清单（聚合视图）

**1. 命名规范检查 (10/10)** - 全部通过

**2. 分层引用检查 (5/5)** - 全部通过

**3. 粒度与主键检查 (5/5)** - 全部通过

**4. 字段类型与注释检查 (5/6)**
- [x] F04: 部分度量字段未标注可加性（quantity, unit_price） - P2

**5. dbt 配置检查 (7/7)** - 全部通过

### 问题摘要

| # | 级别 | 类别 | 问题 | 位置 | 规则 ID |
|---|------|------|------|------|---------|
| 1 | P2 | 字段类型 | quantity、unit_price 未标注可加性 | schema.yml | F04 |

---

## Stage 2 输出

### [P2] 度量可加性未标注 (S 档)

**位置：** schema.yml columns 定义

**当前：**
```yaml
- name: quantity
  description: "数量"
- name: unit_price
  description: "单价"
```

**修复后：**
```yaml
- name: quantity
  description: "数量（可加）"
  meta:
    additivity: additive
- name: unit_price
  description: "单价（不可加）"
  meta:
    additivity: non-additive
```

**修复理由：** 按 `fact-table-types-core.md`，度量字段应标注可加性（additive/semi-additive/non-additive），便于下游聚合时判断。

---

## 要点

1. **高质量模型特征**：命名规范（N01-N10 全通过）、粒度清晰（G01-G05 全通过）、分层正确（L01-L05 全通过）、dbt 配置完整（D01-D07 全通过）
2. **唯一问题（P2）**：可加性标注不完整（F04），属于优化建议而非必须修复
3. **评审范围**：完整（提供了 SQL + 元信息 + schema.yml）
4. **结论**：通过 - 无 P0/P1 问题，质量分 97

---

Source: review-checklist.md | Updated: 2026-02-01

---
type: example
scenario: design-new-model
domain: e-commerce
complexity: complex
fact_type: transaction
dimensions: 5
scd_types: [Type1, Type2]
---

# 案例：电商订单明细

## 输入

```yaml
business_event: 订单明细（每个订单行一条记录）
grain: 一个订单 + 一个商品 = 一行
measures:
  - name: quantity
    desc: 数量
  - name: unit_price
    desc: 单价
  - name: order_amount
    desc: 订单金额
  - name: discount_amount
    desc: 折扣金额
  - name: paid_amount
    desc: 实付金额
dimensions:
  - name: 客户
    scd: Type2
    reason: 需追踪会员等级变化
  - name: 商品
    scd: Type1
    reason: 商品信息覆盖即可
  - name: 门店
    scd: Type1
  - name: 日期
  - name: 订单状态
source:
  - ods_mysql.order_header
  - ods_mysql.order_detail
```

## Stage 1 输出

### 输入解析

| 字段 | 值 |
|------|-----|
| 业务事件 | 订单明细 |
| 粒度 | 一个订单 + 一个商品 = 一行 |
| 度量 | quantity, unit_price, order_amount, discount_amount, paid_amount |
| 维度 | 客户(SCD2), 商品(SCD1), 门店(SCD1), 日期, 订单状态 |

### 决策摘要

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 事实表类型 | 事务事实表 | 每笔订单行是独立业务事件 |
| 客户 SCD | Type 2 | 需追踪会员等级历史 |
| 商品 SCD | Type 1 | 商品属性变更直接覆盖 |
| 门店 SCD | Type 1 | 门店信息低频变更 |
| 分层落点 | 事实表 DWD, 维度表 DWD | 原子粒度 |
| 键策略 | FK 使用 customer_key 指向 dim_customer.customer_sk | SCD2 关联代理键 |

### 假设清单

1. 订单状态作为退化维度存储在事实表中
2. 日期维度使用 date_key (yyyyMMdd) 格式
3. 迟到维使用 Unknown 成员 (sk=-1)

### 完整度评估

**可生成可运行 SQL** - 已提供：source 表、分区列(dt)、去重键、字段清单、粒度定义

## Stage 2 输出

### 星型模型图

```mermaid
erDiagram
    DIM_CUSTOMER ||--o{ DWD_FACT_ORDER_DETAIL : customer_key
    DIM_PRODUCT ||--o{ DWD_FACT_ORDER_DETAIL : product_key
    DIM_STORE ||--o{ DWD_FACT_ORDER_DETAIL : store_key
    DIM_DATE ||--o{ DWD_FACT_ORDER_DETAIL : date_key

    DWD_FACT_ORDER_DETAIL {
        bigint order_detail_sk PK
        bigint customer_key FK
        bigint product_key FK
        bigint store_key FK
        int date_key FK
        string order_no DD
        string order_status DD
        int quantity additive
        decimal unit_price non_additive
        decimal order_amount additive
        decimal discount_amount additive
        decimal paid_amount additive
    }

    DIM_CUSTOMER {
        bigint customer_sk PK
        bigint customer_id BK
        string customer_name
        string customer_level
        date dw_valid_from
        date dw_valid_to
        tinyint is_current
    }

    DIM_PRODUCT {
        bigint product_sk PK
        bigint product_id BK
        string product_name
        string category_name
    }

    DIM_STORE {
        bigint store_sk PK
        bigint store_id BK
        string store_name
        string city_name
    }

    DIM_DATE {
        int date_key PK
        date full_date
        int year
        int month
    }
```

### 分层落点表

| 表名 | 分层 | 类型 | 理由 |
|------|------|------|------|
| dwd_fact_order_detail | DWD | 事实表 | 原子粒度事务事实 |
| dim_customer | DWD | 维度表 | SCD Type 2 |
| dim_product | DWD | 维度表 | SCD Type 1 |
| dim_store | DWD | 维度表 | SCD Type 1 |
| dim_date | DWD | 维度表 | 日期维度 |

### File: models/dwd/dwd_fact_order_detail.sql

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    file_format='orc',
    on_schema_change='fail'
  )
}}

WITH source AS (
    SELECT
        od.order_id,
        od.order_item_id,
        oh.customer_id,
        od.product_id,
        oh.store_id,
        oh.order_no,
        oh.order_status,
        od.quantity,
        od.unit_price,
        od.order_amount,
        od.discount_amount,
        od.paid_amount,
        oh.created_at,
        od.updated_at,
        od.dt
    FROM {{ source('ods', 'order_detail') }} od
    JOIN {{ source('ods', 'order_header') }} oh ON od.order_id = oh.order_id
    WHERE od.dt >= date_sub('{{ var("ds") }}', {{ var("lookback_days", 7) }})
),

dim_customer_current AS (
    SELECT customer_id, customer_sk
    FROM {{ ref('dim_customer') }}
    WHERE is_current = 1
),

deduplicated AS (
    SELECT *, ROW_NUMBER() OVER (
        PARTITION BY order_no, order_item_id, dt
        ORDER BY updated_at DESC
    ) AS rn
    FROM source
),

final AS (
    SELECT
        CAST(conv(substr(md5(concat_ws('||', d.order_no, CAST(d.order_item_id AS STRING), d.dt)), 1, 15), 16, 10) AS BIGINT) AS order_detail_sk,
        COALESCE(c.customer_sk, -1) AS customer_key,
        COALESCE(p.product_sk, -1) AS product_key,
        COALESCE(s.store_sk, -1) AS store_key,
        CAST(date_format(d.created_at, 'yyyyMMdd') AS INT) AS date_key,
        d.order_no,
        d.order_status,
        d.quantity,
        d.unit_price,
        d.order_amount,
        d.discount_amount,
        d.paid_amount,
        CASE WHEN d.order_status = 'CANCELLED' THEN 1 ELSE 0 END AS is_deleted,
        'ods_mysql' AS data_source,
        CURRENT_TIMESTAMP AS dw_create_time,
        CURRENT_TIMESTAMP AS dw_modify_time,
        CAST('{{ var("ds") }}' AS DATE) AS etl_date,
        d.dt
    FROM deduplicated d
    LEFT JOIN dim_customer_current c ON d.customer_id = c.customer_id
    LEFT JOIN {{ ref('dim_product') }} p ON d.product_id = p.product_id
    LEFT JOIN {{ ref('dim_store') }} s ON d.store_id = s.store_id
    WHERE d.rn = 1
)

SELECT * FROM final
```

### File: models/dwd/dwd_fact_order_detail.yml

```yaml
version: 2

models:
  - name: dwd_fact_order_detail
    description: 订单明细事实表 - 粒度：一个订单行
    meta:
      layer: dwd
      fact_type: transaction
      grain: "订单 + 商品 = 一行"

    columns:
      - name: order_detail_sk
        tests: [unique, not_null]

      - name: customer_key
        tests:
          - not_null
          - relationships:
              to: ref('dim_customer')
              field: customer_sk

      - name: quantity
        meta: { additivity: additive }

      - name: unit_price
        meta: { additivity: non_additive }

      - name: order_amount
        meta: { additivity: additive }

      - name: paid_amount
        meta: { additivity: additive }
```

### File: models/dwd/dim_customer.sql

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    file_format='orc'
  )
}}

-- SCD Type 2 实现：合并历史 + 新增/变更记录
WITH current_dim AS (
    SELECT * FROM {{ this }}
    WHERE dt = '{{ var("ds") }}'
),

source_new AS (
    SELECT
        customer_id,
        customer_name,
        customer_level,
        updated_at
    FROM {{ source('ods', 'customer') }}
    WHERE dt = '{{ var("ds") }}'
),

-- 检测变更
changes AS (
    SELECT
        s.customer_id,
        s.customer_name,
        s.customer_level,
        c.customer_sk AS old_sk,
        CASE WHEN c.customer_sk IS NULL OR
             c.customer_name != s.customer_name OR
             c.customer_level != s.customer_level
             THEN 1 ELSE 0 END AS is_changed
    FROM source_new s
    LEFT JOIN current_dim c ON s.customer_id = c.customer_id AND c.is_current = 1
),

-- 关闭旧记录 + 插入新记录
final AS (
    -- 保留未变更的历史记录
    SELECT customer_sk, customer_id, customer_name, customer_level,
           dw_valid_from, dw_valid_to, is_current, dt
    FROM current_dim
    WHERE customer_id NOT IN (SELECT customer_id FROM changes WHERE is_changed = 1)

    UNION ALL

    -- 关闭变更记录
    SELECT customer_sk, customer_id, customer_name, customer_level,
           dw_valid_from, CAST('{{ var("ds") }}' AS DATE) AS dw_valid_to,
           0 AS is_current, dt
    FROM current_dim
    WHERE customer_id IN (SELECT customer_id FROM changes WHERE is_changed = 1)
      AND is_current = 1

    UNION ALL

    -- 插入新/变更记录
    SELECT
        CAST(conv(substr(md5(concat_ws('||', CAST(customer_id AS STRING), '{{ var("ds") }}')), 1, 15), 16, 10) AS BIGINT) AS customer_sk,
        customer_id, customer_name, customer_level,
        CAST('{{ var("ds") }}' AS DATE) AS dw_valid_from,
        CAST('9999-12-31' AS DATE) AS dw_valid_to,
        1 AS is_current,
        '{{ var("ds") }}' AS dt
    FROM changes
    WHERE is_changed = 1
)

SELECT * FROM final
```

## 案例要点

**关键决策点：**
- 客户维度采用 SCD Type 2，事实表 FK 关联 customer_sk（代理键）
- 订单状态作为退化维度存储在事实表中
- 迟到维使用 COALESCE(sk, -1) 处理

**适用场景：**
- 需要追踪维度历史的电商/零售订单分析
- 多维度复杂事务事实表设计

**注意事项：**
- SCD Type 2 维度表需配合 is_current 标志过滤
- insert_overwrite 必须配合 partition_by

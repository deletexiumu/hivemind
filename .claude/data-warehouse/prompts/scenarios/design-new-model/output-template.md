---
type: output-template
scenario: design-new-model
version: 1.0.0
---

# Stage 2 输出模板

用户确认 Stage 1 规格书后，按此模板生成完整产物。

---

## 1. 星型模型图

### Mermaid ER 图

```mermaid
erDiagram
    DIM_xxx ||--o{ DWD_FACT_xxx : "外键名"

    DWD_FACT_xxx {
        bigint xxx_sk PK "代理键"
        bigint xxx_key FK "维度外键"
        string order_no "退化维度"
        int quantity "度量-可加"
        decimal amount "度量-可加"
        tinyint is_deleted "标准字段"
        string dt "分区键"
    }

    DIM_xxx {
        bigint xxx_sk PK "代理键"
        bigint xxx_id BK "自然键"
        string xxx_name "属性"
        date dw_valid_from "SCD2"
        date dw_valid_to "SCD2"
        tinyint is_current "SCD2"
    }
```

> **图例：** PK=主键, FK=外键, BK=业务键（自然键）

---

## 2. 事实表定义

### 粒度声明

```
一行代表一个 {何时发生的} {何物} 的 {何种事件}
```

### 事实表类型

| 属性 | 值 |
|------|-----|
| 类型 | 事务事实表 / 周期快照 / 累积快照 |
| 推荐理由 | (根据决策树说明) |

### 度量字段

| 字段名 | 类型 | 可加性 | 说明 |
|--------|------|--------|------|
| `quantity` | INT | additive | 数量 |
| `amount` | DECIMAL(18,2) | additive | 金额 |
| `unit_price` | DECIMAL(18,2) | non_additive | 单价 |

### 维度引用

| 维度 | FK 字段 | 引用目标 | 说明 |
|------|---------|----------|------|
| 客户 | `customer_key` | `dim_customer.customer_sk` | |
| 产品 | `product_key` | `dim_product.product_sk` | |

### 标准字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `is_deleted` | TINYINT | 逻辑删除 (0/1) |
| `data_source` | STRING | 数据来源 |
| `dw_create_time` | TIMESTAMP | 入仓时间 |
| `dw_modify_time` | TIMESTAMP | 修改时间 |
| `etl_date` | DATE | ETL 处理日期 |

### DDL

```sql
CREATE TABLE IF NOT EXISTS dwd_fact_xxx (
    -- 代理键
    xxx_sk              BIGINT          COMMENT '代理键',
    -- 维度外键
    xxx_key             BIGINT          COMMENT '维度外键',
    -- 度量
    quantity            INT             COMMENT '数量（可加）',
    -- 标准字段
    is_deleted          TINYINT         COMMENT '删除标志',
    data_source         STRING          COMMENT '数据来源',
    dw_create_time      TIMESTAMP       COMMENT '入仓时间',
    dw_modify_time      TIMESTAMP       COMMENT '修改时间',
    etl_date            DATE            COMMENT 'ETL处理日期'
)
COMMENT '事实表说明 - 粒度：xxx'
PARTITIONED BY (dt STRING COMMENT '日期分区 yyyy-MM-dd')
STORED AS ORC
TBLPROPERTIES ('orc.compress'='SNAPPY', 'transactional'='false');
```

---

## 3. 维度表定义

### 维度表模板（每个维度重复此结构）

| 属性 | 值 |
|------|-----|
| 表名 | `dim_xxx` |
| 自然键 | `xxx_id` |
| SCD 策略 | Type 1 / Type 2 |
| 决策理由 | (根据属性变化追溯需求说明) |

**属性分类：**
| 属性 | 变化类型 | SCD 处理 |
|------|----------|----------|
| `name` | 缓慢变化 | Type 2 追踪 |
| `status` | 快速变化 | Type 1 覆盖 |

**迟到维处理：** Unknown 成员占位 (`xxx_sk = -1`)

### 维度 DDL

```sql
CREATE TABLE IF NOT EXISTS dim_xxx (
    xxx_sk          BIGINT      COMMENT '代理键',
    xxx_id          BIGINT      COMMENT '自然键',
    xxx_name        STRING      COMMENT '属性',
    -- SCD Type 2 字段
    dw_valid_from   DATE        COMMENT '生效开始',
    dw_valid_to     DATE        COMMENT '生效结束 (9999-12-31=当前)',
    is_current      TINYINT     COMMENT '当前版本 (1=当前)'
)
COMMENT '维度表说明'
STORED AS ORC
TBLPROPERTIES ('orc.compress'='SNAPPY');
```

---

## 4. 分层落点表

| 表名 | 分层 | 类型 | 理由 |
|------|------|------|------|
| `dwd_fact_order_detail` | DWD | 事实表 | 明细粒度 |
| `dim_customer` | DWD | 维度表 | 一致性维度 |
| `dim_product` | DWD | 维度表 | 一致性维度 |

---

## 5. dbt 模板代码

### File: models/dwd/xxx.yml

```yaml
version: 2

models:
  - name: dwd_fact_xxx
    description: |
      事实表说明
      **粒度：** xxx
      **事实类型：** 事务事实表
    meta:
      owner: data-platform
      layer: dwd
      fact_type: transaction
      grain: "xxx"
    tests:
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns: [order_no, dt]
    columns:
      - name: xxx_sk
        description: 代理键
        tests: [unique, not_null]
      - name: customer_key
        description: 客户维度外键
        tests:
          - not_null
          - relationships:
              to: ref('dim_customer')
              field: customer_sk
      - name: quantity
        description: 数量
        meta:
          additivity: additive
        tests: [not_null]
```

### File: models/dwd/xxx.sql

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
    SELECT * FROM {{ source('ods', 'xxx') }}
    WHERE dt >= date_sub('{{ var("ds") }}', {{ var("lookback_days", 7) }})
      AND dt <= '{{ var("ds") }}'
),

final AS (
    SELECT
        -- 代理键
        CAST(conv(substr(md5(concat_ws('||', id, dt)), 1, 15), 16, 10) AS BIGINT) AS xxx_sk,
        -- 维度外键
        COALESCE(dim.xxx_sk, -1) AS xxx_key,
        -- 度量
        quantity,
        -- 标准字段
        0 AS is_deleted,
        'ods' AS data_source,
        CURRENT_TIMESTAMP AS dw_create_time,
        CURRENT_TIMESTAMP AS dw_modify_time,
        CAST('{{ var("ds") }}' AS DATE) AS etl_date,
        -- 分区列必须在最后
        dt
    FROM source s
    LEFT JOIN {{ ref('dim_xxx') }} dim ON s.xxx_id = dim.xxx_id AND dim.is_current = 1
)

SELECT * FROM final
```

---

## 输出交付契约

- 每个文件必须有明确路径：`### File: {path}`
- 代码块语言必须正确：`sql` / `yaml` / `mermaid`
- 不确定部分用 `TODO:` 标记并集中列出

---

## 自检清单

- [ ] **结构完整性：** 5 个部分齐全（图/事实表/维度表/分层/dbt）
- [ ] **键规则正确：** 事实表 `*_key` → 维度 `*_sk`
- [ ] **Hive 约束合规：** 分区列 `dt` 在 SELECT 末尾，ORC + SNAPPY
- [ ] **标准字段完整：** is_deleted/data_source/dw_create_time/dw_modify_time/etl_date
- [ ] **schema.yml 完整：** version:2, meta.additivity, tests (unique/not_null/relationships)
- [ ] **dbt 配置正确：** insert_overwrite + partition_by + on_schema_change

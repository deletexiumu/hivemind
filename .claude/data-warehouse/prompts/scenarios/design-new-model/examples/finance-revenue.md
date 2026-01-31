---
type: example
scenario: design-new-model
domain: finance
complexity: medium
fact_type: periodic_snapshot
dimensions: 3
scd_types: [Type1, Type2]
---

# 案例：月度收入统计

## 输入

```yaml
business_event: 月度收入统计
grain: 一个部门 + 一个月份 = 一行
measures:
  - name: monthly_revenue
    desc: 本月收入
    additivity: additive
  - name: cumulative_revenue
    desc: 累计收入
    additivity: semi_additive
  - name: revenue_rate
    desc: 收入达成率
    additivity: non_additive
dimensions:
  - name: 部门
    scd: Type2
    reason: 组织架构变更需追踪
  - name: 时间周期
  - name: 收入类别
source:
  - dwd_fact_revenue_detail (已有事务事实表)
特点: 定期快照，非事件驱动
```

## Stage 1 输出

### 输入解析

| 字段 | 值 |
|------|-----|
| 业务事件 | 月度收入统计 |
| 粒度 | 一个部门 + 一个月份 = 一行 |
| 度量 | monthly_revenue(可加), cumulative_revenue(半可加), revenue_rate(不可加) |
| 维度 | 部门(SCD2), 时间周期, 收入类别 |

### 决策摘要

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 事实表类型 | **周期快照事实表** | 定期记录状态，非事件驱动 |
| 为什么不是事务事实表 | 事务事实表记录离散事件；这里是按周期汇总的状态量 |
| 部门 SCD | Type 2 | 组织架构变更需追踪历史 |
| **分层落点** | **DWS** | 周期快照是汇总层，非原子粒度 |
| 键策略 | FK 使用 department_key 指向 dim_department.department_sk | SCD2 关联代理键 |

### 假设清单

1. 数据从 DWD 事务事实表聚合而来
2. 累计收入按年初至今 (YTD) 计算
3. 收入达成率 = 本月收入 / 月度目标

### 完整度评估

**可生成可运行 SQL** - 已明确上游表和计算逻辑

## Stage 2 输出

### 星型模型图

```mermaid
erDiagram
    DIM_DEPARTMENT ||--o{ DWS_SNAPSHOT_REVENUE_MONTHLY : department_key
    DIM_PERIOD ||--o{ DWS_SNAPSHOT_REVENUE_MONTHLY : period_key
    DIM_REVENUE_CATEGORY ||--o{ DWS_SNAPSHOT_REVENUE_MONTHLY : category_id

    DWS_SNAPSHOT_REVENUE_MONTHLY {
        bigint snapshot_sk PK
        bigint department_key FK
        int period_key FK
        int category_id FK
        decimal monthly_revenue additive
        decimal cumulative_revenue semi_additive
        decimal revenue_rate non_additive
        decimal monthly_target
    }

    DIM_DEPARTMENT {
        bigint department_sk PK
        bigint department_id BK
        string department_name
        string parent_department
        date dw_valid_from
        date dw_valid_to
        tinyint is_current
    }

    DIM_PERIOD {
        int period_key PK
        int year
        int month
        date period_start
        date period_end
    }

    DIM_REVENUE_CATEGORY {
        int category_id PK
        string category_name
    }
```

### 分层落点表

| 表名 | 分层 | 类型 | 理由 |
|------|------|------|------|
| dws_snapshot_revenue_monthly | **DWS** | 周期快照事实表 | 汇总层，非原子粒度 |
| dim_department | DWD | 维度表 | SCD Type 2 |
| dim_period | DWD | 维度表 | 时间周期 |
| dim_revenue_category | DWD | 维度表 | Type 1 |

### File: models/dws/dws_snapshot_revenue_monthly.sql

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    file_format='orc'
  )
}}

WITH revenue_agg AS (
    SELECT
        department_id,
        category_id,
        CAST(date_format(transaction_date, 'yyyyMM') AS INT) AS period_key,
        SUM(revenue_amount) AS monthly_revenue
    FROM {{ ref('dwd_fact_revenue_detail') }}
    WHERE dt >= date_format(date_trunc('month', CAST('{{ var("ds") }}' AS DATE)), 'yyyy-MM-dd')
    GROUP BY department_id, category_id, CAST(date_format(transaction_date, 'yyyyMM') AS INT)
),

cumulative AS (
    SELECT
        department_id,
        category_id,
        period_key,
        monthly_revenue,
        SUM(monthly_revenue) OVER (
            PARTITION BY department_id, category_id, FLOOR(period_key / 100)
            ORDER BY period_key
        ) AS cumulative_revenue
    FROM revenue_agg
),

with_target AS (
    SELECT
        c.*,
        t.monthly_target,
        CASE WHEN t.monthly_target > 0
             THEN c.monthly_revenue / t.monthly_target
             ELSE NULL END AS revenue_rate
    FROM cumulative c
    LEFT JOIN {{ ref('dim_revenue_target') }} t
        ON c.department_id = t.department_id
        AND c.period_key = t.period_key
),

dim_dept AS (
    SELECT department_id, department_sk
    FROM {{ ref('dim_department') }}
    WHERE is_current = 1
),

final AS (
    SELECT
        CAST(conv(substr(md5(concat_ws('||', CAST(d.department_id AS STRING), CAST(w.period_key AS STRING), CAST(w.category_id AS STRING))), 1, 15), 16, 10) AS BIGINT) AS snapshot_sk,
        COALESCE(dept.department_sk, -1) AS department_key,
        w.period_key,
        w.category_id,
        w.monthly_revenue,
        w.cumulative_revenue,
        w.revenue_rate,
        w.monthly_target,
        0 AS is_deleted,
        'dwd_agg' AS data_source,
        CURRENT_TIMESTAMP AS dw_create_time,
        '{{ var("ds") }}' AS dt
    FROM with_target w
    LEFT JOIN dim_dept dept ON w.department_id = dept.department_id
)

SELECT * FROM final
```

### File: models/dws/dws_snapshot_revenue_monthly.yml

```yaml
version: 2

models:
  - name: dws_snapshot_revenue_monthly
    description: 月度收入快照事实表 - 粒度：部门 + 月份
    meta:
      layer: dws
      fact_type: periodic_snapshot
      grain: "部门 + 月份 = 一行"
      snapshot_period: monthly

    columns:
      - name: snapshot_sk
        tests: [unique, not_null]

      - name: department_key
        tests:
          - not_null
          - relationships:
              to: ref('dim_department')
              field: department_sk

      - name: monthly_revenue
        description: 本月收入
        meta: { additivity: additive }

      - name: cumulative_revenue
        description: 累计收入（YTD）
        meta: { additivity: semi_additive }

      - name: revenue_rate
        description: 收入达成率
        meta: { additivity: non_additive }
```

## 案例要点

**周期快照 vs 事务事实的关键差异：**
- 事务事实：记录离散事件，可加性度量
- 周期快照：定期记录状态，通常包含半可加度量（如累计值）

**半可加度量的 schema.yml 标注：**
- `meta.additivity: semi_additive` 提醒使用者不能跨时间 SUM
- cumulative_revenue 只能取最新快照或比较同一时点

**分层落点注意：**
- 周期快照通常落 DWS（汇总层），不是 DWD
- 命名前缀使用 `dws_snapshot_` 明确表达类型

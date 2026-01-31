---
type: context
title: dbt-hive 能力边界
status: stable
domain: platform/dbt-hive
version: 1.0.0
updated_at: 2026-01-31
术语依赖:
  - hive_insert_overwrite
  - scd_slowly_changing
  - scd_type2
  - modeling_partitioning
---

# dbt-hive 能力边界

> 本文档定义 dbt-hive 适配器的功能限制与替代方案。dbt-hive 是 Cloudera 维护的 Hive 适配器，存在特定功能限制。理解这些边界对于正确使用 dbt + Hive 至关重要。

## TL;DR

- **不支持 Snapshots** — 无法使用 dbt snapshot 命令，SCD Type 2 需用增量模型手动实现
- **不支持 Ephemeral** — 无法使用 CTE 内联物化，用 View 替代
- **分区列必须在 SELECT 末尾** — Hive 动态分区语法要求
- **非 ACID 表只能用 insert_overwrite** — append 仅适用于纯追加场景
- **核心观点:** 接受限制，用分区回刷模式替代行级操作

---

## 版本兼容性矩阵

| dbt-hive | dbt-core | Python | 备注 |
|----------|----------|--------|------|
| 1.10.x | 1.10.x | >= 3.9 | 当前版本 |
| 1.7.x | 1.7.x | >= 3.8 | 稳定版本 |
| 1.4.x | 1.4.x | >= 3.8 | Iceberg 支持引入 |

> **注意:** dbt-hive 版本与 dbt-core 版本严格对应，升级时需同步更新。

---

## 支持的物化策略

| 物化类型 | 支持状态 | 说明 | 推荐场景 |
|---------|---------|------|---------|
| table | O | 全量重建 | 小表、维度表、首次加载 |
| view | O | 视图 | 逻辑层、轻量查询 |
| incremental | O | insert_overwrite / append | 大事实表、分区回刷 |
| snapshot | X | **不支持** | 用增量模型替代 |
| ephemeral | X | **不支持** | 用 view 替代 |

---

## 功能限制详解

### [P0] DBT-HIVE-001: 不支持 Snapshots

**约束 ID:** DBT-HIVE-001

**原因:** dbt-hive 适配器未实现 snapshot 物化类型。dbt snapshot 依赖的 MERGE 语句在 Hive 非 ACID 表上不可用。

**违反后果:** dbt 执行报错，模型无法创建。

**规避方案:**
1. 使用自定义增量模型实现 SCD Type 2
2. 参考 [SCD 策略文档](../methodology/scd-strategies.md) 获取完整的 SCD Type 2 实现模式
3. **增量策略实现见 [增量策略文档](./incremental-strategies.md)** — 包含 insert_overwrite 分区回刷代码示例

**示例 — SCD Type 2 增量模型替代 Snapshot:**

```sql
-- models/dim/dim_customer.sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['is_current'],
    file_format='orc'
  )
}}

WITH source AS (
    SELECT * FROM {{ source('ods', 'customer') }}
    WHERE dt = '{{ var("ds") }}'
),

existing AS (
    SELECT * FROM {{ this }}
    WHERE is_current = 1
),

changes AS (
    SELECT
        s.customer_id,
        s.customer_name,
        s.customer_address,
        CASE
            WHEN e.customer_id IS NULL THEN 'INSERT'
            WHEN s.customer_address != e.customer_address THEN 'UPDATE'
            ELSE 'UNCHANGED'
        END AS change_type
    FROM source s
    LEFT JOIN existing e ON s.customer_id = e.customer_id
)

-- 完整实现见 SCD 策略文档
SELECT * FROM final
```

**链接:** [增量策略](./incremental-strategies.md) | [SCD 策略](../methodology/scd-strategies.md)

---

### [P0] DBT-HIVE-002: 不支持 Ephemeral

**约束 ID:** DBT-HIVE-002

**原因:** dbt-hive 不支持 CTE 内联机制。Ephemeral 物化将模型编译为 CTE 插入引用处，dbt-hive 未实现此功能。

**违反后果:** dbt 执行报错。

**规避方案:**
1. 使用 View 物化替代 — 查询时展开，效果类似
2. 将逻辑拆分为独立模型

**示例:**

```sql
-- X 错误：使用 ephemeral
{{ config(materialized='ephemeral') }}
SELECT * FROM {{ source('ods', 'orders') }}

-- O 正确：改用 view
{{ config(materialized='view') }}
SELECT * FROM {{ source('ods', 'orders') }}
```

---

### [P0] DBT-HIVE-003: 分区列必须在 SELECT 末尾

**约束 ID:** DBT-HIVE-003

**原因:** Hive 动态分区语法要求分区列作为 SELECT 的最后一列（或多列），顺序与 PARTITION 子句一致。

**违反后果:** Hive 报错 `partition column must be last`，模型执行失败。

**规避方案:** 调整 SELECT 列顺序，将分区列放到末尾。

**示例:**

```sql
-- X 错误：分区列 dt 不在末尾
SELECT
    order_id,
    dt,           -- 错误位置
    customer_id,
    order_amount
FROM {{ source('ods', 'orders') }}

-- O 正确：分区列 dt 在末尾
SELECT
    order_id,
    customer_id,
    order_amount,
    dt            -- 正确位置
FROM {{ source('ods', 'orders') }}
```

**多分区列场景:**

```sql
-- 多分区列时，按 PARTITION 子句顺序排列在末尾
-- 假设 partition_by=['year', 'month']
SELECT
    order_id,
    customer_id,
    order_amount,
    year,         -- 第一个分区列
    month         -- 第二个分区列
FROM {{ source('ods', 'orders') }}
```

---

### [P0] DBT-HIVE-004: insert_overwrite 必须配合 partition_by

**约束 ID:** DBT-HIVE-004

**原因:** INSERT OVERWRITE 不带 PARTITION 子句时会覆盖整张表，导致历史数据丢失。

**违反后果:** 全表数据被覆盖，只剩本次插入的数据。**数据灾难性丢失。**

**规避方案:** 始终配置 `partition_by` 参数。

**示例:**

```sql
-- X 危险：未配置 partition_by
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite'
    -- 缺少 partition_by
  )
}}

-- O 安全：配置 partition_by
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    file_format='orc'
  )
}}
```

---

### [P0] DBT-HIVE-005: 非 ACID 表不支持 merge 策略

**约束 ID:** DBT-HIVE-005

**原因:** MERGE 语句需要 ACID 事务表（`transactional=true`）。大多数 Hive 环境使用非 ACID 表。

**违反后果:** 执行失败，Hive 报错 `MERGE requires ACID table`。

**规避方案:** 使用 insert_overwrite 分区回刷替代 merge 策略。

**示例:**

```sql
-- X 错误：非 ACID 表使用 merge
{{
  config(
    materialized='incremental',
    incremental_strategy='merge',  -- 不支持
    unique_key='order_id'
  )
}}

-- O 正确：使用 insert_overwrite
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    file_format='orc'
  )
}}
```

---

## dbt 模型配置最佳实践

### 标准增量模型配置

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    file_format='orc',
    on_schema_change='fail'  -- 列变更时失败，强制手动处理
  )
}}

SELECT
    -- 显式列清单，禁止 SELECT *
    order_id,
    customer_id,
    order_amount,
    order_status,
    updated_at,
    -- 分区列在最后
    dt
FROM {{ source('ods', 'orders') }}
WHERE dt >= date_sub('{{ var("ds") }}', {{ var("lookback_days", 7) }})
  AND dt <= '{{ var("ds") }}'
  AND dt IS NOT NULL
  AND dt RLIKE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
```

### 配置项说明

| 配置项 | 值 | 说明 |
|-------|---|------|
| materialized | incremental | 增量物化 |
| incremental_strategy | insert_overwrite | 唯一可靠策略（非 ACID） |
| partition_by | ['dt'] | 分区列，必须配置 |
| file_format | orc | ORC 格式，Hive 首选 |
| on_schema_change | fail | 列变更时失败，防止静默错误 |

---

## 已知 Quirks 与规避

| Quirk | 影响 | 规避方案 |
|-------|------|---------|
| Kerberos 仅支持 Unix | Windows 无法使用 Kerberos 认证 | Windows 使用 LDAP 认证 |
| 表名大小写敏感 | 不同环境行为可能不一致 | 统一使用小写表名 |
| UNION ALL 分区裁剪失效 | 复杂查询可能全表扫描 | 拆分为多个模型或使用临时表 |
| 时间戳精度 | Hive TIMESTAMP 精度与其他数据库不同 | 统一使用 STRING 存储日期 |

---

## 增量策略选择指南

| 场景 | 推荐策略 | 原因 |
|------|---------|------|
| 日常分区回刷 | insert_overwrite | 幂等、可重跑 |
| 纯追加日志 | append | 数据永不更新时可用 |
| 需要行级更新 | insert_overwrite + 分区去重 | 非 ACID 无法行级更新 |
| SCD Type 2 | 自定义增量模型 | Snapshots 不可用 |

**详细增量策略实现:** [增量策略文档](./incremental-strategies.md)

---

## 检查清单

### 模型配置检查

- [ ] 物化类型不是 snapshot 或 ephemeral
- [ ] incremental 模型使用 insert_overwrite 策略
- [ ] 配置了 partition_by 参数
- [ ] 分区列在 SELECT 末尾
- [ ] 配置了 file_format='orc'
- [ ] 设置了 on_schema_change='fail'

### SQL 编写检查

- [ ] 使用显式列清单，禁止 SELECT *
- [ ] 分区列有 NOT NULL 检查
- [ ] 分区列有格式校验（yyyy-MM-dd）
- [ ] WHERE 包含分区范围条件（lookback 窗口）

---

## 参考文献

- [dbt-hive Official Documentation](https://docs.getdbt.com/reference/resource-configs/hive-configs)
- [dbt-hive GitHub Repository](https://github.com/cloudera/dbt-hive)
- [Cloudera Hive Setup](https://docs.getdbt.com/docs/core/connect-data-platform/hive-setup)

---

*Version: 1.0.0 | Updated: 2026-01-31*

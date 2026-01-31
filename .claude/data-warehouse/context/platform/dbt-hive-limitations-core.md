---
type: context-core
source: context/platform/dbt-hive-limitations.md
version: 1.0.0
updated_at: 2026-01-31
tokens_budget: 600-800
---

# dbt-hive 限制精简版

## P0 限制速查表

| ID | 限制 | 后果 | 替代方案 |
|----|------|------|----------|
| **DBT-HIVE-001** | 不支持 Snapshots | SCD Type 2 无法原生实现 | 自定义增量模型 + 有效期字段 |
| **DBT-HIVE-002** | 不支持 Ephemeral | CTE 内联不可用 | 使用 View 物化替代 |
| **DBT-HIVE-003** | 分区列位置 | 分区列不在末尾报错 | 调整 SELECT 列顺序 |
| **DBT-HIVE-004** | insert_overwrite 必须配 partition_by | 全表数据丢失 | 始终配置 partition_by |
| **DBT-HIVE-005** | 非 ACID 表不支持 merge | 执行失败 | 使用 insert_overwrite |

---

## 替代方案摘要

### 无 Snapshots → insert_overwrite + SCD 有效期字段

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['is_current'],
    file_format='orc'
  )
}}
-- 手动实现: 变更检测 → 关闭旧版本 → 新增版本
```

### 无 Ephemeral → View 替代

```sql
-- X ephemeral 不可用
{{ config(materialized='ephemeral') }}

-- O 改用 view
{{ config(materialized='view') }}
```

### 无 MERGE → insert_overwrite 分区回刷

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',  -- 唯一可靠策略
    partition_by=['dt']
  )
}}
```

---

## 增量模型标准配置

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

SELECT
    order_id,
    customer_id,
    order_amount,
    dt  -- 分区列在末尾
FROM {{ source('ods', 'orders') }}
WHERE dt >= date_sub('{{ var("ds") }}', {{ var("lookback_days", 7) }})
  AND dt <= '{{ var("ds") }}'
  AND dt IS NOT NULL
```

---

## 检查清单

- [ ] 物化类型不是 snapshot 或 ephemeral
- [ ] incremental 是否使用 insert_overwrite 策略
- [ ] 是否配置了 partition_by 参数
- [ ] 分区列是否在 SELECT 末尾
- [ ] 是否配置 file_format='orc'
- [ ] 是否设置 on_schema_change='fail'

---

Source: dbt-hive-limitations.md | Updated: 2026-01-31

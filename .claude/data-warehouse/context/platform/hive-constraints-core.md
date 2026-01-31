---
type: context-core
source: context/platform/hive-constraints.md
version: 1.0.0
updated_at: 2026-01-31
tokens_budget: 800-1000
---

# Hive 约束精简版

## P0 约束速查表

| ID | 约束 | 一句话 | 规避要点 |
|----|------|--------|----------|
| **HIVE-001** | 分区列位置 | 分区列必须在 SELECT 末尾 | 调整列顺序 |
| **HIVE-002** | 分区列非空 | dt 不能 NULL | `WHERE dt IS NOT NULL` |
| **HIVE-003** | 分区列格式 | dt 必须 yyyy-MM-dd | 格式化 + RLIKE 校验 |
| **HIVE-004** | 并发控制 | 禁止并发回刷同一分区 | 调度互斥锁 |
| **HIVE-010** | MERGE 限制 | MERGE 仅支持 ACID 表 | 非 ACID 用 INSERT OVERWRITE |
| **HIVE-011** | UPDATE/DELETE | 仅支持 ACID 表 | 用分区回刷替代 |
| **HIVE-012** | ACID 限制 | ACID 表不支持 INSERT OVERWRITE | 用 TRUNCATE + INSERT |
| **HIVE-014** | SELECT * | 禁止 SELECT * | 显式列清单 |
| **HIVE-015** | 分区内去重 | 业务键必须去重 | ROW_NUMBER + ORDER BY updated_at DESC |
| **HIVE-016** | Schema 变更 | 仅允许追加列 | 禁止改名/改类型/删除 |
| **HIVE-018** | 分区裁剪 | WHERE 必须含分区列 | 避免函数破坏裁剪 |

---

## 分区规则要点

```sql
-- 分区列在 SELECT 末尾
SELECT order_id, user_id, order_amount, dt FROM ...

-- 分区列非空 + 格式校验
WHERE dt IS NOT NULL
  AND dt RLIKE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
```

---

## 存储格式配置

```sql
-- 推荐: ORC + Snappy
STORED AS ORC
TBLPROPERTIES (
    'orc.compress'='SNAPPY',
    'orc.bloom.filter.columns'='order_id,user_id'  -- 可选
);
```

---

## 动态分区配置

```sql
SET hive.exec.dynamic.partition=true;
SET hive.exec.dynamic.partition.mode=nonstrict;
SET hive.exec.max.dynamic.partitions=10000;
SET hive.exec.max.dynamic.partitions.pernode=1000;
```

---

## 分区内去重模板

```sql
SELECT order_id, user_id, order_amount, dt
FROM (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY order_id, dt
            ORDER BY updated_at DESC
        ) AS rn
    FROM ods_orders
    WHERE dt = '2026-01-31'
) t
WHERE rn = 1
```

---

## 检查清单

- [ ] 分区列是否在 SELECT 末尾
- [ ] 分区列是否有 NOT NULL 校验
- [ ] 分区列格式是否为 yyyy-MM-dd
- [ ] WHERE 是否包含分区条件（分区裁剪）
- [ ] 是否使用显式列清单（禁止 SELECT *）
- [ ] 分区内是否按业务键去重

---

Source: hive-constraints.md | Updated: 2026-01-31

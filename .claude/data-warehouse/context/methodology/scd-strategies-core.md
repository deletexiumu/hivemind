---
type: context-core
source: context/methodology/scd-strategies.md
version: 1.0.0
updated_at: 2026-01-31
tokens_budget: 800-1000
---

# SCD 策略精简版

## SCD 选型决策树

```
需要历史追溯?
├── 不需要 → Type 1 覆盖 (无历史, INSERT OVERWRITE)
├── 完整历史 → Type 2 追踪
│   ├── 小维表 (<100万) → 全量重建
│   └── 大维表 (>100万) → Current/History 拆分
└── 只需前值对比 → Type 3 保留前值 (previous_xxx 字段)
```

## Type 1/2/3 对比表

| 类型 | 行为 | 历史保留 | 适用场景 |
|------|------|----------|----------|
| **Type 1** | 直接覆盖 | 无 | 纠错、非关键属性 |
| **Type 2** | 新增版本行 | 完整 | 地址/价格变更追溯 |
| **Type 3** | 前值字段 | 只有前值 | 只需变更前后对比 |

---

## SCD Type 2 字段合同

| 约束 | 规则 |
|------|------|
| **区间语义** | 右开区间 `[effective_start, effective_end)` |
| **当前记录** | `effective_end = '9999-12-31'` |
| **Current 唯一** | 每个自然键最多一条 `is_current = 1` |
| **区间不重叠** | 同一自然键版本区间不交叉 |
| **Tie-breaker** | 同时刻变更用 updated_at 裁决 |

### 标准 SCD2 字段

```sql
effective_start  DATE    -- 生效开始 (含)
effective_end    DATE    -- 生效结束 (不含, 当前=9999-12-31)
is_current       INT     -- 当前标识 (1=当前, 0=历史)
```

---

## 键策略规则

| 表类型 | 键命名 | 说明 |
|--------|--------|------|
| 维度表 | `*_sk` | 代理键，每版本唯一 |
| 事实表 | `*_key` | 外键，指向维度 `*_sk` |

---

## 迟到维处理

1. **Unknown 成员占位**: `customer_sk = -1`
2. **事实加载时**: 缺失维度指向 Unknown
3. **维度到达后**: Type 1 覆盖或 Type 2 新增版本

---

## dbt-hive 实现要点

- **无 Snapshots 支持**: 需手动实现 SCD Type 2
- **策略**: `insert_overwrite` + 有效期字段
- **小维表**: 全量重建（每次 INSERT OVERWRITE 全表）
- **大维表**: 拆分 `dim_x_current` + `dim_x_history` + UNION VIEW

---

## 检查清单

- [ ] SCD 类型是否与业务追溯需求匹配
- [ ] Type 2 是否使用标准字段（effective_start/end + is_current）
- [ ] 区间是否采用右开语义
- [ ] 当前记录 effective_end 是否为 9999-12-31
- [ ] 是否定义 Unknown 成员处理迟到维
- [ ] 是否有 is_current 唯一性 dbt test

---

Source: scd-strategies.md | Updated: 2026-01-31

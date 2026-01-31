---
type: scenario-example
scenario: review-existing-model
example: naming-issues
quality_level: medium
expected_result: 有条件通过
expected_score: 60-69
---

# 案例：命名规范问题模型

展示存在多个命名规范问题的模型评审过程。

## 输入

### SQL 代码

```sql
-- fact_orders.sql
-- 订单事实表

SELECT
    order_id AS OrderID,          -- 问题：camelCase
    customer_id AS CustID,        -- 问题：缩写 + camelCase
    orderAmount AS order_amt,     -- 问题：camelCase 列名
    order_date,
    qty,                          -- 问题：缩写不一致
    dt
FROM {{ ref('ods_orders') }}
WHERE dt = '{{ var("ds") }}'
```

### 元信息

| 项目 | 值 |
|------|-----|
| 分层 | DWD |
| 粒度 | 一个订单（order_id） |

（缺少 schema.yml）

---

## Stage 1 输出

### 评审总览

| 指标 | 值 |
|------|-----|
| **结论** | 有条件通过 |
| **评审范围** | 部分（缺少 schema.yml） |
| **质量分** | 67/100 |
| **P0 问题** | 0 个 |
| **P1 问题** | 3 个 |
| **P2 问题** | 0 个 |
| **P3 问题** | 1 个 |

### 检查清单（聚合视图）

**1. 命名规范检查 (4/8)**
- [x] N01: 表名前缀不符（fact_orders 应为 dwd_fact_orders） - P1
- [x] N05: 字段命名不符规范（OrderID, CustID, orderAmount 使用 camelCase） - P1
- [x] N05: 字段命名不符规范（qty 缩写不一致，应为 quantity） - P1
- [x] N04: 命名缩写不一致（CustID vs customer_id） - P3

**2. 分层引用检查 (3/3)** - 全部通过

**3. 粒度与主键检查** - 未评审（缺少 DDL）

**4. 字段类型与注释检查** - 未评审（缺少 DDL）

**5. dbt 配置检查** - 未评审（缺少 schema.yml）

### 问题摘要

| # | 级别 | 类别 | 问题 | 位置 | 规则 ID |
|---|------|------|------|------|---------|
| 1 | P1 | 命名规范 | 表名前缀不符 | fact_orders | N01 |
| 2 | P1 | 命名规范 | 字段命名不符规范 | OrderID, CustID, orderAmount | N05 |
| 3 | P1 | 命名规范 | 字段命名不符规范 | qty 缩写 | N05 |
| 4 | P3 | 命名规范 | 命名缩写不一致 | CustID vs customer_id | N04 |

---

## Stage 2 输出

### [P1] 表名前缀不符 (S 档)

**位置：** 文件名 fact_orders.sql

**当前：**
```
fact_orders.sql
```

**修复后：**
```
dwd_fact_orders.sql
```

**修复理由：** 按 `naming-core.md`，DWD 层事实表应以 `dwd_fact_` 前缀开头，规则 N01。

---

### [P1] 字段命名不符规范 (M 档)

**位置：** SELECT 字段列表

**变更清单：**

| 当前 | 修复后 | 问题 |
|------|--------|------|
| OrderID | order_id | camelCase -> snake_case |
| CustID | customer_id | 缩写 + camelCase |
| orderAmount | order_amt | camelCase |
| qty | quantity | 缩写不一致 |

**修复后代码：**
```sql
SELECT
    order_id,
    customer_id,
    order_amt,
    order_date,
    quantity,
    dt
FROM {{ ref('ods_orders') }}
```

**修复理由：** 按 `naming-core.md`，字段名应全小写 + 下划线分隔，避免缩写不一致，规则 N05。

---

### [P3] 命名缩写不一致 (S 档)

**位置：** 字段别名

**当前：** CustID（Cust 缩写）与 customer_id（完整）混用

**修复后：** 统一使用完整单词 customer_id

**修复理由：** 按 `naming-core.md`，同一模型中应保持命名风格一致，规则 N04。

---

### 修复优先级建议

1. **必须修复（P0）：** 0 个
2. **优先修复（P1）：** 3 个 - 影响质量分
3. **建议优化（P2/P3）：** 1 个 - 可选改进

---

## 要点

1. **评审范围受限**：缺少 schema.yml 和 DDL，粒度/字段类型/dbt 配置无法评审
2. **主要问题**：命名规范（P1 x3），均可通过批量重命名修复
3. **质量分 67**：低于 70 分阈值，结论为"有条件通过"
4. **建议**：补充 schema.yml 后重新评审以获取完整评审结果

---

Source: review-checklist.md | Updated: 2026-02-01

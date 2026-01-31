---
type: scenario-example
scenario: review-existing-model
example: multiple-issues
quality_level: low
expected_result: 不通过
expected_score: N/A (P0 门禁)
---

# 案例：多问题严重缺陷模型

展示存在多个严重问题（P0 门禁触发）的模型评审过程。

## 输入

### SQL 代码

```sql
-- dws_order_summary.sql
-- 订单汇总表，粒度：每天每客户

SELECT
    customer_id,                          -- 问题：应该是 customer_key
    order_date,
    SUM(amount) AS total_amt,
    COUNT(*) AS order_cnt,
    dt
FROM {{ source('raw', 'raw_orders') }}    -- P0: DWS 直接引用 source
GROUP BY customer_id, order_date, dt
```

### 元信息

| 项目 | 值 |
|------|-----|
| 分层 | DWS |
| 粒度 | 每天每客户 |

### schema.yml

```yaml
version: 2

models:
  - name: dws_order_summary
    # 问题：无 description
    columns:
      - name: customer_id
        # 问题：无 description，无 tests
```

---

## Stage 1 输出

### 评审总览

| 指标 | 值 |
|------|-----|
| **结论** | 不通过 |
| **评审范围** | 完整 |
| **质量分** | 72/100 |
| **P0 问题** | 2 个 |
| **P1 问题** | 2 个 |
| **P2 问题** | 1 个 |
| **P3 问题** | 1 个 |

**必须修复：** 存在 P0 问题，无法通过评审（质量分仅反映 P1-P3 设计质量）

### 检查清单（聚合视图）

**1. 命名规范检查 (8/9)**
- [x] N06: 外键命名不符（customer_id 应为 customer_key） - P1

**2. 分层引用检查 (2/4)**
- [x] L02: DWS 直接引用 source（应引用 DWD） - P0
- [x] L04: 禁止直接引用 ODS/source（除 DWD 外） - P0

**3. 粒度与主键检查 (4/5)**
- [x] G02: 缺少主键/代理键定义 - P1

**4. 字段类型与注释检查 (5/6)**
- [x] F04: 度量可加性未标注 - P2

**5. dbt 配置检查 (4/6)**
- [x] D01: 模型缺少 description - P3
- [x] D02: 主键字段缺少 unique/not_null tests - P3（降级，因无主键定义）

### 问题摘要

| # | 级别 | 类别 | 问题 | 位置 | 规则 ID |
|---|------|------|------|------|---------|
| 1 | **P0** | 分层引用 | DWS 直接引用 source | FROM 子句 | L02 |
| 2 | **P0** | 分层引用 | 禁止直接引用 ODS/source | FROM 子句 | L04 |
| 3 | P1 | 命名规范 | 外键命名不符 | customer_id | N06 |
| 4 | P1 | 粒度主键 | 缺少主键定义 | 模型整体 | G02 |
| 5 | P2 | 字段类型 | 度量可加性未标注 | total_amt, order_cnt | F04 |
| 6 | P3 | dbt 配置 | 模型缺少 description | schema.yml | D01 |

---

## Stage 2 输出

### [P0] DWS 直接引用 source (L 档)

**位置：** FROM 子句

**问题说明：**
DWS（汇总层）直接引用 `source('raw', 'raw_orders')`，违反分层引用规则。DWS 应仅引用 DWD 层表或维度表。

**修复步骤：**
1. 确认 DWD 层是否已有订单明细表（如 `dwd_fact_orders`）
2. 如果没有，先创建 DWD 层表
3. 修改 DWS 表引用 DWD 层表

**当前：**
```sql
FROM {{ source('raw', 'raw_orders') }}
```

**修复后：**
```sql
FROM {{ ref('dwd_fact_orders') }}
```

**修复理由：** 按 `layering-system-core.md`，DWS 仅可引用 DWD/DIM，禁止直接引用 ODS/source。规则 L02, L04。

**验证方法：**
```bash
# 检查 dbt lineage
dbt ls --select +dws_order_summary

# 确认上游仅包含 dwd_* 或 dim_* 表
# 预期输出不应包含 source 或 ods_*
```

---

### [P1] 缺少主键定义 (M 档)

**位置：** 模型整体

**问题说明：**
粒度声明为"每天每客户"，但模型未定义主键/代理键，无法保证数据唯一性。

**修复步骤：**

1. SQL 添加代理键：
```sql
SELECT
    CAST(conv(substr(md5(concat_ws('||', customer_key, order_date, dt)), 1, 15), 16, 10) AS BIGINT) AS order_summary_sk,
    ...
```

2. schema.yml 添加测试：
```yaml
columns:
  - name: order_summary_sk
    description: "订单汇总代理键"
    tests: [unique, not_null]
```

**修复理由：** 按 `fact-table-types-core.md`，汇总表需要代理键唯一标识粒度。规则 G02。

---

### [P1] 外键命名不符 (S 档)

**位置：** customer_id 字段

**当前：**
```sql
customer_id,
```

**修复后：**
```sql
customer_key,
```

**修复理由：** 按 `naming-core.md`，外键应使用 `_key` 后缀，以区分业务键（_id）和代理键（_key）。规则 N06。

---

### [P2] 度量可加性未标注 (S 档)

**位置：** schema.yml columns 定义

**修复后：**
```yaml
- name: total_amt
  description: "订单总金额（可加）"
  meta:
    additivity: additive
- name: order_cnt
  description: "订单数量（可加）"
  meta:
    additivity: additive
```

**修复理由：** 按 `fact-table-types-core.md`，度量字段应标注可加性。规则 F04。

---

### 修复优先级建议

1. **必须修复（P0）：** 2 个 - 阻断上线
2. **优先修复（P1）：** 2 个 - 影响质量分
3. **建议优化（P2/P3）：** 2 个 - 可选改进

---

## 要点

1. **P0 门禁触发**：2 个分层引用 P0 问题导致"不通过"，质量分仅供参考
2. **核心问题**：DWS 直接引用 source（L02, L04），架构设计严重缺陷
3. **修复优先级**：先修复 P0（分层引用），再修复 P1（主键定义、外键命名）
4. **完整评审**：提供了完整输入，五个维度均可评审

---

Source: review-checklist.md | Updated: 2026-02-01

---
type: scenario-support
scenario: review-existing-model
document: fix-suggestions
version: 1.0.0
token_budget: 500
---

# 修复建议格式模板

## 详细度分档规则

按改动范围/风险/不确定性分为 S/M/L/XL 四档。

| 档位 | 适用场景 | 输出格式 |
|------|----------|----------|
| **S** | 单点改动，确定性强 | "当前 vs 修复后" + 可粘贴片段 + 理由 |
| **M** | 同文件多处联动 | 最小变更块 + 同步修改清单 |
| **L** | 逻辑重构/高风险 | 分步骤指引 + 关键代码骨架 + 验证 SQL |
| **XL** | 多文件联动 | 变更概览 + 按 `### File: {path}` 分文件展开 |

---

## S 档示例

单点改动，如命名修正、类型修正。

```markdown
### [P1] 命名规范：表名前缀不符

**位置：** 表定义

**当前：**
```sql
CREATE TABLE fact_orders (...)
```

**修复后：**
```sql
CREATE TABLE dwd_fact_orders (...)
```

**原因：** 按 `naming-core.md`，细节层事实表应以 `dwd_fact_` 前缀开头
```

---

## M 档示例

同文件多处联动修改。

```markdown
### [P1] 命名规范：字段命名不符（2 处）

**位置：** 第 8-9 行

**变更清单：**
| 当前 | 修复后 |
|------|--------|
| orderAmt | order_amt |
| custID | customer_id |

**原因：** 按 `naming-core.md`，字段名应全小写 + 下划线分隔
```

---

## L 档示例

逻辑重构或高风险改动，需分步骤指引。

```markdown
### [P0] 主键与粒度不一致

**位置：** 代理键生成逻辑

**问题说明：**
粒度声明为"一个订单行"，但代理键仅基于 `order_id`，
未包含 `order_item_id`，可能导致主键重复。

**修复步骤：**
1. 确认粒度声明（订单行 = order_id + order_item_id + dt）
2. 修改代理键生成逻辑
3. 验证唯一性

**关键代码骨架：**
```sql
CAST(conv(substr(md5(concat_ws('||', order_id, order_item_id, dt)), 1, 15), 16, 10) AS BIGINT) AS order_detail_sk
```

**验证 SQL：**
```sql
SELECT order_detail_sk, COUNT(*)
FROM dwd_fact_order_detail
GROUP BY 1 HAVING COUNT(*) > 1;
-- 期望：无结果
```
```

---

## XL 档示例

多文件联动修改。

```markdown
### [P0] dbt 配置完全缺失

**变更概览：**
需要创建/修改 2 个文件：
1. `models/dwd/schema.yml` — 添加模型配置
2. `models/dwd/dwd_fact_orders.sql` — 添加 config 块

### File: models/dwd/schema.yml
```yaml
version: 2

models:
  - name: dwd_fact_orders
    description: |
      订单明细事实表
      **粒度：** 一个订单行
    meta:
      owner: data-platform
      layer: dwd
      grain: "订单行"
    columns:
      - name: order_sk
        description: 代理键
        tests: [unique, not_null]
```

### File: models/dwd/dwd_fact_orders.sql
```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    file_format='orc'
  )
}}

-- 原有 SQL 代码
```
```

---

Source: 05-CONTEXT.md, 05-RESEARCH.md | Updated: 2026-02-01

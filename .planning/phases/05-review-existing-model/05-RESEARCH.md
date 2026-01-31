# Phase 5: 评审已有模型 - Research

**Researched:** 2026-01-31
**Domain:** Data Model Code Review / LLM-Assisted Review Prompt Engineering
**Confidence:** HIGH

## Summary

本研究聚焦于"评审已有模型"场景的提示系统实现。该场景的核心是：用户输入模型 SQL/dbt 配置/DDL，系统按五大维度（命名规范、分层引用、粒度主键、字段类型、dbt 配置）执行检查，输出带严重级别（P0-P3）的问题清单和修复建议。

研究发现，此类评审系统的关键在于：
1. **结构化检查清单** — 每个检查维度有明确的规则条目，可追溯到项目方法论文档
2. **分级输出模式** — 两段式交互（Stage 1 概览/分级 → Stage 2 详细修复），控制单次输出长度
3. **前后对比格式** — 修复建议使用"当前 vs 修复后"并排展示，配合理由说明

项目已有完整的方法论和规范文档（Phase 1-4 成果），评审提示应充分引用这些文档中的规则作为检查依据，确保评审标准与设计场景（Phase 4）一致。

**Primary recommendation:** 采用"检查清单驱动"的评审模式，将五大检查维度中的 60+ 条规则映射到项目已有 `*-core.md` 文档，使用两段式交互（概览 → 详细修复），通过加权扣分制输出评审得分，确保问题分级与修复建议的一致性和可操作性。

---

## Standard Stack

### Core Components

| 组件 | 版本/格式 | 用途 | 为何标准 |
|------|----------|------|---------|
| Markdown Prompt | `.md` | 评审场景提示主文件 | 项目统一格式，支持 frontmatter |
| YAML Frontmatter | YAML | 配置 includes、metadata | Claude Skills 标准格式 |
| Checklist Format | `[✓]/[✗]` | 检查结果可视化 | 用户决策（05-CONTEXT.md） |
| Issue Table | Markdown Table | 问题清单展示 | 结构化、可扫描 |
| Side-by-Side Code | Markdown Code Block | 修复建议前后对比 | 用户决策（05-CONTEXT.md） |
| schema.yml | YAML (version: 2) | dbt 配置检查 | dbt 标准格式 |

### Supporting Context References

| 文档 | 用途 | 引用方式 |
|------|------|---------|
| `docs/naming-core.md` | 命名规范检查规则来源 | includes（运行时注入） |
| `context/layers/layering-system-core.md` | 分层引用检查规则来源 | includes（运行时注入） |
| `context/methodology/fact-table-types-core.md` | 粒度/可加性检查规则来源 | includes（运行时注入） |
| `context/methodology/scd-strategies-core.md` | SCD 策略检查规则来源 | includes（运行时注入） |
| `context/platform/hive-constraints-core.md` | Hive 约束检查规则来源 | includes（运行时注入） |
| `context/platform/dbt-hive-limitations-core.md` | dbt-hive 限制检查规则来源 | includes（运行时注入） |

### Token Budget Consideration

根据 `docs/token-budget.md`：
- 单文件上限：2,000 tokens
- 标准场景组装：8,000 tokens

**策略：**
- 主提示文件控制在 1,200-1,500 tokens
- 问题分级文档单独文件（约 400-500 tokens）
- 检查清单文档单独文件（约 800-1,000 tokens）
- 修复建议模板单独文件（约 400-500 tokens）
- 输出模板单独文件（约 500-600 tokens）
- 运行时仅注入 `*-core` 精简版上下文

---

## Architecture Patterns

### Recommended Prompt Structure

```
prompts/scenarios/review-existing-model/
├── prompt.md                    # 主提示文件（~1,200 tokens）
├── issue-classification.md      # 问题分级与评分（~500 tokens）
├── review-checklist.md          # 五大检查维度清单（~1,000 tokens）
├── fix-suggestions.md           # 修复建议格式模板（~500 tokens）
└── output-template.md           # 输出格式模板（~600 tokens）
```

### Pattern 1: 检查清单驱动评审 (Checklist-Driven Review)

**What:** 将评审逻辑组织为结构化检查清单，每个检查项可追溯到规范文档
**When to use:** 需要一致性、可审计的评审场景

**Example:**
```markdown
## 命名规范检查

### 表名检查
- [ ] 表名是否使用分层前缀（ods_/dwd_/dws_/ads_/dim_）
- [ ] 表名是否全小写 + 下划线分隔
- [ ] 表名是否符合模式 `{layer}_{type?}_{domain}_{entity}`
- [ ] 表名是否避免 SQL 保留字

### 字段名检查
- [ ] 字段名是否全小写 + 下划线分隔
- [ ] 主键/外键是否使用 `_id`/`_sk`/`_key` 后缀
- [ ] 日期/时间是否使用 `_date`/`_time` 后缀
- [ ] 金额/数量是否使用 `_amt`/`_cnt` 后缀
- [ ] 标志字段是否使用 `is_`/`has_` 前缀

> 规则来源: docs/naming-core.md
```

**Source:** 项目已有规范 + [dbt Best Practices](https://docs.getdbt.com/best-practices)

### Pattern 2: 两段式交互 (Two-Stage Output)

**What:** Stage 1 输出问题概览和分级，用户确认后 Stage 2 输出详细修复建议
**When to use:** 控制输出长度，让用户先确认问题范围再看详细修复
**Why:** 符合用户决策（05-CONTEXT.md），且与 Phase 4 设计场景交互模式一致

**Example:**
```markdown
### Stage 1（默认）：问题概览

输出包含：
1. **评审总览** — 结论（通过/有条件通过/不通过）、评审范围（完整/部分）、质量分、P0 问题数、各级别问题数量
2. **检查清单（聚合视图）** — 按维度展示通过率（如 5/7），默认仅展开 ✗
   - 不可评审项标记为 `— 未评审`（不计分）
3. **问题摘要表** — 按优先级排序的问题清单
4. **待确认** — 是否需要查看详细修复建议

### Stage 2（用户确认后）：详细修复建议

触发条件：用户回复"查看修复建议"/"详细"/"继续"

Stage 2 输出包含每个问题的详细修复建议（前后对比 + 理由说明）
```

**Source:** [Prompt Chaining | Prompt Engineering Guide](https://www.promptingguide.ai/techniques/prompt_chaining)

### Pattern 3: 门禁 + 质量分 (P0 Gate + Quality Score)

**What:** P0 作为门禁（pass/fail）；质量分仅反映 P1-P3 的设计质量
**When to use:** 让结论更清晰（P0 阻断上线/合并），同时提供可比较的质量指标（quality_score）

**Example:**
```markdown
### 评分与结论（用户决策）

#### 门禁（Pass/Fail）
- P0 问题数 > 0 → 结论 = 不通过

#### 质量分（quality_score）
- 初始 100 分，仅按 P1-P3 扣分，最低 0 分
  - P1: -10
  - P2: -3
  - P3: -1
- `— 未评审` 项不计分

#### 结论（三态）
- 不通过：P0 > 0
- 通过：P0 = 0 且 quality_score >= 70
- 有条件通过：P0 = 0 且 quality_score < 70
```

**Source:** 用户决策（05-CONTEXT.md）

### Pattern 4: 前后对比修复建议 (Side-by-Side Fix)

**What:** 修复建议使用并排展示格式，分别显示"当前"和"修复后"
**When to use:** 所有需要代码修改的问题

**Example:**
```markdown
### [P1] 命名规范：表名前缀不符

**位置：** `fact_orders` 表定义

**当前：**
```sql
CREATE TABLE fact_orders (
    ...
);
```

**修复后：**
```sql
CREATE TABLE dwd_fact_orders (
    ...
);
```

**原因：** 按命名规范（`naming-core.md`），细节层事实表应以 `dwd_fact_` 前缀开头，表示该表位于 DWD（Data Warehouse Detail）层。
```

**Source:** 用户决策（05-CONTEXT.md）

### Pattern 5: 修复建议详细度分档 (S/M/L/XL)

**What:** 按改动范围/风险/不确定性，将修复建议分为 S/M/L/XL 四档，提升输出一致性
**When to use:** 所有 Stage 2 修复建议；Stage 1 自动合并时可仅输出 S/M 档的精简版

**Definition:**
- **S（单点改动）**：单点、确定性强 → 输出“当前 vs 修复后”可粘贴片段 + 理由
- **M（同文件多处联动）**：同一文件多处同步 → 输出最小变更块 + 同步修改清单
- **L（逻辑重构/高风险）**：主键/粒度/JOIN 结构变更 → 输出分步骤指引 + 关键代码骨架 + 验证 SQL
- **XL（多文件联动）**：SQL + schema.yml/tests/macros 联动 → 先给变更概览，再按 `### File: {path}` 分文件展开（避免整文件输出）

### Anti-Patterns to Avoid

- **过度评审 (Over-Review):** 对每个细微问题都报告，产生大量 P3 噪音
- **无来源规则 (Untraced Rules):** 检查项未追溯到项目规范文档
- **模糊修复建议 (Vague Fix):** 只说"需要改"但不给具体代码
- **格式不一致 (Inconsistent Format):** Stage 1/2 输出结构不稳定
- **忽略上下文 (Context Blind):** 不考虑用户提供的元信息（分层/粒度声明）

---

## Don't Hand-Roll

| 问题 | 不要手写 | 使用替代 | 原因 |
|------|---------|---------|------|
| 命名规范检查规则 | 在提示中重新定义 | 引用 `naming-core.md` | 保持与设计场景一致 |
| 分层引用规则 | 硬编码禁止清单 | 引用 `layering-system-core.md` | 规则已完整定义 |
| 粒度/可加性检查 | 自行定义概念 | 引用 `fact-table-types-core.md` | 确保术语一致 |
| SCD 策略验证 | 重新发明标准 | 引用 `scd-strategies-core.md` | 包含 dbt-hive 实现要点 |
| Hive 约束检查 | 记忆约束清单 | 引用 `hive-constraints-core.md` | P0 约束完整列出 |
| dbt 配置检查 | 临时约定 | 引用 `dbt-hive-limitations-core.md` | 平台限制明确 |

**Key insight:** 评审场景的规则来源是项目 Phase 1-3 建立的规范文档，提示系统的职责是"执行检查和格式化输出"，而非"重新定义规范"。这确保了评审标准与设计场景（Phase 4）完全一致。

---

## Interaction Design: 两段式交互

### 输入要求

**必填最小集（已更新）：**
| 字段 | 说明 | 缺失处理 |
|------|------|----------|
| **SQL 代码** | 待评审的模型 SQL | 无法继续，必须提供 |
| **元信息** | 分层声明、粒度声明 | 先做部分评审 + 主动追问；相关检查项标记 `— 未评审`（不计分），总览展示“评审范围：部分（缺少元信息）” |

**可选增强：**
| 字段 | 说明 | 影响 |
|------|------|------|
| dbt 配置 (schema.yml) | dbt tests/meta/description | 缺失时仍做 dbt 部分检查，其余标记 `— 未评审`；总览展示“评审范围：部分（缺少 schema.yml）” |
| DDL | CREATE TABLE 语句 | 可进行字段类型/注释/存储格式检查；缺失时相关项标记 `— 未评审` |

### 智能范围评审

根据输入内容自动确定可评审的维度（用户决策）：

| 输入 | 可评审维度 |
|------|-----------|
| 仅 SQL | 命名、分层引用（从 ref/source 推断）、dbt 部分检查（ref/source/config/硬编码引用） |
| SQL + 元信息 | 命名、分层引用、粒度主键 |
| SQL + 元信息 + schema.yml | 命名、分层引用、粒度主键、dbt 配置（字段类型需 DDL） |
| SQL + 元信息 + schema.yml + DDL | 全部五个维度 |

> 注：字段类型/注释检查优先依赖 DDL；若未提供 DDL，则相关检查项应标记为 `— 未评审`（不计分）。

### 信息缺失追问

当缺失必要信息时，主动追问：

```markdown
### 评审前需要补充信息

当前评审将按**部分范围**先输出结果。为了提升到**完整评审范围**，请补充以下信息：

1. **分层声明** — 该表位于哪一层？（ODS/DWD/DWS/ADS）
2. **粒度声明** — 一行代表什么？（如"一个订单行"）

补充后我会重新评审相关维度，并更新“评审范围”与问题清单。
```

---

## Issue Classification（问题分级）

### 分级标准（用户决策）

| 级别 | 名称 | 定义 | 典型问题 |
|------|------|------|----------|
| **P0** | 严重 | 数据质量问题 | 粒度不清晰/主键重复/禁止跨层引用 |
| **P1** | 高优 | 设计缺陷 | 命名不符/SCD 策略不合理/字段类型错误 |
| **P2** | 中优 | 风险提示 | 度量可加性未标记/分区键可优化 |
| **P3** | 低优 | 代码风格 | 命名过长/注释可完善 |

### 各级别具体问题映射

**P0 严重问题：**
- 粒度声明缺失或不清晰
- 主键与粒度不一致
- 隐藏扇形（JOIN 导致粒度变化）
- 禁止的跨层引用（如 DWS 引用 ODS）
- dbt 配置完全缺失（无 description、无 tests）

**P1 高优问题：**
- 表名前缀不符合分层规范
- 字段命名不符合规范
- SCD 策略与业务需求不匹配
- 字段类型不合理（如日期用 STRING）
- 事实表缺少标准字段（is_deleted/etl_date）
- 维度表 SCD2 缺少有效期字段

**P2 中优问题：**
- 度量字段未标注可加性（meta.additivity）
- 分区键选择可优化
- 关键字段缺少 dbt tests
- 可能需要脱敏的字段未标记

**P3 低优问题：**
- 命名过长或缩写不一致
- 注释表述可更清晰
- 代码格式可优化
- 非关键字段缺少 description

---

## Common Pitfalls

### Pitfall 1: 过度评审产生噪音

**What goes wrong:** 报告大量 P3 级别问题，用户难以聚焦关键问题
**Why it happens:** 检查过于细致，未按重要性过滤
**How to avoid:**
- Stage 1 概览中仅列出问题数量，不展开所有细节
- 高亮展示所有 P0 问题作为"必须修复项"
- P3 问题仅在用户明确要求时展开
**Warning signs:** 用户反馈"问题太多看不完"

### Pitfall 2: 检查规则与设计场景不一致

**What goes wrong:** 评审发现的问题在设计场景中本是"正确"的做法
**Why it happens:** 评审规则未引用相同的规范文档
**How to avoid:**
- 所有检查规则必须追溯到 `*-core.md` 文档
- 评审提示使用与设计提示相同的 `includes`
**Warning signs:** 用户说"但设计时 Claude 就是这么建议的"

### Pitfall 3: 修复建议不可操作

**What goes wrong:** 修复建议过于抽象，用户不知道具体改什么
**Why it happens:** 未提供具体代码或改动位置
**How to avoid:**
- 每个问题必须指明位置（表名/字段名/行号）
- 简单问题给完整修复代码
- 复杂问题给分步骤修复指引
**Warning signs:** 用户追问"具体怎么改"

### Pitfall 4: 输入信息不足时强行评审

**What goes wrong:** 缺少粒度声明时仍给出主键检查结论
**Why it happens:** 未遵循"智能范围"策略
**How to avoid:**
- 明确哪些检查依赖哪些输入
- 缺失必要信息时主动追问
- 在评审结果中标注"因信息不足跳过"的检查项
**Warning signs:** 评审结论基于错误假设

### Pitfall 5: Stage 1/2 输出格式不稳定

**What goes wrong:** 有时输出 Markdown 表格，有时输出纯文本
**Why it happens:** 缺少明确的输出模板
**How to avoid:**
- 提供详细的 `output-template.md`
- 在 Stage 1 结束处明确提示"回复 X 进入 Stage 2"
**Warning signs:** 用户说"上次格式不是这样的"

---

## Code Examples

### Example 1: Stage 1 问题概览输出

```markdown
# 模型评审报告

## 评审总览

| 指标 | 值 |
|------|-----|
| **结论** | 不通过 |
| **评审范围** | 完整 |
| **质量分** | 72/100 |
| **P0 问题** | 1 个 |
| **P1 问题** | 2 个 |
| **P2 问题** | 2 个 |
| **P3 问题** | 2 个 |

**必须修复：** 存在 P0 问题，无法通过评审（质量分仅反映 P1-P3 设计质量）

---

## 检查清单（聚合视图）

> 默认仅展开 ✗；回复“完整清单”查看全部 ✓/✗。缺少输入导致不可评审项会标记为 `— 未评审`（不计分）。

### 1. 命名规范检查 (5/7)
- [✗] 字段命名不符合规范（2 处） ⚠️ P1
- [✗] 命名缩写不一致（`qty` vs `quantity`） ⚠️ P3

### 2. 分层引用检查 (3/3) — 全部通过

### 3. 粒度与主键检查 (2/4)
- [✗] 主键与粒度不一致 ⚠️ P0
- [✗] 存在隐藏扇形风险（JOIN 可能改变粒度） ⚠️ P2

### 4. 字段类型与注释检查 (4/6)
- [✗] 金额字段未使用 DECIMAL ⚠️ P1
- [✗] 度量可加性未标注 ⚠️ P2

### 5. dbt 配置检查 (4/5)
- [✗] 外键 relationship test 缺失 ⚠️ P3

---

## 问题摘要

| # | 级别 | 类别 | 问题 | 位置 |
|---|------|------|------|------|
| 1 | **P0** | 粒度主键 | 主键与粒度不一致 | `order_sk` 定义 |
| 2 | P1 | 命名规范 | 字段命名不符规范 | `orderAmt`, `custID` |
| 3 | P1 | 字段类型 | 金额字段未使用 DECIMAL | `order_amt` |
| 4 | P2 | 粒度主键 | 存在隐藏扇形风险 | JOIN `dim_product` |
| 5 | P2 | 可加性 | 度量可加性未标注 | `quantity`, `amount` |
| 6 | P3 | 命名规范 | 命名缩写不一致 | `qty` vs `quantity` |
| 7 | P3 | dbt 配置 | 外键 relationship test 缺失 | `customer_key` |

---

## 重点推荐

以下 P0 问题**必须修复**才能通过评审：

### [P0] 主键与粒度不一致

粒度声明为"一个订单行"，但 `order_sk` 的生成逻辑仅基于 `order_id`，
可能导致同一订单的多个订单行产生相同主键。

---

回复"**查看修复建议**"获取每个问题的详细修复方案。
```

### Example 2: Stage 2 修复建议输出

```markdown
# 详细修复建议

## [P0] 主键与粒度不一致

**位置：** `dwd_fact_order_detail.sql` 第 15 行

**问题说明：**
粒度声明为"一个订单行"，但代理键 `order_sk` 的生成仅基于 `order_id`，
未包含订单行标识 `order_item_id`，可能导致同一订单的多个订单行产生相同主键。

**当前：**
```sql
CAST(conv(substr(md5(order_id), 1, 15), 16, 10) AS BIGINT) AS order_sk
```

**修复后：**
```sql
CAST(conv(substr(md5(concat_ws('||', order_id, order_item_id, dt)), 1, 15), 16, 10) AS BIGINT) AS order_detail_sk
```

**修复理由：**
- 代理键应唯一标识每个订单行，需包含 `order_id` + `order_item_id` + `dt`
- 按命名规范，粒度为"订单行"时，代理键应命名为 `order_detail_sk`
- 使用 `concat_ws` 确保字段间有分隔符，避免 hash 冲突

**验证方法：**
```sql
-- 检查主键唯一性
SELECT order_detail_sk, COUNT(*)
FROM dwd_fact_order_detail
GROUP BY order_detail_sk
HAVING COUNT(*) > 1;
-- 期望结果：无数据
```

---

## [P1] 字段命名不符规范

**位置：** `dwd_fact_order_detail.sql` 第 8-9 行

**问题说明：**
字段 `orderAmt` 和 `custID` 使用了 camelCase 命名，不符合项目命名规范（全小写 + 下划线分隔）。

**当前：**
```sql
orderAmt        DECIMAL(18,2)   COMMENT '订单金额',
custID          BIGINT          COMMENT '客户ID',
```

**修复后：**
```sql
order_amt       DECIMAL(18,2)   COMMENT '订单金额',
customer_id     BIGINT          COMMENT '客户ID',
```

**修复理由：**
- 按 `naming-core.md` 规范，字段名应全小写 + 下划线分隔
- 外键字段应使用完整单词（`customer_id` 而非 `cust_id`），或与维度表保持一致

---

## [P1] 金额字段未使用 DECIMAL

**位置：** DDL 第 12 行

**问题说明：**
`order_amt` 字段使用 `DOUBLE` 类型，可能导致浮点精度问题。

**当前：**
```sql
order_amt       DOUBLE          COMMENT '订单金额',
```

**修复后：**
```sql
order_amt       DECIMAL(18,2)   COMMENT '订单金额（可加）',
```

**修复理由：**
- 金额字段应使用 `DECIMAL(18,2)` 避免浮点精度误差
- 按 `fact-table-types-core.md`，金额是可加度量，应在注释中标注

---

（以下 P2/P3 问题修复建议略，格式相同）
```

### Example 3: 检查清单模块结构

```markdown
# 评审检查清单

## 1. 命名规范检查

> 规则来源: `docs/naming-core.md`

### 表名检查
| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| N01 | 分层前缀 | P1 | 表名必须以 ods_/dwd_/dws_/ads_/dim_ 开头 |
| N02 | 表名格式 | P1 | 全小写 + 下划线分隔 |
| N03 | 保留字 | P1 | 避免使用 SQL 保留字 |
| N04 | 完整模式 | P3 | 符合 `{layer}_{type?}_{domain}_{entity}` |

### 字段名检查
| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| N05 | 字段格式 | P1 | 全小写 + 下划线分隔 |
| N06 | 键后缀 | P1 | 主键 `_id`/`_sk`，外键 `_key` |
| N07 | 日期后缀 | P1 | 日期 `_date`，时间 `_time` |
| N08 | 金额后缀 | P2 | 金额 `_amt`/`_amount` |
| N09 | 数量后缀 | P2 | 数量 `_cnt`/`_count` |
| N10 | 标志前缀 | P2 | 标志 `is_`/`has_` |

---

## 2. 分层引用检查

> 规则来源: `context/layers/layering-system-core.md`

| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| L01 | DWD 引用 | P0 | DWD 仅可引用 ODS |
| L02 | DWS 引用 | P0 | DWS 仅可引用 DWD/DIM |
| L03 | ADS 引用 | P0 | ADS 仅可引用 DWS/DIM/DWD(特例) |
| L04 | 禁止引用 | P0 | 任何层禁止直接引用 ODS（除 DWD 外） |
| L05 | 维度引用 | P2 | DIM 表可被 DWD/DWS/ADS 共同引用 |

---

## 3. 粒度与主键检查

> 规则来源: `context/methodology/fact-table-types-core.md`

| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| G01 | 粒度声明 | P0 | 必须有明确粒度声明 |
| G02 | 主键一致 | P0 | 主键必须唯一标识粒度 |
| G03 | 隐藏扇形 | P0 | JOIN 不得改变粒度（fan-out） |
| G04 | 唯一性 | P1 | 业务键 + 分区键组合唯一 |
| G05 | 去重逻辑 | P1 | 分区内按业务键去重 |

---

## 4. 字段类型与注释检查

> 规则来源: `context/methodology/fact-table-types-core.md`, `docs/naming-core.md`

| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| F01 | 日期类型 | P1 | 日期用 DATE，时间用 TIMESTAMP |
| F02 | 金额类型 | P1 | 金额用 DECIMAL(18,2) |
| F03 | 字段注释 | P2 | 所有字段必须有中文注释 |
| F04 | 可加性 | P2 | 度量字段必须标注可加性 |
| F05 | 标准字段 | P1 | 事实表必须包含标准字段 |
| F06 | SCD 字段 | P1 | 维度表 Type 2 必须包含有效期字段 |

---

## 5. dbt 配置检查

> 规则来源: `context/platform/dbt-hive-limitations-core.md`

| ID | 检查项 | 级别 | 规则 |
|----|--------|------|------|
| D01 | description | P0 | 模型必须有 description |
| D02 | 主键 test | P0 | 主键必须有 unique + not_null |
| D03 | meta 标签 | P2 | 应有 owner/layer/grain |
| D04 | 可加性标注 | P2 | 度量应有 meta.additivity |
| D05 | 外键 test | P2 | 外键应有 relationships test |
| D06 | 增量配置 | P1 | insert_overwrite + partition_by |
| D07 | schema_change | P2 | on_schema_change='fail' |
```

---

## State of the Art

| 旧方法 | 当前方法 | 何时改变 | 影响 |
|--------|---------|---------|------|
| 人工逐项检查 | LLM 辅助自动化评审 | 2024-2025 | 评审效率提升 80%+ |
| 纯文本反馈 | 结构化问题清单 + 评分 | 2025 | 可量化、可比较 |
| 单次输出所有内容 | 两段式交互（概览 → 详细） | 2025 | 控制输出长度，聚焦关键 |
| 孤立的代码审查 | 规范文档驱动的一致性检查 | 2025-2026 | 设计与评审标准统一 |
| 手动 SQL lint | SQLFluff + dbt-checkpoint 集成 | 2024-2025 | CI/CD 自动化 |

**Deprecated/outdated:**
- **纯人工评审:** 效率低，一致性差
- **仅靠 SQLFluff:** 无法检查业务语义（粒度、可加性、分层引用）

---

## Decision Summary (Updated)

- **评分机制**：P0 从数值评分剥离（门禁）；`quality_score` 从 100 开始，仅按 P1(-10)/P2(-3)/P3(-1) 扣分，最低 0 分
- **结论（三态）**：不通过（P0>0）/通过（P0=0 且 quality_score>=70）/有条件通过（P0=0 且 quality_score<70）
- **检查清单展示**：内部保持细粒度规则；对外按维度聚合展示，默认仅展开 ✗，用户可请求完整清单（含 ✓）
- **两段式交互**：默认 Stage 1→Stage 2；当问题少（≤2 且无 P0）自动合并输出精简修复建议
- **智能范围评审**：缺少输入时做部分检查；不可评审项标记 `— 未评审` 且不计分；总览增加“评审范围”（完整/部分）
- **修复建议分档**：S/M 用“当前 vs 修复后”；L/XL 用“变更概览 + 分步骤 + 关键代码骨架 + 验证 SQL”，多文件按 `### File: {path}` 组织

---

## Sources

### Primary (HIGH confidence)

- **项目内部文档（已读取验证）：**
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/docs/naming-core.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/layers/layering-system-core.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/methodology/fact-table-types-core.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/methodology/scd-strategies-core.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/platform/hive-constraints-core.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/platform/dbt-hive-limitations-core.md`
  - `/Users/cookie/PycharmProjects/hivemind/.planning/phases/05-review-existing-model/05-CONTEXT.md`
  - `/Users/cookie/PycharmProjects/hivemind/.planning/phases/04-design-new-model/04-RESEARCH.md`

- **Phase 4 已验证模式：**
  - 两段式交互模式
  - `includes` 声明 + `*-core.md` 注入
  - `### File: {path}` 输出契约

### Secondary (MEDIUM confidence)

- [dbt Best Practices](https://docs.getdbt.com/best-practices) — dbt 官方最佳实践
- [SQLFluff Rules Reference](https://docs.sqlfluff.com/en/stable/reference/rules.html) — SQL lint 规则分类
- [Prompt Chaining | Prompt Engineering Guide](https://www.promptingguide.ai/techniques/prompt_chaining) — 两段式输出模式
- [Effective prompt engineering for AI code reviews](https://graphite.com/guides/effective-prompt-engineering-ai-code-reviews) — AI 代码评审提示工程
- [dbt-checkpoint as Documentation-Driven DQ Engine](https://medium.com/@sendoamoronta/dbt-checkpoint-as-a-documentation-driven-data-quality-engine-in-dbt-b64faaced5dd) — 文档驱动的数据质量检查

### Tertiary (LOW confidence)

- [Simple Claude Code Review Prompt](https://www.josecasanova.com/blog/claude-code-review-prompt) — Claude 代码评审提示示例
- [AI Prompts for Code Review](https://5ly.co/blog/ai-prompts-for-code-review/) — AI 代码评审提示模板

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 基于项目已有文档和 Phase 4 验证的模式
- Architecture patterns: HIGH - 基于用户决策（05-CONTEXT.md）和 Phase 4 一致性
- Issue classification: HIGH - 用户决策明确定义分级标准
- Checklist rules: HIGH - 完全基于项目已有 `*-core.md` 规范文档
- Pitfalls: MEDIUM - 基于代码评审最佳实践 + 项目特定约束

**Research date:** 2026-01-31
**Valid until:** 60 days（评审规则与项目规范同步更新）

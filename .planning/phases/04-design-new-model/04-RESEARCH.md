# Phase 4: 场景 2 实现（设计新模型） - Research

**Researched:** 2026-01-31
**Domain:** Prompt Engineering for Dimensional Modeling / dbt Template Generation
**Confidence:** HIGH

## Summary

本研究聚焦于"设计新模型"场景的提示系统实现。该场景的核心是：用户输入业务事件/指标/粒度，系统输出完整的星型模型设计（事实表、维度表、DDL、schema.yml、dbt 模板代码）。

研究发现，此类提示系统的关键在于：
1. **结构化输入解析** — 混合模式（模板 + 自由文本）需要 Claude 的智能解析能力
2. **决策指导逻辑** — 事实表类型推荐、SCD 策略推荐、分层落点建议需要基于项目已有方法论
3. **多格式输出生成** — Mermaid ER 图、ASCII 图、Hive DDL、schema.yml、dbt SQL 模板

项目已有丰富的方法论文档（Phase 2-3 成果），提示系统应充分引用这些文档作为知识库，而非重复定义概念。

**Primary recommendation:** 采用"4-block 结构化提示"模式（INSTRUCTIONS / CONTEXT / TASK / OUTPUT FORMAT），通过 `includes` 机制引用已有方法论文档，确保输出与项目规范一致。

---

## Standard Stack

### Core Components

| 组件 | 版本/格式 | 用途 | 为何标准 |
|------|----------|------|---------|
| Markdown Prompt | `.md` | 场景提示主文件 | 项目统一格式，支持 frontmatter |
| YAML Frontmatter | YAML | 配置 includes、metadata | Claude Skills 标准格式 |
| Mermaid | erDiagram | 星型模型可视化 | 广泛支持，可渲染为图像 |
| ASCII Diagram | 纯文本 | 兼容无渲染环境 | 终端/Markdown 预览 |
| Hive DDL | HiveQL | CREATE TABLE 语句 | 目标平台（Hive 3.x） |
| dbt schema.yml | YAML 2.0 | 模型文档、测试、meta | dbt 标准格式 |
| dbt SQL Model | Jinja + SQL | 可执行 dbt 模型 | dbt-hive 兼容 |

### Supporting Libraries (Context References)

| 文档 | 用途 | 引用方式 |
|------|------|---------|
| `context/methodology/dimensional-modeling.md` | Kimball 四步法、星型模型定义 | includes |
| `context/methodology/fact-table-types.md` | 事实表类型选择指南 | includes |
| `context/methodology/scd-strategies.md` | SCD 策略选择 | includes |
| `context/layers/layering-system.md` | 分层落点决策 | includes |
| `context/platform/hive-constraints.md` | Hive DDL 约束 | includes |
| `context/platform/dbt-hive-limitations.md` | dbt 模型配置 | includes |
| `context/platform/incremental-strategies.md` | 增量策略模板 | includes |
| `docs/naming.md` | 命名规范 | includes |
| `glossary/terms.md` | 术语一致性 | includes |

### Token Budget Consideration

根据 `docs/token-budget.md`：
- 单文件上限：2,000 tokens
- 标准场景组装：8,000 tokens
- 复杂分析组装：15,000 tokens

**策略：**
- 主提示文件控制在 1,500 tokens 以内
- 输出模板单独文件（约 500-800 tokens）
- 案例内嵌一个简单例子（约 300-400 tokens）
- 复杂案例放 `examples/` 目录按需引用

---

## Architecture Patterns

### Recommended Prompt Structure

```
prompts/scenarios/design-new-model/
├── prompt.md                    # 主提示文件（~1,500 tokens）
├── output-template.md           # 输出格式模板（~800 tokens）
└── examples/                    # 案例库（按需引用）
    ├── e-commerce-order.md      # 电商订单案例
    ├── user-behavior-pv.md      # 用户行为案例
    └── finance-revenue.md       # 财务收入案例
```

### Pattern 1: 4-Block Structured Prompt

**What:** 将提示分为 INSTRUCTIONS / CONTEXT / TASK / OUTPUT FORMAT 四个块
**When to use:** 复杂任务需要清晰分离不同类型的指令

**Example:**
```markdown
---
includes:
  - context/methodology/dimensional-modeling
  - context/methodology/fact-table-types
  - context/methodology/scd-strategies
  - context/layers/layering-system
  - context/platform/hive-constraints
  - docs/naming
---

## INSTRUCTIONS

你是一名资深数据仓库架构师，专注于 Kimball 维度建模方法论。
你的任务是根据用户输入的业务事件/指标/粒度，设计完整的星型模型。

### 决策指导原则
1. **事实表类型推荐** — 根据业务特征自动推荐，解释原因
2. **SCD 策略推荐** — 根据维度属性特征推荐，不逐个询问
3. **分层落点建议** — 列出选项和各自利弊，给出推荐

## CONTEXT

{includes 引入的方法论文档}

## TASK

{用户输入的业务描述}

## OUTPUT FORMAT

{输出模板引用}
```

**Source:** [Claude Prompt Engineering Best Practices](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026)

### Pattern 2: Mixed Input Parsing

**What:** 支持 YAML 模板和自由文本混合输入
**When to use:** 用户可能用结构化或非结构化方式描述需求

**Example:**
```markdown
### 输入格式说明

你可以接受以下两种输入格式：

**格式 A：YAML 模板**
```yaml
business_event: 订单支付
grain: 一笔支付对应一行记录
measures:
  - name: payment_amount
    desc: 支付金额
dimensions:
  - 时间
  - 客户
  - 支付方式
```

**格式 B：自由文本描述**
```
我们需要分析订单支付行为，每笔支付是一条记录，
需要统计支付金额，从时间、客户、支付方式等维度分析。
```

**解析策略：**
- 结构化输入：直接使用
- 自由文本：提取业务事件、粒度、度量、维度
- 缺失信息：主动追问或智能推断后确认
```

### Pattern 3: Decision Tree Output

**What:** 使用决策树格式解释推荐理由
**When to use:** 事实表类型、SCD 策略、分层落点等决策

**Example:**
```markdown
### 事实表类型推荐

**推荐：事务事实表 (Transaction Fact Table)**

**决策依据：**
```
Q: 是否记录单个业务事件？
A: 是 → 每笔支付是独立事件

Q: 是否需要跟踪流程生命周期？
A: 否 → 支付是瞬时事件，无多阶段

Q: 是否需要定期快照状态？
A: 否 → 无需记录每日余额类状态

结论 → 事务事实表
```

**其他选项对比：**
| 类型 | 适用性 | 原因 |
|------|--------|------|
| 周期快照 | 不适用 | 支付非状态量，无需定期快照 |
| 累积快照 | 不适用 | 支付无多阶段流程 |
```

### Anti-Patterns to Avoid

- **Mega-Prompt:** 将所有方法论内容堆砌在一个提示中，超出 token 限制
- **重复定义:** 在提示中重新定义已有文档中的概念
- **硬编码规则:** 将决策逻辑硬编码，而非引用方法论文档
- **无示例:** 缺少具体案例导致输出格式不稳定
- **过度追问:** 每个细节都追问用户，影响效率

---

## Don't Hand-Roll

| 问题 | 不要手写 | 使用替代 | 原因 |
|------|---------|---------|------|
| Kimball 概念定义 | 在提示中重新定义 | 引用 `dimensional-modeling.md` | 保持一致性，避免冲突 |
| 事实表类型判断逻辑 | 硬编码决策树 | 引用 `fact-table-types.md` 决策树 | 逻辑已完整定义 |
| SCD 策略选择 | 自行设计策略 | 引用 `scd-strategies.md` | 包含 dbt-hive 实现 |
| 分层落点规则 | 重新定义层级 | 引用 `layering-system.md` | 避免层级定义冲突 |
| DDL 格式约束 | 记忆 Hive 语法 | 引用 `hive-constraints.md` | 平台约束完整列出 |
| dbt 配置模板 | 从零写配置 | 引用 `incremental-strategies.md` | 包含验证过的模板 |
| 命名规范 | 临时约定 | 引用 `naming.md` | 确保全局一致 |

**Key insight:** 项目 Phase 2-3 已建立完整的方法论和平台约束文档，提示系统的职责是"组装和引导"，而非"重新定义"。通过 `includes` 机制引用已有文档，确保知识一致性。

---

## Common Pitfalls

### Pitfall 1: 输出格式不稳定

**What goes wrong:** 同样的输入，输出结构可能不一致（有时有 Mermaid 图，有时没有）
**Why it happens:** 缺少明确的输出模板，Claude 自由发挥
**How to avoid:**
- 提供详细的 `output-template.md`
- 在提示中明确列出"必须包含的输出部分"
- 内嵌一个简单案例作为格式参考
**Warning signs:** 用户反馈"有时有图有时没有"

### Pitfall 2: 度量可加性标注遗漏

**What goes wrong:** 生成的 schema.yml 未标注度量的可加性类型
**Why it happens:** 可加性是 Kimball 方法论的重要概念，但容易被忽略
**How to avoid:**
- 在输出模板中强制要求 `meta.additivity` 字段
- 在检查清单中列出"每个度量必须标注可加性"
**Warning signs:** schema.yml 中度量列缺少 `meta` 标签

### Pitfall 3: 标准字段遗漏

**What goes wrong:** DDL 缺少 etl_date、is_deleted、dw_create_time 等标准字段
**Why it happens:** Claude 关注业务字段，忽略技术元数据
**How to avoid:**
- 在输出模板中明确列出"事实表必须包含的标准字段"
- 引用 `naming.md` 中的标准字段规范
**Warning signs:** DDL 中没有 `etl_date` 或 `is_deleted`

### Pitfall 4: 分区列位置错误

**What goes wrong:** dbt SQL 模板中分区列 `dt` 不在 SELECT 末尾
**Why it happens:** 未遵循 Hive 动态分区语法要求
**How to avoid:**
- 在输出模板中强调"分区列必须在 SELECT 末尾"
- 引用 `hive-constraints.md` 中的 HIVE-001 约束
**Warning signs:** dbt run 报错 "partition column must be last"

### Pitfall 5: 追问过度 vs 推断不足

**What goes wrong:** 要么每个细节都追问用户（效率低），要么自行推断但结果不准
**Why it happens:** 缺少"何时追问、何时推断"的决策指南
**How to avoid:**
- 定义"必填最小集"（业务事件 + 粒度）
- 其他信息：先推断，给出推断结果，请用户确认或修正
**Warning signs:** 用户抱怨"问太多问题"或"推断的结果不对"

---

## Code Examples

### Example 1: Mermaid ER Diagram for Star Schema

```mermaid
erDiagram
    DWD_FACT_ORDER_DETAIL ||--o{ DIM_CUSTOMER : customer_id
    DWD_FACT_ORDER_DETAIL ||--o{ DIM_PRODUCT : product_id
    DWD_FACT_ORDER_DETAIL ||--o{ DIM_DATE : date_key
    DWD_FACT_ORDER_DETAIL ||--o{ DIM_STORE : store_id

    DWD_FACT_ORDER_DETAIL {
        bigint order_detail_sk PK
        bigint customer_id FK
        bigint product_id FK
        int date_key FK
        bigint store_id FK
        string order_no "退化维度"
        int quantity "可加"
        decimal unit_price "不可加"
        decimal line_amount "可加"
        tinyint is_deleted
        timestamp dw_create_time
        date etl_date
        string dt "分区键"
    }

    DIM_CUSTOMER {
        bigint customer_sk PK
        bigint customer_id BK
        string customer_name
        string customer_level
        date dw_valid_from
        date dw_valid_to
        tinyint is_current
    }

    DIM_PRODUCT {
        bigint product_sk PK
        bigint product_id BK
        string product_name
        string category_name
        string brand_name
    }

    DIM_DATE {
        int date_key PK
        date full_date
        string day_of_week
        int month
        int quarter
        int year
    }
```

**Source:** [Mermaid ER Diagram Syntax](https://mermaid.js.org/syntax/entityRelationshipDiagram.html)

### Example 2: ASCII Star Schema Diagram

```
                    +-------------------+
                    |   DIM_CUSTOMER    |
                    +-------------------+
                    | customer_sk (PK)  |
                    | customer_id (BK)  |
                    | customer_name     |
                    | customer_level    |
                    | dw_valid_from     |
                    | dw_valid_to       |
                    | is_current        |
                    +--------+----------+
                             |
                             | customer_id
                             |
+-------------------+        |        +-------------------+
|    DIM_DATE       |        |        |   DIM_PRODUCT     |
+-------------------+        |        +-------------------+
| date_key (PK)     |        |        | product_sk (PK)   |
| full_date         |        |        | product_id (BK)   |
| day_of_week       |        |        | product_name      |
| month, quarter    |        |        | category_name     |
| year              |        |        | brand_name        |
+--------+----------+        |        +--------+----------+
         |                   |                 |
         | date_key          |                 | product_id
         |                   |                 |
         +-------------------+-----------------+
                             |
                +------------+------------+
                | DWD_FACT_ORDER_DETAIL   |
                +-------------------------+
                | order_detail_sk (PK)    |
                | customer_id (FK)        |
                | product_id (FK)         |
                | date_key (FK)           |
                | order_no (退化维度)     |
                | quantity (可加)         |
                | unit_price (不可加)     |
                | line_amount (可加)      |
                | is_deleted              |
                | dw_create_time          |
                | etl_date                |
                | dt (分区键)             |
                +-------------------------+
```

### Example 3: Hive DDL with Full Compliance

```sql
-- 事实表 DDL（符合 HIVE-001 ~ HIVE-020 约束）
CREATE TABLE IF NOT EXISTS dwd_fact_order_detail (
    -- 代理键
    order_detail_sk     BIGINT              COMMENT '代理键',

    -- 维度外键
    customer_id         BIGINT              COMMENT '客户维度外键',
    product_id          BIGINT              COMMENT '产品维度外键',
    date_key            INT                 COMMENT '日期维度外键',
    store_id            BIGINT              COMMENT '门店维度外键',

    -- 退化维度
    order_no            STRING              COMMENT '订单号（退化维度）',

    -- 度量（标注可加性）
    quantity            INT                 COMMENT '数量（可加）',
    unit_price          DECIMAL(18,2)       COMMENT '单价（不可加）',
    line_amount         DECIMAL(18,2)       COMMENT '订单行金额（可加）',
    discount_amount     DECIMAL(18,2)       COMMENT '折扣金额（可加）',

    -- 标准字段（DESIGN-06 要求）
    is_deleted          TINYINT             COMMENT '删除标志 0/1',
    data_source         STRING              COMMENT '数据来源',
    dw_create_time      TIMESTAMP           COMMENT '数据入仓时间',
    dw_modify_time      TIMESTAMP           COMMENT '数据修改时间',
    etl_date            DATE                COMMENT 'ETL处理日期'
)
COMMENT '订单明细事实表 - 粒度：一个订单行'
PARTITIONED BY (dt STRING COMMENT '日期分区 yyyy-MM-dd')
STORED AS ORC
TBLPROPERTIES (
    'orc.compress'='SNAPPY',
    'transactional'='false'
);
```

### Example 4: schema.yml with Full Tests and Meta

```yaml
version: 2

models:
  - name: dwd_fact_order_detail
    description: |
      订单明细事实表

      **粒度：** 一个订单行
      **事实类型：** 事务事实表
      **更新策略：** insert_overwrite 分区回刷

    meta:
      owner: data-platform
      layer: dwd
      domain: order
      fact_type: transaction
      grain: "一个订单行"

    tests:
      # 业务键 + 分区键唯一
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns:
            - order_no
            - dt

    columns:
      - name: order_detail_sk
        description: 代理键
        tests:
          - unique
          - not_null

      - name: customer_id
        description: 客户维度外键
        tests:
          - not_null
          - relationships:
              to: ref('dim_customer')
              field: customer_id

      - name: quantity
        description: 数量
        meta:
          additivity: additive  # 可加
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"

      - name: unit_price
        description: 单价
        meta:
          additivity: non_additive  # 不可加
        tests:
          - not_null

      - name: line_amount
        description: 订单行金额
        meta:
          additivity: additive  # 可加
        tests:
          - not_null

      - name: is_deleted
        description: 删除标志
        tests:
          - not_null
          - accepted_values:
              values: [0, 1]

      - name: etl_date
        description: ETL处理日期
        tests:
          - not_null

      - name: dt
        description: 日期分区
        tests:
          - not_null
```

### Example 5: dbt SQL Model Template

```sql
-- models/dwd/dwd_fact_order_detail.sql
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
    SELECT
        -- 显式列出所有字段（禁止 SELECT *）
        order_id,
        order_item_id,
        customer_id,
        product_id,
        store_id,
        order_no,
        quantity,
        unit_price,
        order_amount,
        discount_amount,
        order_status,
        created_at,
        updated_at,
        dt
    FROM {{ source('ods', 'order_detail') }}
    WHERE dt >= date_sub('{{ var("ds") }}', {{ var("lookback_days", 7) }})
      AND dt <= '{{ var("ds") }}'
      AND dt IS NOT NULL
      AND dt RLIKE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
),

-- 分区内去重，取最新版本
deduplicated AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY order_no, dt
            ORDER BY updated_at DESC
        ) AS rn
    FROM source
),

final AS (
    SELECT
        -- 代理键（可使用 ROW_NUMBER 或 UUID）
        ROW_NUMBER() OVER (ORDER BY order_no) AS order_detail_sk,

        -- 维度外键
        customer_id,
        product_id,
        CAST(date_format(created_at, 'yyyyMMdd') AS INT) AS date_key,
        store_id,

        -- 退化维度
        order_no,

        -- 度量
        quantity,
        unit_price,
        order_amount AS line_amount,
        discount_amount,

        -- 标准字段
        CASE WHEN order_status = 'CANCELLED' THEN 1 ELSE 0 END AS is_deleted,
        'ods_mysql' AS data_source,
        CURRENT_TIMESTAMP AS dw_create_time,
        CURRENT_TIMESTAMP AS dw_modify_time,
        CAST('{{ var("ds") }}' AS DATE) AS etl_date,

        -- 分区列必须在最后（HIVE-001）
        dt
    FROM deduplicated
    WHERE rn = 1
)

SELECT * FROM final
```

---

## State of the Art

| 旧方法 | 当前方法 | 何时改变 | 影响 |
|--------|---------|---------|------|
| 手动设计星型模型 | AI 辅助自动生成 | 2024-2025 | 开发时间减少 80%+ |
| 单一 Mega-Prompt | 4-block 结构化提示 | 2025 | 可维护性、稳定性提升 |
| 纯文本输出 | 结构化输出（JSON/YAML） | 2024 | 可解析、可验证 |
| 单次生成 | Chain-of-Thought + 确认 | 2025 | 准确性提升 |
| 本地知识 | RAG / includes 引用 | 2025 | 知识一致性、可更新 |

**Deprecated/outdated:**
- **Mega-Prompt:** 将所有知识堆砌在一个提示中 — 超出 token 限制，难以维护
- **无格式约束输出:** 自由文本输出 — 下游难以解析和验证

---

## Open Questions

### 1. 案例库复杂度梯度

**What we know:** 需要覆盖电商、用户行为、金融三个领域
**What's unclear:** 每个领域应提供几个案例？复杂度梯度如何设计？
**Recommendation:**
- 简单案例（1-2 个维度）内嵌提示中
- 中等案例（3-4 个维度 + 特殊模式）放 examples/
- 复杂案例（多事件统一建模）仅按需引用

### 2. SQL 模板完成度的判断标准

**What we know:** 用户决定"根据输入完整度决定"
**What's unclear:** 具体的完整度阈值是什么？
**Recommendation:**
- 完整输入（业务事件 + 粒度 + 度量 + 维度 + 字段清单）→ 可运行 SQL
- 部分输入（业务事件 + 粒度）→ 骨架 + TODO 注释
- 提供"完整度评估"部分，让用户了解当前状态

### 3. 多事件统一建模的输出组织

**What we know:** 支持多事件（如订单 + 退款 + 物流）统一设计
**What's unclear:** 多事实表 + 共享维度的输出格式如何组织？
**Recommendation:**
- 先输出 Bus Matrix 总览
- 每个事实表单独章节
- 共享维度单独章节
- Mermaid 图展示完整关系

---

## Sources

### Primary (HIGH confidence)

- **项目内部文档（已读取验证）：**
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/methodology/dimensional-modeling.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/methodology/fact-table-types.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/methodology/scd-strategies.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/layers/layering-system.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/platform/hive-constraints.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/platform/dbt-hive-limitations.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/context/platform/incremental-strategies.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/docs/naming.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/docs/token-budget.md`
  - `/Users/cookie/PycharmProjects/hivemind/.claude/data-warehouse/glossary/terms.md`

- **Mermaid 官方文档：**
  - [Mermaid ER Diagram Syntax](https://mermaid.js.org/syntax/entityRelationshipDiagram.html)

### Secondary (MEDIUM confidence)

- [Claude Prompt Engineering Best Practices 2026](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026) — 4-block 结构化提示
- [Anthropic Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices) — Claude 4.x 提示工程
- [AI-Augmented Data Modeling Research](https://asrjetsjournal.org/American_Scientific_Journal/article/view/11930) — AI 辅助星型模型设计研究
- [dbt Copilot Documentation](https://docs.getdbt.com/docs/cloud/use-dbt-copilot) — AI 生成 dbt 配置
- [IBM Prompt Engineering Guide 2026](https://www.ibm.com/think/prompt-engineering) — Context Engineering

### Tertiary (LOW confidence)

- [Medium: LLM for Unified Star Schema](https://medium.com/@irregularbi/how-i-virtualized-a-unified-star-schema-using-llm-7e69cd40a734) — LLM 辅助 USS 实践（单一来源）

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 基于项目已有文档和官方资源
- Architecture patterns: HIGH - 基于 Claude 官方指南和项目约束
- Pitfalls: MEDIUM - 基于通用提示工程最佳实践 + 项目特定约束
- Code examples: HIGH - 基于项目已有模板和官方语法

**Research date:** 2026-01-31
**Valid until:** 60 days（提示工程模式相对稳定）

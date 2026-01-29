# Phase 01: 基础设施 (Infrastructure) - Research

**Researched:** 2026-01-30
**Domain:** 数据仓库基础设施 - 目录结构、术语标准化、命名规范、提示工程
**Confidence:** HIGH

## Summary

本阶段研究了数据仓库提示系统基础设施的四个核心领域：目录结构组织、术语表设计、命名规范制定、以及 AI 提示规范。

研究发现，dbt 生态系统已建立成熟的分层结构模式（staging/intermediate/marts），可直接映射到中国数据仓库的 ODS/DWD/DWS/ADS 分层体系。术语标准化方面，Kimball 维度建模和阿里云 DataWorks 提供了权威的术语定义。命名规范上，snake_case（全小写下划线分隔）是 Hive 生态的事实标准。AI 提示组织方面，模块化设计和 XML 标签结构是 Claude 官方推荐的最佳实践。

**Primary recommendation:** 采用 dbt 风格的分层目录结构，结合阿里云分层命名约定，使用 Markdown + YAML frontmatter 格式的提示文件，保持单文件 < 2000 tokens（约 8000 字符）。

## Standard Stack

本阶段不涉及编程库，而是文档和目录结构设计。以下是「标准工具栈」：

### Core

| Tool/Pattern | Version/Type | Purpose | Why Standard |
|-------------|--------------|---------|--------------|
| Markdown | CommonMark | 术语表、规范文档格式 | 人类可读、版本控制友好、Claude 原生支持 |
| YAML frontmatter | YAML 1.2 | 提示文件元数据（version, last_updated） | 结构化元数据、易于解析、广泛支持 |
| snake_case | 命名约定 | 表名、字段名、文件名 | Hive 生态事实标准、大小写不敏感系统兼容 |
| kebab-case | 命名约定 | 目录名、文档文件名 | URL 友好、可读性好、Claude Code 常见约定 |

### Supporting

| Tool/Pattern | Version/Type | Purpose | When to Use |
|-------------|--------------|---------|-------------|
| XML tags | Claude 提示结构 | 分隔提示的不同部分 | 复杂提示需要清晰边界时 |
| Mermaid | 图表语法 | 架构图、流程图（可选） | 需要可视化说明时 |
| JSON Schema | 验证格式 | 定义输入/输出结构（可选） | Phase 8 工具化时 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Markdown 表格 | JSON/YAML 术语表 | JSON 更易程序处理，但人类可读性差；用户已决定优先人类可读 |
| YAML frontmatter | 纯 Markdown | 纯 Markdown 更简单，但缺少结构化元数据；用户已决定需要版本标记 |
| kebab-case 文件名 | snake_case 文件名 | 两者都可，kebab-case 在 URL 中更常见；由 Claude 决定 |

## Architecture Patterns

### Recommended Directory Structure

```
.claude/data-warehouse/
├── prompts/                           # 提示文件
│   ├── system/                        # 系统级提示（角色定义、全局指令）
│   │   ├── dw-architect.md            # 数仓架构师角色
│   │   └── coding-standards.md        # 编码规范指令
│   └── scenarios/                     # 场景提示（具体任务）
│       ├── dimensional-modeling/      # 维度建模场景
│       ├── layer-design/              # 分层设计场景
│       └── ...                        # 其他场景（Phase 2-7）
│
└── context/                           # 上下文知识库
    ├── methodology/                   # 方法论（Kimball、Inmon 等）
    ├── layers/                        # 分层体系（ODS/DWD/DWS/ADS）
    ├── governance/                    # 治理规范
    │   ├── naming-conventions.md      # 命名规范
    │   └── prompt-standards.md        # 提示规范
    ├── platform/                      # 平台特定（Hive）
    └── glossary/                      # 术语表
        └── zh-en-mapping.md           # 中英术语对照
```

**Key Design Decisions:**

1. **prompts/ vs context/ 分离** - 提示是"指令"，上下文是"知识"，分开管理便于复用
2. **scenarios/ 按业务场景组织** - 不按工具组织，便于后续 Phase 扩展
3. **governance/ 集中治理** - 命名规范、提示规范放在一起，便于一致性管理
4. **扁平优先** - 避免过深嵌套（最多 3 层），提高可发现性

### Pattern 1: 术语表四栏格式

**What:** 术语表使用四栏 Markdown 表格：中文 | 英文 | 定义 | 示例
**When to use:** 所有术语条目
**Example:**

```markdown
## 维度建模核心术语

| 中文 | 英文 | 定义 | 示例 |
|------|------|------|------|
| 事实表 | Fact Table | 存储业务过程度量值的表，包含外键和数值型事实 | `dwd_fact_orders` 存储订单金额、数量 |
| 维度表 | Dimension Table | 存储业务实体描述性属性的表，为事实表提供上下文 | `dim_customer` 存储客户姓名、地址 |
| 粒度 | Grain | 事实表单行所代表的业务含义，是维度设计的核心决策 | "一行代表一个订单明细" |
```

Source: Kimball Group 维度建模技术 + dbt 文档最佳实践

### Pattern 2: 命名规范正反例格式

**What:** 命名规则配正确和错误示例
**When to use:** 容易混淆或出错的规则
**Example:**

```markdown
### 表名命名规范

**规则：** `{layer}_{type}_{domain}_{entity}`

| 组件 | 说明 | 示例 |
|------|------|------|
| layer | 分层前缀 | `ods_`, `dwd_`, `dws_`, `ads_` |
| type | 表类型（可选） | `fact_`, `dim_`, `bridge_` |
| domain | 业务域 | `order`, `customer`, `product` |
| entity | 实体名 | `orders`, `details`, `daily` |

**正确示例：**
- `dwd_fact_order_details` - 订单明细事实表
- `dim_customer` - 客户维度表
- `dws_order_daily` - 订单日汇总

**错误示例：**
- `DWD_FACT_ORDER` - 不要大写
- `dwd.fact.order` - 不要用点号
- `d_order` - 不要过度缩写
```

Source: dbt Naming Conventions + Hive Naming Standards

### Pattern 3: 提示文件 frontmatter

**What:** 使用 YAML frontmatter 标记提示文件元数据
**When to use:** 所有提示文件
**Example:**

```markdown
---
version: "1.0"
last_updated: "2026-01-30"
purpose: "维度建模设计指导"
token_estimate: 1200
---

# 维度建模设计提示

<context>
你是一位资深数据仓库架构师，专注于 Kimball 维度建模方法论...
</context>

<instructions>
1. 首先确定业务过程和粒度
2. 识别相关维度
3. 确定事实度量
</instructions>
```

Source: Claude 官方提示工程最佳实践 + 用户决定

### Anti-Patterns to Avoid

- **过深嵌套：** 目录层级超过 3 层会降低可发现性，使用扁平结构
- **文件过大：** 单文件超过 2000 tokens 会影响 Claude 处理效率，拆分为多个模块
- **命名不一致：** 混用 camelCase 和 snake_case 会造成混乱，始终使用 snake_case
- **术语定义缺失：** 只列中英对照不写定义，会导致理解偏差，必须包含定义列
- **示例缺失：** 只有规则没有示例，难以理解应用场景，关键规则必须配示例

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 术语定义 | 自创术语解释 | Kimball Group 官方定义 | 行业标准，避免歧义 |
| 分层命名 | 自创分层缩写 | 阿里云 DataWorks 标准（ODS/DWD/DWS/ADS） | 中国数仓生态事实标准 |
| 提示结构 | 自创标签体系 | Claude XML 标签最佳实践 | 官方推荐，Claude 理解更好 |
| Token 估算 | 手动计数 | 4 字符 ≈ 1 token 规则 | 业界标准估算方法 |
| SCD 类型定义 | 自创描述 | Kimball SCD Type 1-6 标准定义 | 权威来源，避免混淆 |

**Key insight:** 数据仓库领域有成熟的术语体系和命名约定，不需要创新，需要准确引用和本地化。

## Common Pitfalls

### Pitfall 1: 中英术语翻译不一致

**What goes wrong:** 同一个术语在不同地方翻译不同（如 Dimension 译为"维度"或"维表"）
**Why it happens:** 多人编写、缺少统一标准
**How to avoid:**
- 建立「首选译法」列，明确每个术语的标准翻译
- 在术语表中标注「也称为」作为别名
**Warning signs:** 同一文档中出现同一概念的不同表述

### Pitfall 2: 命名规范只有规则没有示例

**What goes wrong:** 读者理解规则但不知道如何应用
**Why it happens:** 认为规则足够清晰
**How to avoid:**
- 每条规则至少配一个正确示例
- 复杂规则配正反例对比
**Warning signs:** 团队成员对同一规则有不同理解

### Pitfall 3: Token 限制导致信息截断

**What goes wrong:** 提示文件过长，Claude 丢失后部内容
**Why it happens:** 未监控文件大小
**How to avoid:**
- 单文件目标 < 1500 tokens，硬限制 < 2000 tokens
- 使用 `token_estimate` frontmatter 字段跟踪
- 长内容拆分为多个聚焦文件
**Warning signs:** 提示文件超过 6000 字符（约 1500 tokens）

### Pitfall 4: 目录结构过早固化

**What goes wrong:** 初始结构不适应后续 Phase 扩展
**Why it happens:** 未考虑完整 Phase 2-8 需求
**How to avoid:**
- 使用 scenarios/ 作为扩展点，每个 Phase 新增子目录
- 保持顶层结构稳定（prompts/ + context/）
**Warning signs:** 后续 Phase 需要重构目录结构

### Pitfall 5: 术语表覆盖不全

**What goes wrong:** 缺少关键术语，导致后续 Phase 需要回补
**Why it happens:** 只关注「显而易见」的术语
**How to avoid:**
- 覆盖四大领域：维度建模、分层体系、指标治理、SCD/增量
- 参考 Kimball 完整术语列表
- 预计 80+ 条目
**Warning signs:** 后续 Phase 频繁需要新增术语定义

## Code Examples

### Example 1: 术语表文件结构

```markdown
---
version: "1.0"
last_updated: "2026-01-30"
purpose: "数据仓库中英术语对照，支持 Claude 理解双语需求"
token_estimate: 1800
---

# 中英术语对照表

## 维度建模核心术语

| 中文 | 英文 | 定义 | 示例 |
|------|------|------|------|
| 事实表 | Fact Table | 存储业务过程度量值的表，包含外键和数值型事实 | `dwd_fact_orders` |
| 维度表 | Dimension Table | 存储业务实体描述性属性的表 | `dim_customer` |
| 星型模型 | Star Schema | 一个事实表连接多个维度表的结构 | 订单事实 + 时间/客户/产品维度 |
| 雪花模型 | Snowflake Schema | 维度表进一步规范化的星型变体 | 产品维度拆分为产品/品类/品牌 |
| 粒度 | Grain | 事实表单行代表的业务含义 | "每行一个订单明细" |

## 分层体系术语

| 中文 | 英文 | 定义 | 示例 |
|------|------|------|------|
| 操作数据层 | ODS (Operational Data Store) | 原始数据落地层，保持源系统结构 | `ods_mysql_orders` |
| 明细数据层 | DWD (Data Warehouse Detail) | 清洗后的明细事实层 | `dwd_fact_order_details` |
| 汇总数据层 | DWS (Data Warehouse Summary) | 轻度汇总的主题宽表 | `dws_order_daily` |
| 应用数据层 | ADS (Application Data Service) | 面向应用的指标结果 | `ads_gmv_report` |
| 维度层 | DIM (Dimension) | 一致性维度表 | `dim_date`, `dim_customer` |
```

Source: Kimball Group + 阿里云 DataWorks 分层规范

### Example 2: 命名规范文件结构

```markdown
---
version: "1.0"
last_updated: "2026-01-30"
purpose: "数据仓库命名规范，确保表/字段/文件命名一致性"
token_estimate: 1500
---

# 命名规范

## 通用原则

1. **全小写** - 所有名称使用小写字母
2. **下划线分隔** - 使用 `_` 连接多词，不用驼峰
3. **英文命名** - 表名、字段名使用英文，注释用中文
4. **避免缩写** - 除非是通用缩写（id, amt, qty）

## 表名规范

**格式：** `{layer}_{type}_{domain}_{entity}_{suffix}`

| 组件 | 必填 | 说明 | 选项 |
|------|------|------|------|
| layer | 是 | 分层前缀 | `ods_`, `dwd_`, `dws_`, `ads_`, `dim_` |
| type | 否 | 表类型 | `fact_`, `bridge_`, `agg_` |
| domain | 是 | 业务域 | `order`, `customer`, `product` |
| entity | 是 | 实体名 | `orders`, `details`, `daily` |
| suffix | 否 | 存储策略 | `_di`(增量), `_df`(全量) |

**示例：**

| 表名 | 说明 |
|------|------|
| `ods_mysql_orders_di` | ODS 层，MySQL 来源，订单表，增量 |
| `dwd_fact_order_details` | DWD 层，订单明细事实表 |
| `dim_customer` | 客户维度表 |
| `dws_order_daily` | 订单日汇总表 |
| `ads_gmv_dashboard` | GMV 看板应用表 |

## 字段名规范

**格式：** `{prefix}_{entity}_{attribute}`

| 类型 | 前缀 | 示例 |
|------|------|------|
| 主键 | 无或 `id` | `order_id`, `customer_id` |
| 外键 | 与主键一致 | `customer_id`（引用 dim_customer） |
| 布尔 | `is_` 或 `has_` | `is_active`, `has_coupon` |
| 日期 | `_date` 后缀 | `order_date`, `ship_date` |
| 时间戳 | `_at` 后缀 | `created_at`, `updated_at` |
| 金额 | `_amt` 后缀 | `order_amt`, `discount_amt` |
| 数量 | `_qty` 或 `_cnt` | `order_qty`, `item_cnt` |
```

Source: dbt Style Guide + Hive Naming Conventions

### Example 3: 提示文件结构

```markdown
---
version: "1.0"
last_updated: "2026-01-30"
purpose: "示例提示文件结构"
token_estimate: 800
---

# [场景名称]

<context>
定义 Claude 需要了解的背景知识...
</context>

<role>
你是一位 [角色描述]，专注于 [专业领域]...
</role>

<instructions>
1. 第一步操作
2. 第二步操作
3. 第三步操作
</instructions>

<output_format>
期望的输出格式说明...

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 示例 | 示例 | 示例 |
</output_format>

<examples>
### 示例输入
[输入内容]

### 示例输出
[输出内容]
</examples>
```

Source: Claude 官方 XML 标签最佳实践

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 自定义分层命名 | 标准化 ODS/DWD/DWS/ADS | 2020+ 阿里云普及 | 中国数仓生态统一术语 |
| 长篇系统提示 | 模块化提示 + 上下文分离 | 2024+ Claude 最佳实践 | 更好的可维护性和复用性 |
| 纯 Markdown 提示 | XML 标签 + Markdown | 2024+ Anthropic 推荐 | Claude 更准确解析结构 |
| 单一术语文档 | 四栏表格（中/英/定义/示例） | 通用最佳实践 | 减少歧义，提高可操作性 |

**Deprecated/outdated:**
- 驼峰命名（camelCase）：Hive 不区分大小写，snake_case 是正确选择
- 过度缩写（cust 代替 customer）：可读性优先于简洁性
- 单文件大型提示：拆分为模块化小文件更易维护

## Open Questions

1. **术语表的领域划分粒度**
   - What we know: 至少需要 4 个领域（维度建模、分层体系、指标治理、SCD）
   - What's unclear: 是否需要更细分（如单独的「元数据术语」「数据质量术语」）
   - Recommendation: 从 4 个核心领域开始，后续 Phase 按需扩展

2. **文件命名约定的最终选择**
   - What we know: 用户授权 Claude 决定，选项是 kebab-case 或 snake_case
   - What's unclear: 社区没有强共识
   - Recommendation: 使用 kebab-case（如 `zh-en-mapping.md`），与 URL 风格一致，且区别于数据库对象的 snake_case

3. **Token 估算的准确性**
   - What we know: 4 字符 ≈ 1 token 是粗略估算，实际因语言和内容而异
   - What's unclear: 中文内容的 token 密度
   - Recommendation: 中文按 1.5-2 字符 ≈ 1 token 估算更保守；frontmatter 中标记估算值，Phase 8 工具提供精确检查

## Sources

### Primary (HIGH confidence)
- [dbt How We Structure Projects](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview) - 项目结构最佳实践
- [dbt How We Style Models](https://docs.getdbt.com/best-practices/how-we-style/1-how-we-style-our-dbt-models) - 命名规范
- [Kimball Group Dimensional Modeling Techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/) - 维度建模术语权威来源
- [Claude XML Tags Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags) - 提示结构官方指南
- [阿里云 DataWorks 数仓分层](https://www.alibabacloud.com/help/en/dataworks/user-guide/data-warehouse-layering) - ODS/DWD/DWS/ADS 分层规范

### Secondary (MEDIUM confidence)
- [Cloudera Hive Naming Conventions](https://community.cloudera.com/t5/Community-Articles/Hive-Naming-conventions-and-database-naming-standards/ta-p/246693) - Hive 命名实践
- [Wikipedia Slowly Changing Dimension](https://en.wikipedia.org/wiki/Slowly_changing_dimension) - SCD 类型定义
- [Panoply Data Warehouse Naming Guide](https://blog.panoply.io/data-warehouse-naming-conventions) - 命名规范综合指南

### Tertiary (LOW confidence)
- [Prompt Library Organization](https://www.taylorradey.com/post/how-to-organize-and-scale-your-generative-ai-prompt-library) - 提示库组织模式（社区经验）
- [Token Counting with tiktoken](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb) - Token 估算方法

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - 基于官方文档和行业标准
- Architecture: HIGH - dbt 和阿里云有明确的结构规范
- Pitfalls: MEDIUM - 基于社区经验和最佳实践文档
- Token Limits: MEDIUM - 估算公式已验证，但中文具体比例需实测

**Research date:** 2026-01-30
**Valid until:** 2026-03-01（60 天，因为是稳定的基础设施领域）

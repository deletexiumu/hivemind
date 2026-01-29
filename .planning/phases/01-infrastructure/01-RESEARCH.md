# Phase 01: 基础设施 (Infrastructure) - Research

**Researched:** 2026-01-30
**Updated:** 2026-01-30 (Codex Review)
**Domain:** 数据仓库基础设施 - 目录结构、术语标准化、命名规范、提示工程
**Confidence:** HIGH

## Summary

本阶段研究了数据仓库提示系统基础设施的四个核心领域：目录结构组织、术语表设计、命名规范制定、以及 AI 提示规范。

研究发现，dbt 生态系统已建立成熟的分层结构模式（staging/intermediate/marts），可直接映射到中国数据仓库的 ODS/DWD/DWS/ADS 分层体系。术语标准化方面，Kimball 维度建模和阿里云 DataWorks 提供了权威的术语定义，但两者存在方法论差异，需要建立权威原则。命名规范上，snake_case（全小写下划线分隔）是 Hive 生态的事实标准。AI 提示组织方面，模块化设计和 XML 标签结构是 Claude 官方推荐的最佳实践。

**经 Codex 审阅后的主要调整：**
- 目录结构简化为 ≤3 层，扁平优先
- YAML frontmatter 精简为最小必要字段，`id` 按路径推导
- 术语表扩展为 10 列，增加 `term_id`、`同义词/别名`、`Owner` 等治理字段
- Token 预算采用保守估算（1 token ≈ 1 中文字符）
- 新增术语权威原则：Kimball 优先（方法论）、DataWorks 优先（平台）、项目规范（自定义分层）

**Primary recommendation:** 采用 ≤3 层扁平目录结构（prompts/ + context/ + glossary/ + docs/），使用精简 YAML frontmatter，术语表采用 Markdown 10 列格式，单文件 < 2000 tokens（保守按 1 token ≈ 1 中文字符估算）。

## Standard Stack

本阶段不涉及编程库，而是文档和目录结构设计。以下是「标准工具栈」：

### Core

| Tool/Pattern | Version/Type | Purpose | Why Standard |
|-------------|--------------|---------|--------------|
| Markdown | CommonMark | 术语表、规范文档格式 | 人类可读、版本控制友好、Claude 原生支持 |
| YAML frontmatter | YAML 1.2 | 提示文件元数据（精简字段） | 结构化元数据、易于解析、广泛支持 |
| snake_case | 命名约定 | 表名、字段名、term_id | Hive 生态事实标准、大小写不敏感系统兼容 |
| kebab-case | 命名约定 | 目录名、文档文件名 | URL 友好、可读性好、与数仓对象命名解耦 |

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
| kebab-case 文件名 | snake_case 文件名 | **决策：kebab-case**，与 URL 风格一致，且区别于数据库对象的 snake_case |

## Architecture Patterns

### Recommended Directory Structure (Phase 1 精简版，≤3 层)

```
.claude/data-warehouse/
├── prompts/
│   ├── system/                    # 跨场景稳定规则
│   │   ├── base.md                # 通用底座（写作风格、输出格式、边界）
│   │   └── sql.md                 # SQL 生成规范
│   └── scenarios/                 # 一文件一场景（最扁平）
│       └── <scenario>.md          # 如 order-refund.md, revenue-daily.md
│
├── context/
│   ├── global/                    # 全局知识与规范
│   │   ├── sql-style.md           # SQL 风格规范
│   │   └── naming.md              # 命名规范（可选，或放 docs/）
│   └── domains/                   # 一域一文件（Phase 1）
│       ├── sales.md               # 销售域知识
│       └── finance.md             # 财务域知识
│
├── glossary/
│   └── terms.md                   # 术语主表（Markdown 10 列）
│
└── docs/
    ├── naming.md                  # 命名规范细则
    ├── prompting.md               # 提示规范
    └── token-budget.md            # Token 预算规范
```

**Key Design Decisions (经 Codex 审阅):**

1. **prompts/ vs context/ 分离** - 提示是"指令"，上下文是"知识"，分开管理便于复用
2. **scenarios/ 扁平化** - 一文件一场景，通过 `includes:` 组合 system/context，避免深层嵌套
3. **context/domains/ 一域一文件** - Phase 1 先简单，Phase 2+ 再按需拆分为 schemas/metrics/
4. **glossary/ 独立** - 术语表是跨领域共享资产，独立管理
5. **docs/ 集中规范** - 命名、提示、Token 规范放在一起，便于一致性管理
6. **≤3 层深度** - 扁平优先，提高可发现性

**Phase 8 扩展预留目录（Phase 1 不创建）：**
- `evals/` - 回归用例、评分规约
- `scripts/` - frontmatter 校验、token 统计
- `templates/` - 文件模板
- `index.yaml` - 可机器生成的资产索引

### Pattern 1: YAML Frontmatter 规范 (Phase 1 最小字段)

**What:** 使用 YAML frontmatter 标记提示文件元数据
**When to use:** `prompts/**/*.md` 与 `context/**/*.md` 必须包含；`glossary/terms.md` 可不包含
**Phase 1 最小字段 (MUST):**

```yaml
---
type: prompt              # prompt | context
title: <标题>
status: active            # draft | active | deprecated
version: 1.0.0
domain: <domain>          # global 或具体领域名（如 sales/finance）
owner: <负责人或团队>
updated_at: YYYY-MM-DD
includes:                 # 可选，参考引用（Phase 1 不做自动组合）
  - context/global/sql-style
  - context/domains/sales
---
```

**`id` 规则 (Phase 1 精简治理):**
- `id` 字段可省略；缺省时按路径推导为默认 ID
- 推导规则：`id = <仓库相对路径去掉扩展名>`（使用 `/` 分隔）
- 示例：文件 `prompts/scenarios/order-refund.md` 的默认 `id` 为 `prompts/scenarios/order-refund`
- 若显式写 `id`，必须与推导结果一致

**`includes` 语义 (Phase 1):**
- `includes` 仅声明"写作/评审依赖的上下文来源"，便于人工核对
- Phase 1 不要求任何工具对 `includes` 做自动拼装；运行时内容以文件正文为准
- Phase 8 工具化时可升级为自动组合

**`status=deprecated` 时 (SHOULD):**
```yaml
deprecated_to: <目标路径ID>
```

Source: Codex 审阅建议 + Claude 官方提示工程最佳实践

### Pattern 2: 术语表 10 列格式 (经 Codex 审阅扩展)

**What:** 术语表使用 10 列 Markdown 表格，支持治理和引用
**When to use:** `glossary/terms.md`
**固定表头 (MUST):**

| term_id | 中文 | English | 定义 | 示例 | 同义词/别名 | 领域(domain) | Owner | 状态 | 更新日期 |
|---------|------|---------|------|------|-------------|--------------|-------|------|----------|

**`term_id` 规则:**
- MUST 使用 ASCII（不使用中文做主键，避免编码/改名问题）
- 格式：`<domain>_<slug>`（snake_case），示例：`sales_gmv`、`finance_net_revenue`
- `slug` 规则：优先使用英文术语/常用缩写；无英文时用团队约定缩写或拼音（保持稳定即可）
- 冲突处理：若发生重名，追加更具体后缀（如 `_refund_excl`）或追加序号（如 `_2`），同时在"同义词/别名"保留中文叫法映射

**示例:**

```markdown
## 维度建模核心术语

| term_id | 中文 | English | 定义 | 示例 | 同义词/别名 | 领域 | Owner | 状态 | 更新日期 |
|---------|------|---------|------|------|-------------|------|-------|------|----------|
| modeling_fact_table | 事实表 | Fact Table | 存储业务过程度量值的表，包含外键和数值型事实 | `dwd_fact_orders` | 事实 | modeling | data-platform | active | 2026-01-30 |
| modeling_dimension | 维度表 | Dimension Table | 存储业务实体描述性属性的表，为事实表提供上下文 | `dim_customer` | 维表\|维度 | modeling | data-platform | active | 2026-01-30 |
| modeling_grain | 粒度 | Grain | 事实表单行所代表的业务含义，是维度设计的核心决策 | "一行代表一个订单明细" | 颗粒度 | modeling | data-platform | active | 2026-01-30 |
```

**同义词/别名 格式:** 使用 `|` 分隔多个别名

Source: Kimball Group + Codex 审阅建议

### Pattern 3: 命名规范正反例格式

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

### Anti-Patterns to Avoid

- **过深嵌套：** 目录层级超过 3 层会降低可发现性，使用扁平结构
- **文件过大：** 单文件超过 2000 tokens 会影响 Claude 处理效率，拆分为多个模块
- **命名不一致：** 混用 camelCase 和 snake_case 会造成混乱；文件用 kebab-case，数仓对象用 snake_case
- **术语定义缺失：** 只列中英对照不写定义，会导致理解偏差，必须包含定义列
- **示例缺失：** 只有规则没有示例，难以理解应用场景，关键规则必须配示例
- **term_id 不稳定：** 使用中文做主键会导致改名/编码问题，必须用 ASCII

## Terminology Authority (新增：术语权威原则)

### 背景：Kimball vs DataWorks 潜在冲突

Kimball 维度建模是方法论，DataWorks 是平台/工程实践。两者同名术语可能有不同含义：

| 术语 | Kimball 语义 | DataWorks/工程语义 | 风险 |
|------|-------------|-------------------|------|
| 数据集市 (Data Mart) | 按业务过程、围绕一致性维度构建的交付 | 某一层的输出（如 ADS）或数据服务集合 | 同一句"属于数据集市"指代不同 |
| 维度 (Dimension) | 分析视角的描述表（含层级、SCD） | 泛化为码表/字典表/枚举表/主数据 | 破坏 SCD、角色扮演维等讨论 |
| 事实表 vs 宽表 | 有清晰粒度、可加性、维度外键 | 宽表可能只是拼接字段，不满足事实表定义 | 指标口径、可加性一致性变差 |
| 粒度 (Grain) | 建模第一原则（每行代表什么事件/快照） | 常被弱化为"日粒度/小时粒度" | 遗漏业务事件/实体唯一键约束 |

### 权威原则 (MUST)

| 术语类型 | 权威来源 | 示例 |
|----------|----------|------|
| 方法论/建模语义 | **Kimball 优先** | fact, dimension, grain, SCD, data mart, 可加性, 总线矩阵 |
| 平台/产品对象 | **DataWorks 优先** | 节点、调度、资源、DataWorks 产品名词 |
| 项目自定义 | **项目规范** | ODS/DWD/DWS/ADS 分层、内部口径 |

### 冲突处理规则 (SHOULD)

当出现同名异义或同义不同名时：

1. **同名异义** → 拆成两个 `term_id`，在 `notes` 写边界说明
2. **同义不同名** → 合并为一个 canonical 定义，其他进"同义词/别名"列
3. **未决争议** → `status=draft` + Owner 负责决策

**notes 字段标注格式（需要时）：**
`[authority=kimball|dataworks|project] [type=methodology|platform|project] <说明>`

Source: Codex 审阅建议

## Token Budget (更新：保守估算)

### Phase 1 预算原则 (MUST)

| 项目 | 规范 | 说明 |
|------|------|------|
| 保守估算 | **1 token ≈ 1 中文字符** | 含标点、空格、数字混排波动大，保守更安全 |
| 单文件上限 | **< 2000 tokens** | 可维护性红线，不等于运行时上限 |
| 超限处理 | 拆分为多个文件 | Phase 1 不引入自动索引工具 |

### 经验范围 (SHOULD，仅参考)

| 场景 | 估算 | 说明 |
|------|------|------|
| 常见情况 | 1 token ≈ 1-2 中文字符 | 因此 2000 tokens ≈ 2000-4000 中文字符 |
| 保守工程口径 | 2000 tokens ≈ 2500-3000 中文字符 | 3000-4000 属于偏乐观区间 |
| 英文内容 | 4 字符 ≈ 1 token | 标准估算 |

**重要提醒：** 任何上线/自动拼装以实际 tokenizer 统计为准，Phase 8 工具提供精确检查。

### Token Budget Template (docs/token-budget.md)

```markdown
# Token Budget Profile: default

| item | tokens | 说明 |
|------|-------:|------|
| model_context_window | 200000 | 模型上下文上限 |
| reserve_system | 2000 | 系统提示/框架提示预留 |
| reserve_tools | 1000 | 工具定义预留（如有） |
| reserve_history | 10000 | 对话历史预留（如多轮） |
| reserve_output | 4000 | 期望最大输出预留 |
| reserve_safety_buffer | 20000 | 安全缓冲（~10%） |
| available_for_inputs | 163000 | = context_window - 上述所有 reserve |

## File Caps（单文件治理上限）

| file_type | cap_tokens | 备注 |
|-----------|----------:|------|
| prompt_file | 2000 | 可维护性上限 |
| context_file | 2000 | 超过必须拆分 |
| example_block | 400 | few-shot 单块建议上限 |
```

Source: Codex 审阅建议

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 术语定义 | 自创术语解释 | Kimball Group 官方定义 | 行业标准，避免歧义 |
| 分层命名 | 自创分层缩写 | 阿里云 DataWorks 标准（ODS/DWD/DWS/ADS） | 中国数仓生态事实标准 |
| 提示结构 | 自创标签体系 | Claude XML 标签最佳实践 | 官方推荐，Claude 理解更好 |
| Token 估算 | 随意换算 | 保守 1:1 估算 + Phase 8 精确检查 | 避免运行时超限 |
| SCD 类型定义 | 自创描述 | Kimball SCD Type 1-6 标准定义 | 权威来源，避免混淆 |
| term_id 设计 | 中文主键 | ASCII snake_case 格式 | 稳定、可引用、无编码问题 |

**Key insight:** 数据仓库领域有成熟的术语体系和命名约定，不需要创新，需要准确引用和本地化。

## Common Pitfalls

### Pitfall 1: 中英术语翻译不一致

**What goes wrong:** 同一个术语在不同地方翻译不同（如 Dimension 译为"维度"或"维表"）
**Why it happens:** 多人编写、缺少统一标准
**How to avoid:**
- 使用 `term_id` 作为稳定引用
- 在术语表中用"同义词/别名"列记录所有叫法
- 明确一个 canonical 定义
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
**Why it happens:** 未监控文件大小、估算过于乐观
**How to avoid:**
- 单文件目标 < 1500 tokens，硬限制 < 2000 tokens
- 使用保守估算（1 token ≈ 1 中文字符）
- 长内容拆分为多个聚焦文件
**Warning signs:** 提示文件超过 2000 中文字符（保守）

### Pitfall 4: 目录结构过早固化

**What goes wrong:** 初始结构不适应后续 Phase 扩展
**Why it happens:** 未考虑完整 Phase 2-8 需求
**How to avoid:**
- 使用 scenarios/ 作为扩展点，每个 Phase 新增文件
- 保持顶层结构稳定（prompts/ + context/ + glossary/ + docs/）
- ≤3 层深度
**Warning signs:** 后续 Phase 需要重构目录结构

### Pitfall 5: 术语表覆盖不全

**What goes wrong:** 缺少关键术语，导致后续 Phase 需要回补
**Why it happens:** 只关注「显而易见」的术语
**How to avoid:**
- 覆盖四大领域：维度建模、分层体系、指标治理、SCD/增量
- 参考 Kimball 完整术语列表
- 预计 80+ 条目
**Warning signs:** 后续 Phase 频繁需要新增术语定义

### Pitfall 6: Kimball vs DataWorks 术语混用 (新增)

**What goes wrong:** 同名术语在不同语境下含义不同，导致沟通歧义
**Why it happens:** 未区分方法论术语和平台术语
**How to avoid:**
- 遵循术语权威原则（方法论用 Kimball，平台用 DataWorks）
- 在 notes 中标注 authority/type
- 同名异义时拆分为不同 term_id
**Warning signs:** 讨论时对同一术语有不同理解

## Code Examples

### Example 1: 术语表文件结构 (10 列格式)

```markdown
# 中英术语对照表

## 维度建模核心术语

| term_id | 中文 | English | 定义 | 示例 | 同义词/别名 | 领域 | Owner | 状态 | 更新日期 |
|---------|------|---------|------|------|-------------|------|-------|------|----------|
| modeling_fact_table | 事实表 | Fact Table | 存储业务过程度量值的表，包含外键和数值型事实 | `dwd_fact_orders` | 事实 | modeling | data-platform | active | 2026-01-30 |
| modeling_dimension | 维度表 | Dimension Table | 存储业务实体描述性属性的表，为事实表提供上下文 | `dim_customer` | 维表\|维度 | modeling | data-platform | active | 2026-01-30 |
| modeling_star_schema | 星型模型 | Star Schema | 一个事实表连接多个维度表的结构 | 订单事实 + 时间/客户/产品维度 | 星型架构 | modeling | data-platform | active | 2026-01-30 |
| modeling_grain | 粒度 | Grain | 事实表单行所代表的业务含义，是维度设计的核心决策 | "一行代表一个订单明细" | 颗粒度 | modeling | data-platform | active | 2026-01-30 |

## 分层体系术语

| term_id | 中文 | English | 定义 | 示例 | 同义词/别名 | 领域 | Owner | 状态 | 更新日期 |
|---------|------|---------|------|------|-------------|------|-------|------|----------|
| layer_ods | 操作数据层 | ODS (Operational Data Store) | 原始数据落地层，保持源系统结构 | `ods_mysql_orders` | 贴源层 | layer | data-platform | active | 2026-01-30 |
| layer_dwd | 明细数据层 | DWD (Data Warehouse Detail) | 清洗后的明细事实层 | `dwd_fact_order_details` | 明细层 | layer | data-platform | active | 2026-01-30 |
| layer_dws | 汇总数据层 | DWS (Data Warehouse Summary) | 轻度汇总的主题宽表 | `dws_order_daily` | 汇总层\|主题层 | layer | data-platform | active | 2026-01-30 |
| layer_ads | 应用数据层 | ADS (Application Data Service) | 面向应用的指标结果 | `ads_gmv_report` | 应用层\|数据服务层 | layer | data-platform | active | 2026-01-30 |
```

Source: Kimball Group + 阿里云 DataWorks + Codex 审阅

### Example 2: 提示文件结构 (Phase 1 最小 frontmatter)

```markdown
---
type: prompt
title: 退款原因归因（SQL + 解释）
status: active
version: 1.0.0
domain: sales
owner: data-platform
updated_at: 2026-01-30
includes:
  - context/global/sql-style
  - context/domains/sales
---

# 退款原因归因

<context>
你是一位资深数据分析师，专注于电商退款场景分析...
</context>

<instructions>
1. 分析退款原因分布
2. 生成 Hive SQL 查询
3. 解释计算逻辑
</instructions>

<output_format>
## SQL 查询
[生成的 SQL]

## 逻辑说明
[中文解释]
</output_format>
```

Source: Claude 官方 XML 标签最佳实践 + Codex 审阅

### Example 3: 命名规范文件结构

```markdown
---
type: context
title: 数据仓库命名规范
status: active
version: 1.0.0
domain: global
owner: data-platform
updated_at: 2026-01-30
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

## 文件命名规范

| 对象 | 规范 | 示例 |
|------|------|------|
| 目录名 | kebab-case | `data-warehouse/`, `sql-style/` |
| 文档文件名 | kebab-case | `order-refund.md`, `zh-en-mapping.md` |
| 数仓表/字段 | snake_case | `dwd_fact_orders`, `order_amt` |
| term_id | snake_case | `modeling_fact_table`, `layer_dwd` |
```

Source: dbt Style Guide + Hive Naming Conventions + Codex 审阅

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 自定义分层命名 | 标准化 ODS/DWD/DWS/ADS | 2020+ 阿里云普及 | 中国数仓生态统一术语 |
| 长篇系统提示 | 模块化提示 + 上下文分离 | 2024+ Claude 最佳实践 | 更好的可维护性和复用性 |
| 纯 Markdown 提示 | XML 标签 + Markdown | 2024+ Anthropic 推荐 | Claude 更准确解析结构 |
| 四栏术语表 | **10 列术语表（含治理字段）** | 2026 Codex 审阅 | 支持引用、Owner、状态管理 |
| 乐观 Token 估算 | **保守估算（1:1 中文）** | 2026 Codex 审阅 | 避免运行时超限 |

**Deprecated/outdated:**
- 驼峰命名（camelCase）：Hive 不区分大小写，snake_case 是正确选择
- 过度缩写（cust 代替 customer）：可读性优先于简洁性
- 单文件大型提示：拆分为模块化小文件更易维护
- 中文做术语主键：改用 ASCII term_id

## Resolved Decisions (原 Open Questions)

### 1. 术语表的领域划分粒度

**决策：** Phase 1 保留 4 个一级领域（维度建模、分层体系、指标治理、SCD/增量），后续 Phase 按需扩展

**扩展准则（满足任一条件拆分子域）：**
- Owner 不同：同一域内出现 2+ 个互相独立的 owner
- 规模阈值：某域术语数 > 200
- 口径冲突频繁：同名不同义每月出现 ≥ 3 次
- 复用方式不同：该组术语主要服务特定项目/产品线

### 2. 文件命名约定

**决策：** 文件/目录用 **kebab-case**，数仓对象用 **snake_case**

**理由：**
- kebab-case 路径友好、可读性强
- 与数仓对象命名解耦（文件是"资产"，表/字段是"对象"）
- `id` 一律用路径推导，稳定且不受文件名风格影响

### 3. Token 估算的准确性

**决策：** 保守估算 **1 token ≈ 1 中文字符**，Phase 8 提供精确检查

**规范表述：**
- 中文 token 密度以项目 tokenizer 实测为准
- 预算采用保守估算 + 15% buffer
- 任何经验换算仅用于人工预估，不作为硬门槛

## Phase 2-8 Extension Roadmap (新增)

### 延后字段（Phase 1 不要求）

| 字段 | 适用阶段 | 用途 |
|------|----------|------|
| `inputs/outputs` | Phase 8 | 工具化调用/批处理输入输出契约 |
| `model_prefs` | Phase 6-8 | 多模型差异化/线上稳定性调参 |
| `eval` | Phase 8 | 回归与门槛（suite/acceptance） |
| `safety/freshness` | Phase 6-8 | 数据安全分级与刷新策略 |
| `extensions` | 任意 | 扩展容器（或 `x_*` 前缀字段） |

### 延后目录（Phase 1 不创建）

| 目录 | 适用阶段 | 用途 |
|------|----------|------|
| `evals/` | Phase 8 | 回归用例、评分规约、基准集 |
| `scripts/` | Phase 8 | frontmatter 校验、token 统计、索引生成、导出 CSV |
| `templates/` | Phase 8 | 文件模板与脚手架 |
| `index.yaml` | Phase 2-4 | 可机器生成的资产索引（用于检索/RAG/组合） |

### 兼容性要求（为未来扩展保底）

- 术语表固定表头、`term_id` 稳定
- frontmatter 字段命名保持一致
- `id` 采用路径推导，确保后续可无痛生成索引与引用关系

## Sources

### Primary (HIGH confidence)
- [dbt How We Structure Projects](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview) - 项目结构最佳实践
- [dbt How We Style Models](https://docs.getdbt.com/best-practices/how-we-style/1-how-we-style-our-dbt-models) - 命名规范
- [Kimball Group Dimensional Modeling Techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/) - 维度建模术语权威来源
- [Claude XML Tags Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags) - 提示结构官方指南
- [阿里云 DataWorks 数仓分层](https://www.alibabacloud.com/help/en/dataworks/user-guide/data-warehouse-layering) - ODS/DWD/DWS/ADS 分层规范
- **Codex Review Session** (2026-01-30) - 规范精简、术语权威原则、Token 保守估算

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
- Architecture: HIGH - dbt 和阿里云有明确的结构规范，经 Codex 简化验证
- Terminology Authority: HIGH - Codex 审阅后建立明确权威原则
- Pitfalls: MEDIUM - 基于社区经验和最佳实践文档
- Token Limits: MEDIUM → HIGH - 改用保守估算后风险降低

**Research date:** 2026-01-30
**Codex review date:** 2026-01-30
**Valid until:** 2026-03-01（60 天，因为是稳定的基础设施领域）

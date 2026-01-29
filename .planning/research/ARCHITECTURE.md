# 架构研究：数仓提示系统

**领域：** 数仓提示系统（基于 GSD 架构扩展）
**研究日期：** 2026-01-30
**置信度：** HIGH（基于现有 GSD 架构分析 + 行业最佳实践）

## 系统总览

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         数仓提示系统架构                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   场景层    │  │   角色层    │  │   规范层    │  │   平台层    │    │
│  │ (scenarios) │  │  (roles)    │  │ (standards) │  │ (platforms) │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │            │
├─────────┴────────────────┴────────────────┴────────────────┴────────────┤
│                         提示组装引擎 (prompt assembler)                   │
│         按场景+角色+平台自动选择并注入 context 片段                       │
├─────────────────────────────────────────────────────────────────────────┤
│                         GSD 编排层 (orchestration)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  commands/  │  │   agents/   │  │ workflows/  │  │  templates/ │    │
│  │    gsd/     │  │    gsd-*    │  │   *.md      │  │    *.md     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────────────────────┤
│                         文件系统层 (file-based state)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  .planning/  │  │   prompts/   │  │   context/   │                   │
│  │  (项目状态)  │  │  (提示模板)  │  │  (领域知识)  │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 组件职责

| 组件 | 职责 | 与现有 GSD 的关系 |
|------|------|------------------|
| **prompts/** | 提示模板库（按场景/角色组织） | 新增，类似 templates/ 但面向数仓场景 |
| **context/** | 领域知识库（规范、方法论、平台约束） | 新增，作为提示的上下文注入源 |
| **commands/dw/** | 数仓专用斜杠命令 | 扩展现有 commands/gsd/ 模式 |
| **agents/dw-*** | 数仓专用代理 | 扩展现有 agents/gsd-* 模式 |
| **assembler** | 提示组装工具 | 新增工具，按场景组合 prompts + context |

## 推荐目录结构

### prompts/ 目录（提示模板库）

```
.claude/data-warehouse/prompts/
├── system/                          # 系统级提示（角色定义）
│   ├── dw-architect.md              # 数仓架构师角色
│   ├── dw-modeler.md                # 数据建模师角色
│   ├── dw-developer.md              # 数仓开发角色
│   └── dw-reviewer.md               # 代码评审角色
│
├── scenarios/                       # 场景提示（六大核心场景）
│   ├── review-model/                # 场景1：评审已有模型
│   │   ├── _scenario.md             # 场景说明+输入输出规格
│   │   ├── prompt.md                # 主提示模板
│   │   └── output-template.md       # 输出格式模板
│   │
│   ├── design-model/                # 场景2：设计新模型
│   │   ├── _scenario.md
│   │   ├── prompt.md
│   │   └── output-template.md
│   │
│   ├── generate-sql/                # 场景3：生成导数 SQL
│   │   ├── _scenario.md
│   │   ├── prompt.md
│   │   └── output-template.md
│   │
│   ├── define-metric/               # 场景4：指标口径定义
│   │   ├── _scenario.md
│   │   ├── prompt.md
│   │   └── output-template.md
│   │
│   ├── generate-dq/                 # 场景5：生成 DQ 规则
│   │   ├── _scenario.md
│   │   ├── prompt.md
│   │   └── output-template.md
│   │
│   └── analyze-lineage/             # 场景6：数据血缘分析
│       ├── _scenario.md
│       ├── prompt.md
│       └── output-template.md
│
└── review/                          # 评审专用提示
    ├── code-review.md               # SQL 代码评审
    ├── model-review.md              # 模型设计评审
    └── dq-review.md                 # DQ 规则评审
```

**目录结构说明：**

- **system/** — 角色级系统提示，定义 Claude 扮演的专家身份
- **scenarios/** — 按六大核心场景组织，每个场景独立目录
- **review/** — 评审类提示单独抽出，跨场景复用

### context/ 目录（领域知识库）

```
.claude/data-warehouse/context/
├── methodology/                     # 方法论知识
│   ├── kimball-modeling.md          # Kimball 维度建模核心概念
│   ├── fact-table-types.md          # 事实表类型（事务/周期/累积）
│   ├── dimension-types.md           # 维度类型（退化/角色扮演/杂项）
│   ├── scd-strategies.md            # SCD 策略（Type 1/2/3）
│   └── grain-declaration.md         # 粒度声明方法
│
├── layers/                          # 分层体系知识
│   ├── layer-overview.md            # ODS/DWD/DWS/ADS 总览
│   ├── ods-spec.md                  # ODS 层规范
│   ├── dwd-spec.md                  # DWD 层规范
│   ├── dws-spec.md                  # DWS 层规范
│   ├── ads-spec.md                  # ADS 层规范
│   └── layer-decision-tree.md       # 分层落点决策树
│
├── governance/                      # 数据治理知识
│   ├── naming-conventions.md        # 命名规范（表/字段/指标）
│   ├── dq-rules-catalog.md          # DQ 规则目录
│   ├── metric-standards.md          # 指标口径标准
│   └── lineage-definitions.md       # 血缘定义标准
│
├── platform/                        # 平台约束知识
│   ├── hive/                        # Hive 平台
│   │   ├── partitioning.md          # 分区策略
│   │   ├── incremental.md           # 增量策略
│   │   ├── file-formats.md          # 文件格式选择
│   │   └── performance.md           # 性能优化
│   │
│   └── dbt-hive/                    # dbt-hive 适配器
│       ├── capabilities.md          # 支持的功能
│       ├── limitations.md           # 不支持的功能（ephemeral/snapshots）
│       ├── materializations.md      # 物化策略
│       └── incremental-models.md    # 增量模型配置
│
└── glossary/                        # 术语表
    ├── zh-en-mapping.md             # 中英术语对照
    └── domain-terms.md              # 领域术语定义
```

**目录结构说明：**

- **methodology/** — Kimball 维度建模方法论，按概念拆分
- **layers/** — 数仓分层体系（ODS/DWD/DWS/ADS）规范
- **governance/** — 数据治理规范（命名、DQ、指标、血缘）
- **platform/** — 平台特定约束（Hive、dbt-hive）
- **glossary/** — 术语表，确保一致性

### 与现有 GSD 结构的整合

```
.claude/
├── commands/
│   ├── gsd/                         # 保留：GSD 通用命令
│   └── dw/                          # 新增：数仓专用命令
│       ├── review-model.md          # /dw:review-model
│       ├── design-model.md          # /dw:design-model
│       ├── generate-sql.md          # /dw:generate-sql
│       ├── define-metric.md         # /dw:define-metric
│       ├── generate-dq.md           # /dw:generate-dq
│       └── analyze-lineage.md       # /dw:analyze-lineage
│
├── agents/
│   ├── gsd-*.md                     # 保留：GSD 通用代理
│   ├── dw-modeler.md                # 新增：数据建模代理
│   ├── dw-reviewer.md               # 新增：模型评审代理
│   └── dw-developer.md              # 新增：SQL 生成代理
│
├── data-warehouse/                  # 新增：数仓专用资源根目录
│   ├── prompts/                     # 提示模板库（见上文）
│   └── context/                     # 领域知识库（见上文）
│
├── get-shit-done/                   # 保留：GSD 核心资源
│   ├── templates/
│   ├── references/
│   └── workflows/
│
└── settings.json                    # 保留：Claude 配置
```

**整合原则：**

1. **命名空间隔离** — `dw/` 与 `gsd/` 平行，互不干扰
2. **复用 GSD 基础设施** — agents、commands、workflows 模式保持一致
3. **独立资源目录** — `data-warehouse/` 作为数仓资源根目录

## 数据流

### 场景执行流程

```
用户调用 /dw:design-model
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│ 1. 命令解析 (commands/dw/design-model.md)                     │
│    - 解析用户输入（业务事件、指标、粒度）                      │
│    - 确定场景类型：design-model                                │
└───────────────────────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│ 2. 上下文组装 (prompt assembler)                              │
│    - 加载 system/dw-modeler.md（角色提示）                    │
│    - 加载 scenarios/design-model/prompt.md（场景提示）        │
│    - 注入 context/methodology/kimball-modeling.md             │
│    - 注入 context/layers/layer-decision-tree.md               │
│    - 注入 context/platform/hive/partitioning.md               │
└───────────────────────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│ 3. 代理执行 (agents/dw-modeler.md)                            │
│    - 执行建模推理                                              │
│    - 生成输出（星型设计、事实/维度定义、SCD 策略）            │
│    - 应用 output-template.md 格式化输出                        │
└───────────────────────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│ 4. 输出呈现                                                    │
│    - 结构化输出（Markdown 表格、代码块）                       │
│    - 可选：写入 .planning/ 或项目目录                          │
└───────────────────────────────────────────────────────────────┘
```

### 上下文注入规则

| 场景 | 必注入 context | 可选 context |
|------|---------------|--------------|
| review-model | methodology/*, governance/naming-conventions.md | platform/* |
| design-model | methodology/kimball-modeling.md, layers/*, governance/naming-conventions.md | platform/* |
| generate-sql | platform/*, governance/naming-conventions.md | methodology/* |
| define-metric | governance/metric-standards.md, glossary/* | methodology/* |
| generate-dq | governance/dq-rules-catalog.md, platform/dbt-hive/* | - |
| analyze-lineage | governance/lineage-definitions.md | methodology/* |

## 架构模式

### 模式 1: 可组合提示包（Composable Prompt Packs）

**什么是：** 将提示拆分为独立的、可组合的片段（角色、场景、上下文），运行时按需组装。

**何时使用：** 多场景、多角色、多平台的提示系统。

**权衡：**
- 优点：复用性高、易维护、支持多平台扩展
- 缺点：组装逻辑需要额外工具支持

**示例（组装逻辑伪代码）：**

```typescript
// 提示组装示例
function assemblePrompt(scenario: string, platform: string): string {
  const parts = [
    // 1. 系统角色
    readFile(`prompts/system/dw-${getRole(scenario)}.md`),

    // 2. 场景提示
    readFile(`prompts/scenarios/${scenario}/prompt.md`),

    // 3. 上下文注入
    ...getRequiredContext(scenario).map(path =>
      `<context name="${basename(path)}">\n${readFile(`context/${path}`)}\n</context>`
    ),

    // 4. 平台约束
    readFile(`context/platform/${platform}/capabilities.md`),
    readFile(`context/platform/${platform}/limitations.md`),

    // 5. 输出模板
    readFile(`prompts/scenarios/${scenario}/output-template.md`)
  ];

  return parts.join('\n\n');
}
```

### 模式 2: 渐进式上下文加载（Progressive Context Loading）

**什么是：** 先加载核心上下文，根据交互需要再加载详细上下文。

**何时使用：** 上下文量大、需要控制 token 消耗时。

**权衡：**
- 优点：节省 token、响应更快
- 缺点：需要多轮交互

**示例：**

```markdown
<!-- Phase 1: 核心上下文 -->
<context>
@context/methodology/kimball-modeling.md (摘要版)
@context/layers/layer-overview.md
</context>

<!-- Phase 2: 按需加载详细上下文 -->
用户选择 SCD Type 2 后：
<context>
@context/methodology/scd-strategies.md (完整版)
</context>
```

### 模式 3: 平台适配器模式（Platform Adapter Pattern）

**什么是：** 将平台无关的建模逻辑与平台特定的实现约束分离。

**何时使用：** 需要支持多个数仓平台（Hive、Snowflake、BigQuery 等）。

**权衡：**
- 优点：易于扩展新平台
- 缺点：需要维护多套平台约束文档

**示例目录结构：**

```
context/platform/
├── hive/
│   ├── capabilities.md
│   └── limitations.md
├── snowflake/                       # 未来扩展
│   ├── capabilities.md
│   └── limitations.md
└── bigquery/                        # 未来扩展
    ├── capabilities.md
    └── limitations.md
```

## 反模式

### 反模式 1: 单体提示（Monolithic Prompts）

**错误做法：** 将所有场景的提示写在一个巨大的 Markdown 文件中。

**为什么错：**
- 维护困难：修改一个场景可能影响其他场景
- 复用性差：无法按需组合
- Token 浪费：每次加载不需要的内容

**正确做法：** 按场景、角色、上下文拆分为独立文件，运行时组装。

### 反模式 2: 硬编码平台约束（Hardcoded Platform Constraints）

**错误做法：** 在场景提示中直接写入 "Hive 不支持 ephemeral" 等平台约束。

**为什么错：**
- 扩展新平台需要修改所有场景提示
- 平台约束与场景逻辑耦合

**正确做法：** 将平台约束独立到 `context/platform/` 目录，运行时注入。

### 反模式 3: 规范文档冗余（Duplicated Standards）

**错误做法：** 在多个场景提示中重复命名规范、DQ 规则等。

**为什么错：**
- 修改规范需要同步多处
- 容易出现不一致

**正确做法：** 规范文档单独存放在 `context/governance/`，通过引用注入。

### 反模式 4: 忽略输出模板（Missing Output Templates）

**错误做法：** 只定义输入提示，不定义输出格式。

**为什么错：**
- 输出格式不一致
- 难以自动化处理输出

**正确做法：** 每个场景配套 `output-template.md`，定义结构化输出格式。

## 构建顺序建议（Build Phase）

基于组件依赖关系，推荐以下构建顺序。

**命名说明：** 此处"Build Phase"指架构构建顺序，与FEATURES.md的"MVP Wave"（功能交付优先级）、PITFALLS.md的"Risk Phase"（风险阶段）是不同维度。

### Build Phase 1: 基础设施

**目标：** 建立目录结构和核心规范

**内容：**
1. 创建 `.claude/data-warehouse/` 目录结构
2. 编写 `context/glossary/zh-en-mapping.md`（术语对照表）
3. 编写 `context/governance/naming-conventions.md`（命名规范）
4. 编写 `context/layers/layer-overview.md`（分层总览）

**依赖：** 无

**理由：** 术语和命名规范是所有场景的基础，必须先建立。

### Build Phase 2: 方法论知识库

**目标：** 完善 Kimball 建模方法论文档

**内容：**
1. `context/methodology/kimball-modeling.md`
2. `context/methodology/fact-table-types.md`
3. `context/methodology/dimension-types.md`
4. `context/methodology/scd-strategies.md`
5. `context/methodology/grain-declaration.md`
6. `context/layers/` 各层规范

**依赖：** Phase 1（命名规范、术语表）

**理由：** 方法论是设计场景的核心依赖。

### Build Phase 3: 平台约束知识库

**目标：** 完善 Hive + dbt-hive 平台约束

**内容：**
1. `context/platform/hive/` 全部文件
2. `context/platform/dbt-hive/` 全部文件

**依赖：** Phase 1（命名规范）

**理由：** 平台约束是生成 SQL、DQ 规则的前提。

### Build Phase 4: 核心场景提示（设计新模型）

**目标：** 实现第一个完整场景

**内容：**
1. `prompts/system/dw-modeler.md`
2. `prompts/scenarios/design-model/` 全部文件
3. `commands/dw/design-model.md`
4. `agents/dw-modeler.md`

**依赖：** Phase 2（方法论）, Phase 3（平台约束）

**理由：** 设计新模型是六大场景中最核心的，实现后可验证整体架构。

### Build Phase 5: 评审场景提示

**目标：** 实现评审已有模型场景

**内容：**
1. `prompts/system/dw-reviewer.md`
2. `prompts/scenarios/review-model/` 全部文件
3. `prompts/review/` 评审提示
4. `commands/dw/review-model.md`
5. `agents/dw-reviewer.md`

**依赖：** Phase 2（方法论）, Phase 4（复用部分组件）

**理由：** 评审与设计互补，验证规范的应用。

### Build Phase 6: 治理场景提示（指标、DQ、血缘）

**目标：** 实现数据治理相关场景

**内容：**
1. `context/governance/` 完善
2. `prompts/scenarios/define-metric/` 全部文件
3. `prompts/scenarios/generate-dq/` 全部文件
4. `prompts/scenarios/analyze-lineage/` 全部文件
5. 对应 commands 和 agents

**依赖：** Phase 3（平台约束）, Phase 5（评审组件复用）

**理由：** 治理场景依赖平台约束和评审能力。

### Build Phase 7: SQL 生成场景

**目标：** 实现生成导数 SQL 场景

**内容：**
1. `prompts/system/dw-developer.md`
2. `prompts/scenarios/generate-sql/` 全部文件
3. `commands/dw/generate-sql.md`
4. `agents/dw-developer.md`

**依赖：** Phase 3（平台约束）, Phase 4（设计组件复用）

**理由：** SQL 生成依赖平台约束，放在后期可复用前期组件。

### Build Phase 8: 工具化

**目标：** 实现提示组装工具和规格校验工具

**内容：**
1. 提示组装工具（按场景组合 prompts + context）
2. 规格校验工具（检查模板字段完整性）

**依赖：** Phase 4-7（所有场景完成）

**理由：** 工具化需要基于完整的场景实现。

### 构建顺序总结图

```
Build Phase 1 (基础设施)
    │
    ├──────────────────┐
    ▼                  ▼
Build Phase 2 (方法论)    Build Phase 3 (平台约束)
    │                      │
    └────────┬─────────────┘
             ▼
       Build Phase 4 (设计新模型)
             │
    ┌────────┴────────┐
    ▼                 ▼
Build Phase 5 (评审)    Build Phase 7 (SQL生成)
    │
    ▼
Build Phase 6 (治理：指标/DQ/血缘)
    │
    ▼
Build Phase 8 (工具化)
```

## 知识自动滚动机制（Codex 讨论确认）

### 机制概述

数仓项目最有价值的是"项目特有语义"：口径、命名、主键、时间字段选择、维表更新策略、异常处理、DQ基线、已知坑。缺少知识沉淀会导致提示系统越用越"泛"，评审/问数反复问同样的问题。

**核心目标：** 将模型设计、评审、问数过程中积累的项目特有知识自动沉淀，让后续操作更准确。

### 知识存储架构（三层）

```
knowledge/                        # 知识资产根目录
├── business_glossary.yml         # 业务术语（人工维护，稳定）
├── metrics.yml                   # 指标口径定义（人工维护）
├── dimensions.yml                # 维度定义（人工维护）
├── naming_conventions.md         # 命名规范（人工维护）
├── decisions/                    # 经验知识（评审/设计回流）
│   ├── ADR-0001-order_time_field.md
│   └── ADR-0002-scd_strategy.md
├── artifacts/                    # 结构知识（自动生成）
│   ├── _index.json              # 可注入提示的倒排索引
│   └── model_summaries.json     # 模型摘要
└── reviews/                      # 评审结论归档
    ├── dim_customer_2026-01-30.yml
    └── dws_order_2026-01-29.yml
```

### 知识类型与来源

| 知识类型 | 存储位置 | 来源 | 更新频率 |
|---------|---------|------|---------|
| **业务术语** | `business_glossary.yml` | 人工定义 | 低（稳定） |
| **指标口径** | `metrics.yml` | 人工定义 + 场景4输出 | 中 |
| **维度定义** | `dimensions.yml` | 人工定义 + 场景2输出 | 中 |
| **命名规范** | `naming_conventions.md` | 人工定义 | 低（稳定） |
| **架构决策** | `decisions/ADR-*.md` | 评审/设计回流 | 按需 |
| **模型结构** | `artifacts/` | dbt artifacts 自动提取 | 每次 dbt docs generate |
| **评审结论** | `reviews/` | 场景1输出回流 | 每次评审 |

### 知识回流机制

**1. dbt artifacts 自动抽取（CI触发）**
```
每次 dbt docs generate 后：
1. 解析 manifest.json、catalog.json
2. 提取：模型依赖、列元数据、描述、tests
3. 生成 knowledge/artifacts/_index.json（倒排索引+摘要）
```

**2. 评审结论回流（场景1输出）**
```yaml
# knowledge/reviews/dim_customer_2026-01-30.yml
model: dim_customer
review_date: 2026-01-30
findings:
  - issue: "SCD 策略未明确"
    severity: P1
    suggestion: "建议使用 Type 2 处理地址变更"
    related_adr: ADR-0002
decisions:
  - "客户地址使用 SCD Type 2"
  - "客户名称使用 Type 1"
```

**3. 设计决策回流（场景2输出）**
```markdown
# knowledge/decisions/ADR-0007-order_time_field.md
# ADR-0007: 订单时间字段选择

## 背景
订单有 create_time、pay_time、ship_time 三个时间字段...

## 决策
使用 pay_time 作为订单事实表的主时间维度

## 理由
1. 业务核心关注已支付订单
2. 财务口径以支付时间为准
3. 避免与未支付订单混淆

## 适用范围
所有与订单金额相关的事实表
```

### 知识注入策略

**1. 提示构建时检索（RAG模式）**
- 按场景检索相关知识片段
- 只取相关模型、指标、维度、ADR
- 避免全量注入导致上下文膨胀

**2. 注入格式（来源追溯）**
```markdown
## Project Knowledge (ver: abc123)

### Relevant Metrics
- GMV: 已支付订单金额总和，口径详见 metrics.yml#gmv
  Source: knowledge/metrics.yml

### Relevant ADR
- ADR-0007: 订单时间字段使用 pay_time
  Source: knowledge/decisions/ADR-0007-order_time_field.md

### Model Dependencies
- dws_order_item_f depends on: ods_orders, dim_customer
  Source: knowledge/artifacts/_index.json
```

**3. 冲突处理策略**
- 优先级：显式 ADR > metrics.yml > 模型描述
- 检索命中多版本时，必须提示冲突并要求确认
- 写入 `ARCHITECTURE.md` 作为架构规范

### 知识治理

| 风险 | 预防措施 |
|------|----------|
| 知识污染/不一致 | 每条知识必须有 owner，CI 校验同名定义冲突 |
| 提示膨胀 | 检索限额，按场景裁剪，总量 <1000 tokens |
| 敏感信息泄露 | 回流前做脱敏与规则审核 |
| 知识过时 | 定期检查未引用的 ADR，标记废弃 |

### 与现有架构的关系

```
context/                # 通用领域知识（方法论、规范）
    ├── methodology/    # Kimball 方法论（通用）
    ├── platform/       # Hive/dbt 约束（通用）
    └── governance/     # 治理规范（通用）

knowledge/              # 项目特有知识（本次新增）
    ├── metrics.yml     # 项目指标口径
    ├── dimensions.yml  # 项目维度定义
    └── decisions/      # 项目架构决策
```

**组装时的优先级：** `knowledge/`（项目特有）> `context/`（通用规范）

---

## 集成点

### 与现有 GSD 工作流的集成

| GSD 工作流 | 数仓提示系统集成点 |
|-----------|-------------------|
| `/gsd:new-project` | 可选：初始化 data-warehouse/ 目录 |
| `/gsd:plan-phase` | 数仓场景可作为 phase 的一部分 |
| `/gsd:execute-phase` | 调用 `/dw:*` 命令执行数仓任务 |
| `/gsd:verify-work` | 使用 `/dw:review-model` 验证产出 |

### 与 dbt 项目的集成

| 数仓命令 | dbt 输出 |
|---------|---------|
| `/dw:design-model` | 生成 `models/*.sql` + `schema.yml` |
| `/dw:generate-sql` | 生成 `models/*.sql` |
| `/dw:generate-dq` | 生成 `tests/*.sql` 或 `schema.yml` 中的 tests |
| `/dw:define-metric` | 更新 `metrics/*.yml` |

## 来源

### 现有代码库分析

- GSD 架构分析：`.claude/agents/gsd-*.md`, `.claude/commands/gsd/`, `.claude/get-shit-done/`
- GSD 模板系统：`.claude/get-shit-done/templates/`
- GSD 工作流：`.claude/get-shit-done/workflows/`

### 行业最佳实践

- [dbt Project Structure Best Practices](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview) — dbt 官方项目结构指南
- [Prompt Versioning Best Practices](https://latitude-blog.ghost.io/blog/prompt-versioning-best-practices/) — 提示版本管理
- [Kimball Dimensional Modeling Techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/) — Kimball 官方方法论
- [MCP Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) — Anthropic MCP 协议

### 置信度说明

| 领域 | 置信度 | 说明 |
|-----|-------|------|
| 目录结构设计 | HIGH | 基于现有 GSD 架构和 dbt 最佳实践 |
| prompts/ 组织 | HIGH | 参考 MCP 协议和提示管理最佳实践 |
| context/ 组织 | HIGH | 基于 Kimball 方法论和国内数仓实践 |
| 构建顺序 | MEDIUM | 基于依赖分析，可能需要实践调整 |
| 工具化细节 | LOW | 具体实现方式待 Phase 8 深入研究 |

---
*架构研究：数仓提示系统*
*研究日期：2026-01-30*

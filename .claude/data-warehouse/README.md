# HiveMind 数仓助手

> Hive + dbt 数仓的中文提示系统

## 项目介绍

HiveMind 数仓助手是一套面向 Hive + dbt 数仓研发的中文提示系统，提供六大核心场景的标准化输出能力：

1. **设计新模型** — 根据业务事件设计星型模型 + dbt 模板
2. **评审已有模型** — 五维度评审 + 问题分级 + 修复建议
3. **生成导数 SQL** — 口径规范 SQL + 性能优化 + 分区裁剪
4. **定义指标口径** — 指标规范化 + dbt Semantic Layer YAML
5. **生成 DQ 规则** — dbt tests 自动生成 + 字段类型驱动
6. **数据血缘分析** — 表/字段级追踪 + 变更影响评估

**核心价值：** 用一套可组合的中文提示包，把 Hive + dbt 数仓的六类高频任务标准化为可复用、可追溯、带质量门禁的输出。

---

## 快速开始

### 1. 安装依赖

```bash
cd .claude/data-warehouse
npm install
```

### 2. 验证安装

```bash
# 测试组装脚本
node scripts/assemble.js design-new-model --json

# 测试校验脚本
node scripts/validate.js design-new-model --help
```

### 3. 使用命令

在 Claude Code 中使用 `/dw:*` 命令系列即可开始工作。

---

## 命令列表

### 场景命令（6 个）

| 命令 | 描述 | 参数示例 |
|------|------|----------|
| `/dw:design` | 设计新的数仓模型（事实表/维度表） | `[业务事件描述]` |
| `/dw:review` | 评审已有数仓模型的规范性和质量 | `[模型代码或文件路径]` |
| `/dw:generate-sql` | 根据取数需求生成 Hive SQL | `[取数需求描述]` |
| `/dw:define-metric` | 定义标准化指标并生成 Semantic Layer 配置 | `[指标名称和业务描述]` |
| `/dw:generate-dq` | 根据模型定义生成 dbt tests 数据质量规则 | `[模型名称或字段清单]` |
| `/dw:analyze-lineage` | 分析数据血缘关系并评估变更影响 | `[SQL 代码或变更描述]` |

### 工具命令（3 个）

| 命令 | 描述 | 参数示例 |
|------|------|----------|
| `/dw:assemble` | 根据场景组装完整提示 | `<scenario> [--context-level=standard] [--json]` |
| `/dw:validate` | 校验场景输入/输出是否符合规格 | `<scenario> --input=<file> [--output=<file>] [--strict]` |
| `/dw:new-scenario` | 创建新场景的脚手架文件 | `<scenario-id> [--name="场景名称"]` |

---

## 目录结构

```
.claude/data-warehouse/
│
├── README.md                    # 本文件：工具使用指南
├── package.json                 # Node.js 项目配置
│
├── config/                      # 配置文件
│   ├── scenarios.yaml           # 场景配置映射（6 个场景）
│   ├── platforms.yaml           # 平台配置（Hive + dbt-hive）
│   └── assembly-rules.yaml      # 组装规则（token 预算、优先级）
│
├── context/                     # 可组装上下文库
│   ├── methodology/             # 方法论文档
│   │   ├── dimensional-modeling.md       # Kimball 维度建模（完整版）
│   │   ├── dimensional-modeling-core.md  # Kimball 维度建模（精简版）
│   │   ├── fact-table-types.md           # 事实表类型指南
│   │   ├── fact-table-types-core.md      # 事实表类型（精简版）
│   │   ├── scd-strategies.md             # SCD 策略指南
│   │   └── scd-strategies-core.md        # SCD 策略（精简版）
│   │
│   ├── layers/                  # 分层体系
│   │   ├── layering-system.md            # 分层体系规范（完整版）
│   │   └── layering-system-core.md       # 分层体系（精简版）
│   │
│   ├── platform/                # 平台约束
│   │   ├── hive-constraints.md           # Hive 约束（完整版）
│   │   ├── hive-constraints-core.md      # Hive 约束（精简版）
│   │   ├── dbt-hive-limitations.md       # dbt-hive 限制（完整版）
│   │   ├── dbt-hive-limitations-core.md  # dbt-hive 限制（精简版）
│   │   └── incremental-strategies.md     # 增量策略指南
│   │
│   └── governance/              # 治理规范
│       ├── metrics-core.md               # 指标规范
│       └── dq-rules-core.md              # DQ 规则规范
│
├── docs/                        # 项目文档
│   ├── naming.md                # 命名规范（完整版）
│   ├── naming-core.md           # 命名规范（精简版）
│   ├── prompting.md             # 提示规范
│   ├── token-budget.md          # Token 预算规范
│   └── extending.md             # 扩展开发指南
│
├── glossary/                    # 术语表
│   └── terms.md                 # 中英术语对照表（89 条）
│
├── prompts/                     # 提示文件
│   └── scenarios/               # 场景提示
│       ├── design-new-model/    # 设计新模型
│       │   ├── prompt.md                 # 主提示文件
│       │   ├── output-template.md        # 输出模板
│       │   ├── input-template.md         # 输入模板
│       │   └── examples/                 # 案例库
│       │
│       ├── review-existing-model/        # 评审已有模型
│       │   ├── prompt.md
│       │   ├── output-template.md
│       │   ├── input-template.md
│       │   ├── issue-classification.md   # 问题分级
│       │   ├── review-checklist.md       # 检查清单
│       │   ├── fix-suggestions.md        # 修复建议
│       │   └── examples/
│       │
│       ├── generate-sql/                 # 生成导数 SQL
│       │   ├── prompt.md
│       │   ├── output-template.md
│       │   ├── input-template.md
│       │   ├── time-expressions.md       # 时间表达式指南
│       │   └── examples/
│       │
│       ├── define-metrics/               # 定义指标
│       │   ├── prompt.md
│       │   ├── output-template.md
│       │   ├── input-template.md
│       │   └── examples/
│       │
│       ├── generate-dq-rules/            # 生成 DQ 规则
│       │   ├── prompt.md
│       │   ├── output-template.md
│       │   ├── input-template.md
│       │   └── examples/
│       │
│       └── analyze-lineage/              # 血缘分析
│           ├── prompt.md
│           ├── output-template.md
│           ├── input-template.md
│           ├── impact-analysis-template.md  # 影响评估模板
│           └── examples/
│
├── schemas/                     # JSON Schema
│   ├── input/                   # 输入 Schema（6 个）
│   │   ├── design-new-model.schema.json
│   │   ├── review-existing-model.schema.json
│   │   ├── generate-sql.schema.json
│   │   ├── define-metrics.schema.json
│   │   ├── generate-dq-rules.schema.json
│   │   └── analyze-lineage.schema.json
│   │
│   └── output/                  # 输出 Schema（6 个）
│       ├── design-new-model.schema.json
│       ├── review-existing-model.schema.json
│       ├── generate-sql.schema.json
│       ├── define-metrics.schema.json
│       ├── generate-dq-rules.schema.json
│       └── analyze-lineage.schema.json
│
└── scripts/                     # 辅助脚本
    ├── assemble.js              # 提示组装脚本
    ├── validate.js              # 规格校验脚本
    └── scaffold.js              # 脚手架生成脚本
```

---

## 使用指南

### 场景 1：设计新模型

**目标：** 根据业务事件设计星型模型，输出 DDL + dbt 模板。

**使用方法：**

```bash
# 方式一：直接描述业务事件
/dw:design 电商订单下单事件，需要分析订单金额、商品数量，支持按用户、商品、城市维度分析

# 方式二：交互式输入
/dw:design
# 系统会引导你提供业务事件、粒度、指标需求等信息
```

**两段式交互流程：**

1. **Stage 1：规格确认**
   - 系统分析输入，输出建模规格书
   - 确认事实表类型（事务/周期快照/累积快照）
   - 确认维度表列表和 SCD 策略
   - 确认分层落点（DWD/DWS）

2. **Stage 2：产物生成**
   - 用户确认规格后，生成完整产物
   - 包含 DDL、schema.yml、dbt SQL 模型
   - 使用 `### File: {path}` 格式标记可落盘文件

**输出示例：**

```yaml
# Stage 1 规格书摘要
粒度声明: 单笔订单行为（一行 = 一笔订单）
事实表类型: 事务事实表
维度表:
  - dim_user（SCD Type 2）
  - dim_product（SCD Type 1）
  - dim_city（SCD Type 1）
分层落点: DWD
```

---

### 场景 2：评审已有模型

**目标：** 对现有 SQL/dbt 模型进行规范性评审。

**使用方法：**

```bash
# 方式一：指定文件路径
/dw:review models/staging/stg_orders.sql

# 方式二：直接粘贴代码
/dw:review
# 然后粘贴待评审的 SQL 代码
```

**评审维度（五大类）：**

| 维度 | 检查项示例 |
|------|-----------|
| 命名规范 | 表名前缀、字段类型后缀、大小写规范 |
| 分层引用 | 禁止跨层违规引用、层间依赖正确性 |
| 粒度与主键 | 粒度声明、主键唯一性、外键完整性 |
| 字段类型 | 类型匹配、注释完整性、默认值合理性 |
| dbt 配置 | description、tests、materialization |

**问题分级：**

- **P0 严重：** 数据质量问题（粒度不清、主键重复）— 阻断上线
- **P1 高优：** 设计缺陷（命名不符、SCD 策略不合理）
- **P2 中优：** 风险提示（度量可加性未标记、分区键可优化）
- **P3 低优：** 代码风格（命名过长、注释可完善）

**质量分计算：**
- 初始 100 分
- P1 扣 10 分，P2 扣 3 分，P3 扣 1 分
- P0 > 0 则直接判定为"不通过"

---

### 场景 3：生成导数 SQL

**目标：** 根据取数需求生成规范的 Hive SQL。

**使用方法：**

```bash
# 方式一：描述取数需求
/dw:generate-sql 统计最近 30 天各城市的订单总额，按城市降序排列

# 方式二：交互式输入
/dw:generate-sql
# 系统会询问取数目标、数据源、过滤条件、时间窗口等
```

**8 类必问项（Stage 1 确认）：**

| 类别 | 说明 |
|------|------|
| A. 取数目标 | 期望获取的数据或分析结果 |
| B. 数据源表 | 涉及的源表清单 |
| C. 分区范围 | 分区过滤条件 |
| D. 时间字段 | 业务时间字段（非分区） |
| E. 过滤条件 | 业务过滤逻辑 |
| F. SCD2 语义 | 维度表是否需要历史版本锁定 |
| G. 聚合粒度 | 分组维度和聚合函数 |
| H. 成本预估 | 预估扫描数据量 |

**输出内容：**
- Hive SQL（带中文注释）
- Validator 自检结果（P0/P1/P2 分级）
- 口径说明文档
- 性能提示
- 依赖说明

---

### 场景 4：定义指标

**目标：** 规范化定义指标，生成 dbt Semantic Layer YAML。

**使用方法：**

```bash
# 方式一：描述指标
/dw:define-metric 订单总额，计算所有完成订单的金额总和

# 方式二：交互式输入
/dw:define-metric
```

**指标分类（三分法）：**

| 类型 | 定义 | MetricFlow 映射 |
|------|------|-----------------|
| 原子指标 | 基于单个度量的简单聚合 | type: simple |
| 派生指标 | 基于其他指标的计算（加减乘除） | type: derived/ratio |
| 复合指标 | 多指标组合的复杂计算 | 嵌套 derived |

**输出内容：**
- 指标规格书（ID、名称、分类、公式、源表）
- dbt Semantic Layer YAML（semantic_models + metrics）
- 口径说明文档

---

### 场景 5：生成 DQ 规则

**目标：** 为表/模型自动生成 dbt tests 配置。

**使用方法：**

```bash
# 方式一：指定模型名称
/dw:generate-dq dwd_fact_orders

# 方式二：交互式输入
/dw:generate-dq
```

**字段类型驱动规则推断：**

| 字段后缀 | 自动生成规则 |
|---------|-------------|
| `_id` | unique, not_null |
| `_amt` / `_amount` | not_null, 范围检测（>= 0） |
| `_cnt` / `_count` | not_null, 范围检测（>= 0，整数） |
| `_status` | accepted_values |
| `_date` / `_time` | not_null, 时间格式检测 |
| `_rate` / `_ratio` | 范围检测（0-1 或 0-100） |

**分层阈值适配：**

| 层级 | warn_if | error_if |
|------|---------|----------|
| ODS | > 5% | > 10% |
| DWD/DWS | > 1% | > 5% |
| ADS | > 0% | > 1% |

---

### 场景 6：血缘分析

**目标：** 分析 SQL/dbt 模型的表级和字段级血缘关系。

**使用方法：**

```bash
# 方式一：分析 SQL 代码
/dw:analyze-lineage
# 粘贴 SQL 代码

# 方式二：变更影响评估
/dw:analyze-lineage dim_city.city_name 字段类型从 VARCHAR(50) 变更为 VARCHAR(100)
```

**三段式交互：**

1. **Stage 1：表级血缘**
   - 识别 ref()/source()/原生表名
   - 输出表级依赖图（Mermaid）

2. **Stage 2：字段级血缘**
   - 字段映射表（源字段 → 目标字段）
   - 边级置信度（A/B/C/D）

3. **Stage 3：变更影响评估**
   - 受影响的直接下游
   - 受影响的间接下游
   - 风险评估和建议

**边级置信度：**

| 等级 | 定义 | 典型场景 |
|------|------|----------|
| A 高 | 确定性映射 | 直接赋值、简单计算 |
| B 中 | 高置信度推断 | 类型转换、重命名 |
| C 低 | 需人工确认 | 复杂计算、条件逻辑 |
| D 不确定 | 无法推断 | 动态 SQL、UDF |

---

## 工具命令详解

### /dw:assemble — 组装提示

根据场景配置组装完整提示包，包含系统提示、上下文、场景提示。

```bash
# 组装设计场景提示（标准上下文）
/dw:assemble design-new-model

# 组装评审场景提示（完整上下文）
/dw:assemble review-existing-model --context-level=full

# JSON 格式输出（含 token 统计）
/dw:assemble generate-sql --json
```

**上下文级别：**
- `minimal`：仅必需上下文
- `standard`：标准上下文（默认）
- `full`：包含所有可选上下文

### /dw:validate — 校验规格

校验用户输入或模型输出是否符合场景规格。

```bash
# 校验设计场景输入
/dw:validate design-new-model --input=./my-input.yaml

# 校验评审场景输出
/dw:validate review-existing-model --output=./review-result.md

# 严格模式（WARNING 也阻断）
/dw:validate generate-sql --input=./query.yaml --strict
```

**校验级别：**
- `CRITICAL`：必填缺失 → 阻断
- `WARNING`：规范不符 → 警告
- `INFO`：建议 → 提示

### /dw:new-scenario — 创建新场景

为新场景生成完整的脚手架文件。

```bash
# 创建新场景（使用 ID 作为名称）
/dw:new-scenario my-custom-scenario

# 创建新场景（指定中文名称）
/dw:new-scenario data-profiling --name="数据画像分析"
```

**生成内容：**
- `prompt.md` — 场景提示主文件
- `output-template.md` — 输出模板
- `input-template.md` — 输入模板
- `examples/` — 案例目录
- `schemas/input/{scenario}.schema.json` — 输入 Schema
- `schemas/output/{scenario}.schema.json` — 输出 Schema

并自动更新 `config/scenarios.yaml`。

---

## 技术栈

| 组件 | 版本/规范 |
|------|----------|
| 目标平台 | Hive 4.x |
| dbt 适配器 | dbt-hive 1.10.0 |
| 建模方法论 | Kimball 维度建模 |
| 分层体系 | ODS / DWD / DWS / ADS |
| 数据时效 | 离线 T+1 |
| 增量策略 | insert_overwrite 分区回刷 |
| SCD2 实现 | 手动实现（无原生 Snapshots） |

**关键约束：**
- 代码标识符英文，输出中文
- 单个提示 < 2000 tokens
- 组装后总提示 < 4000 tokens

---

## 扩展开发

如需添加新场景或新平台支持，请参阅 [扩展开发指南](docs/extending.md)。

主要内容：
- 添加新场景（脚手架方式 / 手动创建）
- 添加新平台支持
- 配置文件说明
- 测试新场景

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [命名规范](docs/naming.md) | 表名、字段名、指标名命名规范 |
| [提示规范](docs/prompting.md) | 提示文件编写规范 |
| [Token 预算](docs/token-budget.md) | Token 限制与优化策略 |
| [术语表](glossary/terms.md) | 中英术语对照表（89 条） |
| [扩展指南](docs/extending.md) | 添加新场景/新平台 |

---

## 版本信息

- **版本：** 1.0.0
- **更新日期：** 2026-02-01
- **Node.js 要求：** >= 22.x

---

*HiveMind 数仓助手 — Hive + dbt 数仓的中文提示系统*

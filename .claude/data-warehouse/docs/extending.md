# 扩展开发指南

本文档说明如何扩展 HiveMind 数仓助手，包括添加新场景和添加新平台支持。

---

## 目录

1. [添加新场景](#添加新场景)
   - [方式一：使用脚手架（推荐）](#方式一使用脚手架推荐)
   - [方式二：手动创建](#方式二手动创建)
   - [场景设计原则](#场景设计原则)
2. [添加新平台支持](#添加新平台支持)
   - [创建平台上下文](#创建平台上下文)
   - [更新平台配置](#更新平台配置)
   - [更新组装规则](#更新组装规则)
3. [配置文件说明](#配置文件说明)
   - [scenarios.yaml](#scenariosyaml)
   - [platforms.yaml](#platformsyaml)
   - [assembly-rules.yaml](#assembly-rulesyaml)
4. [测试新场景](#测试新场景)
5. [常见问题](#常见问题)

---

## 添加新场景

### 方式一：使用脚手架（推荐）

使用 `/dw:new-scenario` 命令自动生成场景脚手架文件。

```bash
# 基本用法
/dw:new-scenario <scenario-id> [--name="场景中文名称"]

# 示例：创建数据画像分析场景
/dw:new-scenario data-profiling --name="数据画像分析"
```

脚手架会自动生成以下文件：

| 文件 | 说明 |
|------|------|
| `prompts/scenarios/{id}/prompt.md` | 场景提示主文件 |
| `prompts/scenarios/{id}/output-template.md` | 输出模板 |
| `prompts/scenarios/{id}/input-template.md` | 输入模板 |
| `prompts/scenarios/{id}/examples/` | 案例目录 |
| `schemas/input/{id}.schema.json` | 输入 JSON Schema |
| `schemas/output/{id}.schema.json` | 输出 JSON Schema |

并自动更新 `config/scenarios.yaml`。

**生成后需要完成的工作：**

1. 编辑 `prompt.md`，填充场景核心逻辑
2. 定义 `input-template.md` 和 `output-template.md`
3. 完善 JSON Schema 校验规则
4. 编写至少 1 个案例
5. 创建对应的 `/dw:{id}` 命令文件

---

### 方式二：手动创建

如果需要更精细的控制，可以手动创建场景文件。

#### Step 1：创建目录结构

```bash
mkdir -p prompts/scenarios/{scenario-id}/examples
```

#### Step 2：创建 prompt.md

```markdown
---
id: {scenario-id}
name: 场景中文名称
version: 1.0.0
type: scenario
level: scenario
token_budget: 1500
includes:
  - context/platform/hive-constraints-core
  - context/platform/dbt-hive-limitations-core
  - docs/naming-core
applies_to:
  - {scenario-id}
schema_version: 1
---

# 场景中文名称

## 角色定义

你是一个专业的数仓架构师，擅长 [场景描述] 相关的任务。

## 任务目标

根据用户输入，完成 [任务描述]，输出符合规范的结果。

## 输入要求

### 必填信息

- **信息 A:** [描述必填信息 A]
- **信息 B:** [描述必填信息 B]

### 可选信息

- **信息 C:** [描述可选信息 C]

## 处理流程

### Stage 1: 确认需求

1. 分析用户输入
2. 确认关键信息
3. 输出规格确认

### Stage 2: 生成产物

1. 根据确认的规格生成产物
2. 应用质量检查
3. 输出最终结果

## 约束条件

- 遵循 Hive 平台约束
- 遵循 dbt-hive 适配器限制
- 遵循命名规范

## 输出格式

参见 output-template.md
```

#### Step 3：创建 output-template.md

```markdown
---
id: {scenario-id}-output
name: 场景输出模板
version: 1.0.0
type: output-template
schema_version: 1
---

# 场景输出模板

## Stage 1: 规格确认

```yaml
scenario: {scenario-id}
stage: 1
status: pending_confirmation

specification:
  key_info_a: "[确认的信息 A]"
  key_info_b: "[确认的信息 B]"

confirmation_required:
  - "[需要用户确认的事项]"
```

---

## Stage 2: 完整产物

### 2.1 主要输出

```yaml
scenario: {scenario-id}
stage: 2
status: complete

output:
  content: |
    [产物内容]
```

### 2.2 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 规范符合性 | PASS/FAIL | [说明] |
| 完整性 | PASS/FAIL | [说明] |

---

## 输出交付约定

```
### File: [output-path]
[文件内容]
```
```

#### Step 4：创建 input-template.md

```markdown
---
id: {scenario-id}-input
name: 场景输入模板
version: 1.0.0
type: input-template
schema_version: 1
---

# 场景输入模板

## 输入格式

```yaml
schema_version: 1

# 必填字段
required_field_a: ""     # 必填信息 A
required_field_b: ""     # 必填信息 B

# 可选字段
optional_field_c: ""     # 可选信息 C
```

## 字段说明

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| required_field_a | 是 | string | 必填信息 A |
| required_field_b | 是 | string | 必填信息 B |
| optional_field_c | 否 | string | 可选信息 C |
```

#### Step 5：创建 JSON Schema

**输入 Schema (`schemas/input/{scenario-id}.schema.json`)：**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "dw:{scenario-id}:input:v1",
  "title": "场景名称 Input",
  "description": "场景输入规格",
  "type": "object",
  "required": ["schema_version", "required_field_a", "required_field_b"],
  "properties": {
    "schema_version": {
      "const": 1,
      "description": "Schema 版本",
      "errorMessage": "schema_version 必须为 1"
    },
    "required_field_a": {
      "type": "string",
      "minLength": 1,
      "description": "必填信息 A",
      "errorMessage": "required_field_a 不能为空"
    },
    "required_field_b": {
      "type": "string",
      "minLength": 1,
      "description": "必填信息 B",
      "errorMessage": "required_field_b 不能为空"
    },
    "optional_field_c": {
      "type": "string",
      "description": "可选信息 C"
    }
  },
  "additionalProperties": false
}
```

**输出 Schema (`schemas/output/{scenario-id}.schema.json`)：**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "dw:{scenario-id}:output:v1",
  "title": "场景名称 Output",
  "description": "场景输出规格",
  "type": "object",
  "required": ["schema_version", "scenario", "stage", "status"],
  "properties": {
    "schema_version": {
      "const": 1,
      "description": "Schema 版本"
    },
    "scenario": {
      "const": "{scenario-id}",
      "description": "场景 ID"
    },
    "stage": {
      "type": "integer",
      "enum": [1, 2],
      "description": "阶段编号"
    },
    "status": {
      "type": "string",
      "enum": ["pending_confirmation", "complete", "error"],
      "description": "状态"
    }
  },
  "additionalProperties": true
}
```

#### Step 6：更新 scenarios.yaml

在 `config/scenarios.yaml` 中添加新场景配置：

```yaml
scenarios:
  # ... 现有场景 ...

  - id: {scenario-id}
    name: 场景中文名称
    description: |
      场景描述，说明场景的用途和输出
    prompt_file: prompts/scenarios/{scenario-id}/prompt.md
    output_template: prompts/scenarios/{scenario-id}/output-template.md
    requires_context:
      - context/platform/hive-constraints-core
      - context/platform/dbt-hive-limitations-core
      - docs/naming-core
    max_tokens: 1500
    examples_dir: prompts/scenarios/{scenario-id}/examples
```

#### Step 7：创建命令文件

在 `.claude/commands/dw/` 目录下创建 `{scenario-id}.md`：

```markdown
---
name: dw:{scenario-id}
description: 场景中文描述
argument-hint: "[参数提示]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
根据用户输入完成 [任务描述]。

**输出产物：**
- 产物 1
- 产物 2
</objective>

<execution_context>
@./.claude/data-warehouse/prompts/scenarios/{scenario-id}/prompt.md
@./.claude/data-warehouse/prompts/scenarios/{scenario-id}/output-template.md
@./.claude/data-warehouse/prompts/scenarios/{scenario-id}/input-template.md
</execution_context>

<context>
# 运行时上下文
@./.claude/data-warehouse/context/platform/hive-constraints-core.md
@./.claude/data-warehouse/context/platform/dbt-hive-limitations-core.md
@./.claude/data-warehouse/docs/naming-core.md
</context>

<process>
1. **解析用户输入**
   - 如果 $ARGUMENTS 非空，解析为需求
   - 如果为空，询问必要信息

2. **执行两段式交互**
   - Stage 1：输出规格确认
   - 等待用户确认
   - Stage 2：生成完整产物

3. **输出产物**
   - 按 output-template.md 格式输出
   - 使用 `### File: {path}` 标记可落盘文件
</process>

<success_criteria>
- [ ] 输入已解析
- [ ] 规格已确认
- [ ] 产物完整
</success_criteria>
```

---

### 场景设计原则

设计新场景时，请遵循以下原则：

#### 1. 单一职责

每个场景专注于一个核心任务，避免功能过于复杂。

| 好的设计 | 不好的设计 |
|---------|-----------|
| 设计新模型 | 设计并评审模型 |
| 生成 DQ 规则 | 生成并执行 DQ 规则 |

#### 2. 两段式交互

所有场景都应采用两段式交互模式：

- **Stage 1：规格确认** — 分析输入，输出规格书，等待用户确认
- **Stage 2：产物生成** — 根据确认的规格生成完整产物

这种模式可以减少返工，先确认再生成代码。

#### 3. Token 预算

- 单个提示文件 < 2000 tokens
- 组装后总提示 < 4000 tokens（含上下文）
- 使用精简版上下文文件（*-core.md）

#### 4. 中文输出

- 所有提示和输出都使用中文
- 代码标识符保持英文
- 中英术语参考 `glossary/terms.md`

#### 5. 输出交付契约

使用 `### File: {path}` 格式标记可落盘文件：

```markdown
### File: models/staging/stg_orders.sql
```sql
-- 模型内容
SELECT ...
```
```

---

## 添加新平台支持

### 创建平台上下文

#### 1. 创建完整版上下文

在 `context/platform/` 目录下创建平台约束文档：

```markdown
---
id: {platform-id}-constraints
name: {平台名称} 约束
version: 1.0.0
type: platform
platform: {platform-id}
token_budget: 2000
schema_version: 1
---

# {平台名称} 平台约束

## 概述

[平台简介]

## 核心约束

### 约束 1: [约束名称]

**描述：** [约束说明]

**影响：** [对数仓设计的影响]

**规避方案：** [如何处理]

### 约束 2: [约束名称]

...

## 最佳实践

...

## 参考资料

- [官方文档链接]
```

#### 2. 创建精简版上下文（*-core.md）

精简版用于运行时注入，控制在 600-1000 tokens：

```markdown
---
id: {platform-id}-constraints-core
name: {平台名称} 约束（精简版）
version: 1.0.0
type: platform-core
platform: {platform-id}
source: context/platform/{platform-id}-constraints.md
token_budget: 800
schema_version: 1
---

# {平台名称} 核心约束

## 关键约束速查

| 约束 | 说明 | 规避方案 |
|------|------|---------|
| 约束 1 | ... | ... |
| 约束 2 | ... | ... |

## 决策树

1. 如果 [条件]：[方案 A]
2. 否则：[方案 B]
```

### 更新平台配置

在 `config/platforms.yaml` 中添加新平台：

```yaml
platforms:
  # ... 现有平台 ...

  - id: {platform-id}
    name: 平台中文名称
    description: |
      平台描述
    version_supported: "x.x"

    # 核心约束文件（精简版）
    context_files:
      - path: context/platform/{platform-id}-constraints-core.md
        description: 平台核心约束
        level: always
        estimated_tokens: 800

    # 完整版文档（按需加载）
    full_docs:
      - path: context/platform/{platform-id}-constraints.md
        description: 平台完整约束
        level: onDemand
        estimated_tokens: 2000

    # 平台特定配置
    config:
      partition:
        default_column: dt
        default_format: "yyyy-MM-dd"

      materialization:
        default: incremental
        supported:
          - table
          - view
          - incremental
```

### 更新组装规则

如果新平台有特殊的上下文加载需求，更新 `config/assembly-rules.yaml`：

```yaml
context_levels:
  always:
    # 添加新平台的 always 级别上下文
    - path: context/platform/{platform-id}-constraints-core.md
      description: 平台核心约束
      estimated_tokens: 800

  onDemand:
    # 添加新平台的按需加载上下文
    - path: context/platform/{platform-id}-special-feature.md
      description: 平台特殊功能
      trigger_keywords: [关键词1, 关键词2]
      estimated_tokens: 600
```

### 平台文档规范

| 文档类型 | 文件命名 | Token 预算 | 用途 |
|---------|---------|-----------|------|
| 完整版约束 | `{platform-id}-constraints.md` | 1500-2500 | 详细参考文档 |
| 精简版约束 | `{platform-id}-constraints-core.md` | 600-1000 | 运行时注入 |
| 能力边界 | `{platform-id}-limitations.md` | 1500-2000 | 不支持功能清单 |
| 增量策略 | `{platform-id}-incremental.md` | 1000-1500 | 增量更新指南 |

---

## 配置文件说明

### scenarios.yaml

场景配置映射文件，定义 6 个核心场景的配置。

```yaml
schema_version: 1

scenarios:
  - id: design-new-model              # 场景 ID（kebab-case）
    name: 设计新模型                   # 中文名称
    description: |                    # 场景描述
      根据业务事件设计星型模型
    prompt_file: prompts/scenarios/design-new-model/prompt.md
    output_template: prompts/scenarios/design-new-model/output-template.md
    requires_context:                 # 依赖的上下文文件
      - context/methodology/dimensional-modeling-core
      - context/platform/hive-constraints-core
    max_tokens: 1500                  # 场景 token 预算
    examples_dir: prompts/scenarios/design-new-model/examples
    resources:                        # 额外资源文件（可选）
      - prompts/scenarios/design-new-model/special-guide.md
```

**关键字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 场景唯一标识，kebab-case 格式 |
| `name` | 是 | 场景中文名称 |
| `description` | 是 | 场景描述，支持多行 |
| `prompt_file` | 是 | 主提示文件路径 |
| `output_template` | 是 | 输出模板路径 |
| `requires_context` | 是 | 依赖的上下文文件列表 |
| `max_tokens` | 是 | 场景 token 预算 |
| `examples_dir` | 否 | 案例目录路径 |
| `resources` | 否 | 额外资源文件列表 |

### platforms.yaml

平台配置文件，定义支持的数仓平台。

```yaml
schema_version: 1

platforms:
  - id: hive                          # 平台 ID
    name: Hive 数仓                    # 中文名称
    description: |                    # 平台描述
      Apache Hive 4.x + dbt-hive 1.10.0
    version_supported: "4.x"
    dbt_adapter: dbt-hive
    dbt_adapter_version: "1.10.0"

    context_files:                    # 核心上下文（always 级别）
      - path: context/platform/hive-constraints-core.md
        description: Hive 核心约束
        level: always
        estimated_tokens: 800

    full_docs:                        # 完整文档（onDemand 级别）
      - path: context/platform/hive-constraints.md
        description: Hive 完整约束
        level: onDemand
        estimated_tokens: 2000

    config:                           # 平台特定配置
      partition:
        default_column: dt
        default_format: "yyyy-MM-dd"
      lookback_days:
        ods: 7
        dwd: 30
        dws: 30
        ads: 90
      materialization:
        default: incremental
        incremental_strategy: insert_overwrite
      scd2:
        method: manual
        current_flag: is_current

default_platform: hive                # 默认平台
```

### assembly-rules.yaml

组装规则配置，定义上下文加载策略和 token 预算。

```yaml
schema_version: 1

# Token 预算配置
token_budget:
  max_tokens: 4000          # 组装后总上限
  reserve_output: 1500      # 输出预留
  available_input: 2500     # 可用于输入的 token
  warning_threshold: 0.8    # 警告阈值
  hard_limit: 1.0           # 硬限制

# 上下文加载级别
context_levels:
  # Level 1: 始终加载（核心约束）
  always:
    - path: context/platform/hive-constraints-core.md
      description: Hive 核心约束
      estimated_tokens: 800

  # Level 2: 场景触发加载（由 scenarios.yaml 定义）
  scenario:
    description: 由 requires_context 字段定义

  # Level 3: 按需加载
  onDemand:
    - path: context/methodology/scd-strategies-core.md
      description: SCD 策略
      trigger_keywords: [SCD, Type2, 历史, 拉链]
      estimated_tokens: 700

# 优先级排序（数字越小优先级越高）
priority_order:
  platform: 1      # 平台约束最高
  methodology: 2   # 方法论次之
  layers: 3        # 分层规范
  governance: 4    # 治理规范
  naming: 5        # 命名规范
  examples: 6      # 示例最低

# 组装规则
assembly:
  detect_circular_includes: true
  max_include_depth: 10
  validate_path_security: true
  base_dir: .claude/data-warehouse
  missing_file_strategy: warn

# 裁剪策略
truncation:
  mode: priority
  truncate_first:
    - examples
    - naming
  protected:
    - platform
  min_lines_per_file: 10
```

---

## 测试新场景

### 1. 校验输入

使用 `/dw:validate` 命令校验输入格式：

```bash
# 准备测试输入文件
cat > test-input.yaml << EOF
schema_version: 1
required_field_a: "测试值 A"
required_field_b: "测试值 B"
EOF

# 校验输入
/dw:validate {scenario-id} --input=./test-input.yaml
```

### 2. 组装提示

使用 `/dw:assemble` 命令测试提示组装：

```bash
# 组装提示（JSON 格式查看 token 统计）
/dw:assemble {scenario-id} --json

# 验证 token 预算
# 确保 total_tokens < max_tokens (4000)
```

### 3. 端到端测试

手动执行场景命令，验证完整流程：

```bash
# 执行场景命令
/dw:{scenario-id} 测试输入

# 验证：
# 1. Stage 1 规格确认正确
# 2. Stage 2 产物完整
# 3. 输出格式符合模板
```

### 4. 案例编写

在 `examples/` 目录下编写测试案例：

```markdown
---
id: {scenario-id}-example-1
name: 案例 1 名称
type: example
scenario: {scenario-id}
---

# 案例 1：[案例名称]

## 输入

```yaml
schema_version: 1
required_field_a: "示例值 A"
required_field_b: "示例值 B"
```

## Stage 1: 规格确认

[预期的规格确认输出]

## Stage 2: 完整产物

[预期的产物输出]

## 要点说明

- 要点 1
- 要点 2
```

---

## 常见问题

### Q1: Token 超限怎么办？

**症状：** 组装后提示超过 4000 tokens。

**解决方案：**

1. **检查 requires_context：** 减少不必要的上下文依赖
2. **使用精简版：** 优先使用 *-core.md 文件
3. **调整优先级：** 在 assembly-rules.yaml 中配置裁剪策略
4. **拆分场景：** 如果场景过于复杂，考虑拆分为多个子场景

### Q2: 如何调试组装逻辑？

**方法：**

1. 启用 trace 输出：
   ```bash
   /dw:assemble {scenario-id} --json
   ```

2. 查看 JSON 输出中的 `context_files` 和 `token_breakdown`

3. 检查 `assembly-rules.yaml` 中的 `output_trace: true` 配置

### Q3: Schema 校验失败？

**排查步骤：**

1. 检查 JSON Schema 语法：
   ```bash
   node -e "require('./schemas/input/{scenario-id}.schema.json')"
   ```

2. 验证必填字段是否在 `required` 数组中

3. 检查 `additionalProperties` 是否设置正确

### Q4: 新场景如何与现有场景共享上下文？

**方案：**

1. **复用现有上下文文件：** 在 `requires_context` 中引用

2. **创建共享上下文：** 如果多个场景需要相同的特定上下文，创建新的 *-core.md 文件

3. **使用 always 级别：** 在 `assembly-rules.yaml` 中将共享上下文设为 always 级别

### Q5: 如何处理平台差异？

**方案：**

1. **平台特定上下文：** 为每个平台创建独立的约束文件

2. **条件逻辑：** 在提示中使用条件逻辑处理平台差异：
   ```markdown
   ## 平台特定处理

   **Hive 平台：**
   - 使用 insert_overwrite 分区回刷

   **Spark 平台：**
   - 使用 MERGE INTO 增量更新
   ```

3. **平台配置：** 在 `platforms.yaml` 中配置平台特定参数

---

## 版本信息

- **版本：** 1.0.0
- **更新日期：** 2026-02-01

---

*扩展开发指南 — HiveMind 数仓助手*

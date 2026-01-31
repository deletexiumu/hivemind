---
type: context
title: 提示工程规范
status: active
version: 1.0.0
domain: global
owner: data-platform
updated_at: 2026-01-31
---

# 提示工程规范

> 本文档定义 HiveMind 数仓系统中 AI 提示文件的编写规范、结构模板和 Token 限制。

## 核心原则

### 1. 模块化设计

- **单一职责**：每个提示文件只解决一类问题
- **可组合性**：通过 `includes` 声明依赖，支持按需组合
- **关注点分离**：提示（指令）与上下文（知识）分离存放

### 2. 可维护性

- **人类可读**：优先考虑人类阅读和维护
- **版本可追溯**：通过 YAML frontmatter 记录版本和更新历史
- **自解释性**：文件结构和命名应自解释

### 3. Token 效率

- **单文件上限**：每个文件 < 2000 tokens（硬限制）
- **保守估算**：1 token ≈ 1 中文字符
- **精简表达**：避免冗余，使用表格替代长篇描述

---

## 文件类型定义

| 类型 | type 值 | 存放路径 | 用途 |
|------|---------|----------|------|
| 场景提示 | `prompt` | `prompts/scenarios/` | 具体业务场景的指令 |
| 系统提示 | `prompt` | `prompts/system/` | 跨场景的通用规则 |
| 上下文 | `context` | `context/` | 知识库、规范、领域信息 |
| 术语表 | `glossary` | `glossary/` | 中英术语对照 |
| 文档 | `docs` | `docs/` | 规范说明、使用指南 |

---

## YAML Frontmatter 规范

### 最小必要字段（Phase 1）

```yaml
---
type: prompt                    # prompt | context | glossary | docs
title: <标题>                   # 中文标题
status: active                  # draft | active | deprecated
version: 1.0.0                  # 语义化版本
domain: <domain>                # global | sales | finance | ...
owner: <负责人>                 # 负责人或团队
updated_at: YYYY-MM-DD          # 最后更新日期
includes:                       # 可选，依赖的上下文
  - context/global/sql-style
  - context/domains/sales
---
```

### 字段说明

| 字段 | 必须 | 类型 | 说明 |
|------|------|------|------|
| `type` | 是 | string | 文件类型，决定处理方式 |
| `title` | 是 | string | 中文标题，人类可读 |
| `status` | 是 | enum | draft/active/deprecated |
| `version` | 是 | string | 语义化版本号 |
| `domain` | 是 | string | 业务域或 global |
| `owner` | 是 | string | 负责人/团队 |
| `updated_at` | 是 | date | ISO 日期格式 |
| `includes` | 否 | list | 依赖的上下文路径 |
| `deprecated_to` | 条件 | string | status=deprecated 时必填 |

### `id` 规则

- `id` 字段可省略
- 缺省时按路径推导：`id = <仓库相对路径去掉扩展名>`
- 示例：`prompts/scenarios/order-refund.md` → `prompts/scenarios/order-refund`
- 若显式写 `id`，必须与推导结果一致

### `includes` 语义

- Phase 1：仅声明"编写/评审依赖的上下文来源"
- 不做自动拼装，便于人工核对
- Phase 8：升级为自动组合

### 废弃文件处理

```yaml
---
type: prompt
title: 旧版订单分析
status: deprecated
deprecated_to: prompts/scenarios/order-analysis-v2
version: 1.0.0
# ...
---
```

---

## Token 限制规范

### 单文件限制

| 规范项 | 限制 | 说明 |
|--------|------|------|
| 提示文件 | < 2000 tokens | 硬限制，超过必须拆分 |
| 上下文文件 | < 2000 tokens | 硬限制，超过必须拆分 |
| 示例块 | < 400 tokens | few-shot 单个示例建议上限 |
| 目标值 | < 1500 tokens | 推荐目标，留出安全余量 |

### 估算规则

| 内容类型 | 估算规则 | 说明 |
|----------|----------|------|
| 中文文本 | 1 token ≈ 1 中文字符 | 保守估算，含标点 |
| 英文文本 | 1 token ≈ 4 字符 | 标准估算 |
| 代码 | 1 token ≈ 3-4 字符 | 因符号密度而异 |
| 混合内容 | 按中文估算 | 取保守值 |

### 超限处理

1. **识别超限**：文件超过 2000 中文字符时预警
2. **拆分策略**：
   - 按功能拆分为多个独立文件
   - 使用 `includes` 声明依赖关系
   - 保持每个文件的单一职责
3. **Phase 8 工具**：提供精确 Token 统计和自动检查

---

## 提示结构模板

### 场景提示模板

```markdown
---
type: prompt
title: <场景中文名称>
status: active
version: 1.0.0
domain: <业务域>
owner: data-platform
updated_at: YYYY-MM-DD
includes:
  - context/global/sql-style
  - context/domains/<domain>
---

# <场景名称>

<context>
你是一位资深数据工程师，专注于 Hive 数仓开发...
</context>

<instructions>
1. 第一步操作
2. 第二步操作
3. 第三步操作
</instructions>

<constraints>
- 约束条件 1
- 约束条件 2
</constraints>

<output_format>
## 输出标题
[输出内容描述]

## 示例
[示例内容]
</output_format>

<examples>
### 示例 1: <场景描述>

**输入：**
[输入内容]

**输出：**
[输出内容]
</examples>
```

### 上下文文件模板

```markdown
---
type: context
title: <上下文主题>
status: active
version: 1.0.0
domain: <领域>
owner: data-platform
updated_at: YYYY-MM-DD
---

# <主题名称>

## 概述

<简要描述此上下文的用途>

## 核心规则

### 规则 1: <规则名称>

<规则描述>

**正例：**
```sql
-- 正确示例
```

**反例：**
```sql
-- 错误示例
```

### 规则 2: <规则名称>

...

## 参考

- [相关术语](../glossary/terms.md#term_id)
- [相关规范](./other-context.md)
```

---

## XML 标签使用规范

### 推荐标签

| 标签 | 用途 | 示例 |
|------|------|------|
| `<context>` | 角色定义、背景信息 | 定义 AI 角色和专业领域 |
| `<instructions>` | 步骤化指令 | 明确操作步骤 |
| `<constraints>` | 约束条件 | 限制和边界条件 |
| `<output_format>` | 输出格式 | 期望的输出结构 |
| `<examples>` | 示例 | few-shot 学习示例 |
| `<input>` | 用户输入 | 标记用户提供的内容 |
| `<thinking>` | 思考过程 | 要求显示推理过程 |

### 使用原则

1. **语义化**：标签名应自解释
2. **扁平化**：避免过深嵌套（建议 <= 2 层）
3. **一致性**：同类内容使用相同标签
4. **必要性**：只在需要明确边界时使用

### 示例

```markdown
<context>
你是一位 Hive 数仓专家，熟悉 Kimball 维度建模方法论。
</context>

<instructions>
1. 分析用户提供的表结构
2. 识别建模问题
3. 提供修复建议
</instructions>

<constraints>
- 只使用 Hive 4.x 支持的语法
- 遵循 dbt-hive 的限制
- 分区字段必须使用 STRING 类型
</constraints>

<output_format>
## 问题清单

| # | 问题类型 | 描述 | 严重程度 |
|---|---------|------|---------|
| 1 | ...     | ...  | HIGH    |

## 修复建议

[具体的修复方案]
</output_format>
```

---

## 版本管理规则

### 版本号规则

采用语义化版本（SemVer）：`MAJOR.MINOR.PATCH`

| 变更类型 | 版本变化 | 示例 |
|----------|----------|------|
| 破坏性变更 | MAJOR +1 | 1.0.0 → 2.0.0 |
| 新增功能 | MINOR +1 | 1.0.0 → 1.1.0 |
| 修复/优化 | PATCH +1 | 1.0.0 → 1.0.1 |

### 变更记录

重大变更应在文件末尾添加变更日志：

```markdown
---

## Changelog

### 1.1.0 (2026-02-15)
- 新增：XXX 功能支持

### 1.0.1 (2026-02-01)
- 修复：XXX 问题

### 1.0.0 (2026-01-31)
- 初始版本
```

---

## 检查清单

### 新建文件检查

- [ ] 是否包含完整的 YAML frontmatter？
- [ ] `type` 是否正确？
- [ ] `status` 是否设为 draft 或 active？
- [ ] `version` 是否从 1.0.0 开始？
- [ ] `domain` 是否正确指定？
- [ ] `owner` 是否明确？
- [ ] `updated_at` 是否为今天日期？
- [ ] 文件是否 < 2000 tokens？
- [ ] 是否遵循对应的结构模板？

### 更新文件检查

- [ ] 是否更新 `version`？
- [ ] 是否更新 `updated_at`？
- [ ] 重大变更是否添加 Changelog？
- [ ] 更新后是否仍 < 2000 tokens？

### 废弃文件检查

- [ ] `status` 是否改为 deprecated？
- [ ] 是否添加 `deprecated_to` 字段？
- [ ] 新版本文件是否已创建？

---

*Version: 1.0.0 | Updated: 2026-01-31 | Owner: data-platform*

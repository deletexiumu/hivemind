# Phase 8: 工具化 (Tooling) - Research

**Researched:** 2026-02-01
**Domain:** Claude Code 插件架构 + 提示组装系统
**Confidence:** HIGH

## Summary

本研究调查了如何构建 Claude Code 插件，实现 `/dw:*` 系列命令用于数仓提示系统的动态组装和校验。

研究发现 Claude Code 提供了成熟的插件扩展机制：commands（斜杠命令）、skills（可复用技能）、agents（专用代理）三层架构。项目已有的 `/gsd:*` 系列命令提供了经过验证的模式参考。核心技术栈包括 gray-matter（YAML frontmatter 解析）、js-yaml（YAML 配置）、ajv（JSON Schema 校验），这些都是生态中的标准选择。

关键发现：Claude Code 命令本质是 Markdown 文件，通过 YAML frontmatter 定义元数据（name、description、allowed-tools），通过 `$ARGUMENTS` 接收参数。提示组装应遵循「渐进披露」模式——核心上下文始终加载，扩展上下文按需加载。Token 计数可通过 Anthropic 官方 API 精确获取。

**Primary recommendation:** 采用与 `/gsd:*` 一致的命令结构，在 `.claude/commands/dw/` 目录下创建 8 个命令文件，复用项目已验证的 frontmatter 格式和执行模式。

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gray-matter | 4.0.3 | YAML frontmatter 解析 | Gatsby/Next.js/Astro/VitePress 等主流框架标配，battle-tested |
| js-yaml | 4.1.0 | YAML 解析/序列化 | npm 生态最流行的 YAML 库，23k+ 依赖项目 |
| ajv | 8.17.1 | JSON Schema 校验 | 最快的 JSON 校验器，支持 draft-2020-12 |
| @inquirer/prompts | 7.x | 交互式 CLI 提示 | 现代 ESM 重写版，体积更小性能更优 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @anthropic-ai/sdk | latest | Claude API 调用 | Token 计数、API 集成 |
| ajv-formats | 3.x | ajv 格式扩展 | 需要 date、uri 等格式校验时 |
| ajv-errors | 3.x | 自定义错误消息 | 需要友好中文错误提示时 |
| chalk | 5.x | 终端着色 | CLI 输出美化（可选） |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gray-matter | front-matter | front-matter 更轻量但功能少，gray-matter 支持多格式 |
| @inquirer/prompts | enquirer | enquirer 依赖少但社区不如 inquirer 活跃 |
| js-yaml | yaml (eemeli) | yaml 开发更活跃但 API 不同，js-yaml 生态更广 |

**Installation:**
```bash
npm install gray-matter js-yaml ajv @inquirer/prompts
npm install -D @types/js-yaml  # TypeScript 项目
```

## Architecture Patterns

### Recommended Plugin Structure

基于 Claude Code 官方插件规范和项目现有 `/gsd:*` 模式：

```
.claude/
├── commands/
│   └── dw/                          # /dw:* 命令目录
│       ├── design.md                # /dw:design
│       ├── review.md                # /dw:review
│       ├── generate-sql.md          # /dw:generate-sql
│       ├── define-metric.md         # /dw:define-metric
│       ├── generate-dq.md           # /dw:generate-dq
│       ├── analyze-lineage.md       # /dw:analyze-lineage
│       ├── assemble.md              # /dw:assemble
│       ├── validate.md              # /dw:validate
│       └── new-scenario.md          # /dw:new-scenario（脚手架）
├── data-warehouse/
│   ├── prompts/
│   │   ├── system/                  # 系统级提示
│   │   └── scenarios/               # 场景提示（已存在）
│   │       └── {scenario}/
│   │           ├── prompt.md        # 场景主提示
│   │           ├── output-template.md
│   │           └── examples/
│   ├── context/                     # 上下文知识库（已存在）
│   │   ├── methodology/
│   │   ├── platform/
│   │   ├── layers/
│   │   └── governance/
│   ├── schemas/                     # 校验规则（新增）
│   │   ├── input/                   # 输入校验 schemas
│   │   │   └── {scenario}.schema.json
│   │   └── output/                  # 输出校验 schemas
│   │       └── {scenario}.schema.json
│   ├── config/                      # 配置文件（新增）
│   │   ├── scenarios.yaml           # 场景配置
│   │   ├── platforms.yaml           # 平台配置
│   │   └── assembly-rules.yaml      # 组装规则
│   └── scripts/                     # 辅助脚本（新增）
│       ├── assemble.js              # 组装逻辑
│       ├── validate.js              # 校验逻辑
│       └── scaffold.js              # 脚手架生成
└── settings.json
```

### Pattern 1: Command File Structure

**What:** Claude Code 命令文件格式
**When to use:** 所有 `/dw:*` 命令
**Example:**
```markdown
---
name: dw:design
description: 设计新的数仓模型（事实表/维度表）
argument-hint: "[业务事件描述] [--batch]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
根据业务需求设计星型模型，支持交互式和批处理两种模式。

**Creates:**
- 建模规格书
- DDL 语句
- dbt schema.yml
- dbt SQL 模型
</objective>

<execution_context>
@./.claude/data-warehouse/prompts/scenarios/design-new-model/prompt.md
@./.claude/data-warehouse/context/methodology/dimensional-modeling-core.md
</execution_context>

<process>
## Mode Detection

```bash
BATCH_MODE=$(echo "$ARGUMENTS" | grep -q "\-\-batch\|\-\-non-interactive" && echo "true" || echo "false")
```

**If BATCH_MODE=true:**
- 解析 YAML 输入
- 直接执行完整流程
- 输出 Markdown（或 --json 时输出 JSON）

**If BATCH_MODE=false:**
- 进入交互式引导
- 逐步收集信息
- 确认后生成产物
</process>

<success_criteria>
- [ ] 输入已校验通过
- [ ] 模型设计符合方法论
- [ ] 输出格式正确
</success_criteria>
```

### Pattern 2: Progressive Disclosure for Context Assembly

**What:** 渐进式上下文加载模式
**When to use:** 管理 Token 预算时
**Example:**
```javascript
// Source: Claude Code Skills Best Practices
// 三级上下文加载策略

const CONTEXT_LEVELS = {
  // Level 1: 始终加载（核心约束）
  always: [
    'context/platform/hive-constraints-core.md',      // 平台限制必须知道
    'context/platform/dbt-hive-limitations-core.md',  // dbt 限制必须知道
  ],

  // Level 2: 场景触发时加载
  scenario: {
    'design-new-model': [
      'context/methodology/dimensional-modeling-core.md',
      'context/methodology/fact-table-types-core.md',
      'docs/naming-core.md',
    ],
    'generate-sql': [
      'context/global/sql-style.md',
      'prompts/scenarios/generate-sql/time-expressions.md',
    ],
  },

  // Level 3: 按需加载（用户请求或检测到需要）
  onDemand: [
    'context/methodology/scd-strategies-core.md',  // 检测到 SCD 需求时
    'context/governance/metrics-core.md',          // 涉及指标定义时
  ],
};

// 组装时计算 token 并告警
function assembleContext(scenario, options) {
  const contexts = [
    ...CONTEXT_LEVELS.always,
    ...(CONTEXT_LEVELS.scenario[scenario] || []),
  ];

  if (options.includeGovernance) {
    contexts.push('context/governance/dq-rules-core.md');
  }

  return contexts;
}
```

### Pattern 3: Input/Output Schema Definition

**What:** JSON Schema 双向校验
**When to use:** 场景输入输出校验
**Example:**
```json
// schemas/input/design-new-model.schema.json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Design New Model Input",
  "type": "object",
  "required": ["business_event", "grain"],
  "properties": {
    "business_event": {
      "type": "string",
      "minLength": 2,
      "description": "业务事件名称"
    },
    "grain": {
      "type": "string",
      "minLength": 5,
      "description": "粒度声明（一行代表什么）"
    },
    "measures": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": { "type": "string" },
          "desc": { "type": "string" },
          "type": { "type": "string" }
        }
      }
    },
    "dimensions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "source": {
      "type": "object",
      "properties": {
        "table": { "type": "string" },
        "partition_col": { "type": "string" }
      }
    }
  },
  "additionalProperties": false
}
```

### Anti-Patterns to Avoid

- **Mega-Prompt 反模式:** 将所有上下文一次性注入，导致 Token 超限和性能下降。应使用渐进披露。
- **硬编码路径:** 不要在命令中硬编码文件路径，应通过配置或约定推导。
- **同步全量校验:** 不要在每次操作前校验所有 schemas，应按需校验。
- **忽略 includes 声明:** 场景 prompt 的 frontmatter 已声明 includes，组装时应尊重此声明。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter 解析 | 正则表达式解析 | gray-matter | 边界情况多（转义、多行、嵌套），库处理完善 |
| YAML 配置解析 | 手写 parser | js-yaml | YAML 1.2 规范复杂，手写易出错 |
| JSON Schema 校验 | 手写校验逻辑 | ajv | Schema 规范庞大，ajv 支持所有 draft 版本 |
| Token 计数 | 字符数估算 | Anthropic API count_tokens | 中文 token 密度不稳定（1-2.5 字符/token），API 精确 |
| CLI 交互 | readline 手写 | @inquirer/prompts | 处理 TTY、颜色、验证等边界情况 |
| 错误消息格式化 | console.log 拼接 | 结构化错误对象 | 便于 --json 模式输出和 CI 集成 |

**Key insight:** 这些"简单"问题都有复杂的边界情况。YAML 解析看似简单，但处理锚点、别名、多文档需要完整实现规范。Token 计数的"4字符≈1token"规则对中文只有 ~50% 准确率。

## Common Pitfalls

### Pitfall 1: Token Budget Misjudgment

**What goes wrong:** 组装后的提示超过模型上下文限制，导致截断或失败
**Why it happens:** 中文 token 密度波动大（1-2.5 字符/token），粗略估算不准确
**How to avoid:**
- 使用 Anthropic 官方 `count_tokens` API 精确计算
- 组装时设置预警阈值（如 80% 容量）
- 超限时提供用户选择界面
**Warning signs:** 模型响应被截断、"继续"请求频繁、输出不完整

### Pitfall 2: Frontmatter Parsing Edge Cases

**What goes wrong:** YAML frontmatter 解析失败或丢失字段
**Why it happens:** 手写正则无法处理所有 YAML 语法（多行字符串、特殊字符转义）
**How to avoid:** 使用 gray-matter 库，配置 `excerpt: false` 避免干扰
**Warning signs:** 包含 `|` 或 `>` 的字段解析错误、Unicode 字符丢失

### Pitfall 3: Schema Validation Error Messages

**What goes wrong:** ajv 默认错误消息对用户不友好
**Why it happens:** JSON Schema 错误是技术性的（如 "must match pattern"）
**How to avoid:**
```javascript
import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';

const ajv = new Ajv({ allErrors: true });
ajvErrors(ajv);

// 在 schema 中定义友好消息
{
  "properties": {
    "business_event": {
      "type": "string",
      "errorMessage": "业务事件必须是非空字符串"
    }
  }
}
```
**Warning signs:** 用户无法理解校验失败原因、重复提交无效输入

### Pitfall 4: Interactive Mode TTY Detection

**What goes wrong:** 在 CI/管道中运行交互命令导致挂起
**Why it happens:** inquirer 需要 TTY，管道环境没有
**How to avoid:**
```javascript
// 检测 TTY 环境
if (!process.stdin.isTTY) {
  console.error('Error: Interactive mode requires a terminal. Use --batch flag.');
  process.exit(1);
}
```
**Warning signs:** CI 任务超时、脚本调用无响应

### Pitfall 5: Context Path Resolution

**What goes wrong:** 相对路径在不同工作目录下解析错误
**Why it happens:** Node.js 的 `__dirname` vs `process.cwd()` 混淆
**How to avoid:**
- 统一使用相对于项目根的路径
- 命令执行时先确定 `.claude/` 位置
- 使用 `path.resolve()` 标准化路径
**Warning signs:** "文件不存在"错误、开发环境正常但 CI 失败

## Code Examples

### Example 1: YAML Frontmatter Parsing

```javascript
// Source: gray-matter npm documentation
import matter from 'gray-matter';
import fs from 'fs';

function parsePromptFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data, content: body } = matter(content);

  return {
    metadata: {
      type: data.type,
      scenario: data.scenario,
      version: data.version,
      token_budget: data.token_budget || 1500,
      includes: data.includes || [],
    },
    content: body.trim(),
  };
}
```

### Example 2: JSON Schema Validation

```javascript
// Source: ajv documentation + ajv-errors
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import fs from 'fs';

function createValidator(schemaPath) {
  const ajv = new Ajv({ allErrors: true, verbose: true });
  addFormats(ajv);
  ajvErrors(ajv);

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const validate = ajv.compile(schema);

  return function validateInput(data) {
    const valid = validate(data);
    if (!valid) {
      return {
        valid: false,
        errors: validate.errors.map(err => ({
          path: err.instancePath || '/',
          message: err.message,
          keyword: err.keyword,
        })),
      };
    }
    return { valid: true, errors: [] };
  };
}
```

### Example 3: Token Counting via API

```typescript
// Source: Anthropic API documentation
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

async function countTokens(content: string): Promise<number> {
  const response = await client.messages.countTokens({
    model: 'claude-sonnet-4-5',
    messages: [{ role: 'user', content }],
  });
  return response.input_tokens;
}

// 组装时检查预算
async function assembleWithBudgetCheck(
  scenario: string,
  contexts: string[],
  userInput: string,
  budget: number = 8000
) {
  const assembled = contexts.join('\n\n') + '\n\n' + userInput;
  const tokens = await countTokens(assembled);

  if (tokens > budget) {
    return {
      ok: false,
      tokens,
      budget,
      overBy: tokens - budget,
      message: `Token 超限：${tokens}/${budget}，超出 ${tokens - budget} tokens`,
    };
  }

  return { ok: true, tokens, content: assembled };
}
```

### Example 4: Interactive CLI with Batch Mode Support

```javascript
// Source: @inquirer/prompts documentation
import { input, select, confirm } from '@inquirer/prompts';

async function collectDesignInput(args) {
  // 检测批处理模式
  const batchMode = args.includes('--batch') || args.includes('--non-interactive');

  if (batchMode) {
    // 从 stdin 或文件读取 YAML
    return parseYamlInput(args);
  }

  // 检测 TTY
  if (!process.stdin.isTTY) {
    throw new Error('Interactive mode requires a terminal. Use --batch flag.');
  }

  // 交互式收集
  const businessEvent = await input({
    message: '业务事件名称：',
    validate: (v) => v.length >= 2 || '至少 2 个字符',
  });

  const grain = await input({
    message: '粒度声明（一行代表什么）：',
    validate: (v) => v.length >= 5 || '请详细描述粒度',
  });

  const factType = await select({
    message: '事实表类型：',
    choices: [
      { value: 'transactional', name: '事务事实表' },
      { value: 'periodic_snapshot', name: '周期快照事实表' },
      { value: 'accumulating_snapshot', name: '累积快照事实表' },
    ],
  });

  return { businessEvent, grain, factType };
}
```

### Example 5: Command Frontmatter Structure

```yaml
# Source: 项目现有 /gsd:* 命令模式
---
name: dw:assemble
description: 根据场景组装完整提示
argument-hint: "<scenario> [--context-level=standard] [--json]"
allowed-tools:
  - Read
  - Bash
  - Glob
---

<objective>
根据场景配置组装提示包，包含：
- 场景提示（prompt.md）
- 引用的上下文（includes）
- 示例（如有）

支持 --json 输出结构化结果。
</objective>

<process>
1. 解析场景名称
2. 读取场景 prompt.md 的 frontmatter
3. 根据 includes 加载上下文
4. 计算总 token 数
5. 如超限，告警并提示用户选择
6. 输出组装结果
</process>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| inquirer (legacy) | @inquirer/prompts | 2023 | ESM 原生，体积减少 50%，支持独立导入 |
| 字符数估算 token | Anthropic count_tokens API | 2024 | 精确计数，免费调用 |
| ajv 6 (draft-04) | ajv 8 (draft-2020-12) | 2021 | 支持最新 JSON Schema 规范 |
| 自定义命令格式 | Claude Code Skills 合并 | 2025.10 | commands/ 和 skills/ 统一，更灵活 |

**Deprecated/outdated:**
- `inquirer` 旧版包：仍可用但不再活跃开发，新项目用 `@inquirer/prompts`
- `@anthropic-ai/tokenizer`：仅适用于 Claude 3 之前的模型，现在用 API

## Open Questions

1. **Token 计数离线方案**
   - What we know: Anthropic API 提供精确计数，但需要网络请求
   - What's unclear: 离线场景（如 CI 无网络）如何处理
   - Recommendation: 提供保守估算作为 fallback（1 中文字符 = 1 token）

2. **Skills vs Commands 选择**
   - What we know: Claude Code 支持两种扩展方式，功能等价
   - What's unclear: 长期来看是否会分化
   - Recommendation: 使用 commands/（与现有 /gsd:* 一致），观察社区动向

3. **多平台扩展的配置热加载**
   - What we know: 用户决定通过添加 `platform/*.md` 扩展新平台
   - What's unclear: 运行时是否需要重新加载配置
   - Recommendation: 每次命令执行时重新扫描配置（简单可靠）

## Sources

### Primary (HIGH confidence)
- [Claude Code Plugin Architecture](https://github.com/anthropics/claude-code/blob/main/plugins/README.md) - 官方插件结构
- [Anthropic Token Counting API](https://platform.claude.com/docs/en/build-with-claude/token-counting) - 官方文档
- [gray-matter npm](https://www.npmjs.com/package/gray-matter) - frontmatter 解析
- [ajv npm](https://www.npmjs.com/package/ajv) - JSON Schema 校验
- [Anthropic Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) - 技能编写规范

### Secondary (MEDIUM confidence)
- [@inquirer/prompts npm](https://www.npmjs.com/package/@inquirer/prompts) - CLI 交互
- [js-yaml npm](https://www.npmjs.com/package/js-yaml) - YAML 解析
- [Claude Code Skills Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) - 技能机制分析
- [Claude Prompt Engineering Best Practices 2026](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026) - 提示工程模式

### Tertiary (LOW confidence - 需验证)
- Token 估算规则"4字符≈1token"对英文约 80% 准确
- 中文 token 密度范围 1-2.5 字符/token 基于社区经验

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 库均有官方文档和广泛使用
- Architecture: HIGH - 基于项目现有 /gsd:* 模式，已验证可行
- Pitfalls: MEDIUM - 部分基于社区经验，需实际验证

**Research date:** 2026-02-01
**Valid until:** 2026-03-01（30 天，技术栈稳定）

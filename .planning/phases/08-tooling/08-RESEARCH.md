# Phase 8: 工具化 (Tooling) - Research

**Researched:** 2026-02-01
**Updated:** 2026-02-01 (Codex Review)
**Domain:** Claude Code 插件架构 + 提示组装系统
**Confidence:** HIGH

## Summary

本研究调查了如何构建 Claude Code 插件，实现 `/dw:*` 系列命令用于数仓提示系统的动态组装和校验。

研究发现 Claude Code 提供了成熟的插件扩展机制：commands（斜杠命令）、skills（可复用技能）、agents（专用代理）三层架构。项目已有的 `/gsd:*` 系列命令提供了经过验证的模式参考。核心技术栈包括 gray-matter（YAML frontmatter 解析）、yaml（YAML 1.2 配置）、ajv（JSON Schema 校验），这些都是生态中的标准选择。

关键发现：Claude Code 命令本质是 Markdown 文件，通过 YAML frontmatter 定义元数据（name、description、allowed-tools），通过 `$ARGUMENTS` 接收参数。提示组装应遵循「渐进披露」模式——核心上下文始终加载，扩展上下文按需加载。Token 计数可通过 Anthropic 官方 API 精确获取，但应设计为可选依赖以支持离线场景。

**Primary recommendation:** 采用与 `/gsd:*` 一致的命令结构，在 `.claude/commands/dw/` 目录下创建 9 个命令文件，复用项目已验证的 frontmatter 格式和执行模式。同时支持全局安装目录 `~/.claude/commands/dw/` 以便分发。

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gray-matter | 4.0.3 | YAML frontmatter 解析 | Gatsby/Next.js/Astro/VitePress 等主流框架标配，battle-tested |
| yaml | 2.x | YAML 1.2 解析/序列化 | 活跃开发，避免 YAML 1.1 的 on/yes 布尔陷阱，支持 duplicate key 检测 |
| ajv | 8.17.1 | JSON Schema 校验 | 最快的 JSON 校验器，支持 draft-2020-12 |
| ajv-formats | 3.x | ajv 格式扩展 | date-time、uri 等格式校验（默认引入） |
| ajv-errors | 3.x | 自定义错误消息 | 友好中文错误提示 |
| commander | 12.x | CLI 参数解析 | 处理 --batch、--json、--strict 等标志 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @anthropic-ai/sdk | latest | Claude API 调用 | Token 计数（可选，有 key 时启用） |
| @inquirer/prompts | 7.x | 交互式 CLI 提示 | 独立 CLI 模式下的交互（非 Claude Code 对话） |
| chalk | 5.x | 终端着色 | CLI 输出美化（可选） |

### Runtime Requirements

| Requirement | Value | Reason |
|-------------|-------|--------|
| Node.js | >= 22 LTS | 支持到 2027-04，原生 ESM，避免模块系统兼容问题 |
| Module System | ESM only | @inquirer/prompts 等库偏 ESM，统一策略减少问题 |
| Package Manager | npm/pnpm | 标准选择 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| yaml | js-yaml | js-yaml 生态更广但 YAML 1.1，有 on/yes 布尔陷阱 |
| commander | yargs | yargs 功能更强但体积更大 |
| @inquirer/prompts | enquirer | enquirer 依赖少但社区不如 inquirer 活跃 |

**Installation:**
```bash
npm install gray-matter yaml ajv ajv-formats ajv-errors commander
npm install -D @types/node  # TypeScript 项目
# 可选
npm install @anthropic-ai/sdk @inquirer/prompts chalk
```

---

## Architecture Patterns

### Recommended Plugin Structure

基于 Claude Code 官方插件规范和项目现有 `/gsd:*` 模式：

```
# 项目级安装（开发/项目专用）
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

# 全局安装（分发/共享）
~/.claude/
└── commands/
    └── dw/                          # 同上结构
```

### Configuration Discovery Priority

配置发现遵循以下优先级（后者覆盖前者）：

```
1. 全局默认: ~/.claude/data-warehouse/config/
2. 环境变量: CLAUDE_CONFIG_DIR/data-warehouse/config/
3. 项目级别: .claude/data-warehouse/config/
4. 命令行参数: --config-dir
```

### Pattern 1: Command File Structure

**What:** Claude Code 命令文件格式
**When to use:** 所有 `/dw:*` 命令
**Example:**
```markdown
---
name: dw:design
description: 设计新的数仓模型（事实表/维度表）
argument-hint: "[业务事件描述] [--batch] [--json] [--strict]"
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
JSON_OUTPUT=$(echo "$ARGUMENTS" | grep -q "\-\-json" && echo "true" || echo "false")
```

**If BATCH_MODE=true:**
- 解析 YAML 输入（从 stdin 或文件）
- 直接执行完整流程
- 输出 Markdown（或 --json 时输出 JSON 到 stdout）
- 日志/提示输出到 stderr

**If BATCH_MODE=false (Claude Code 对话模式):**
- 在对话中提问收集信息（使用 AskUserQuestion）
- 避免阻塞式 CLI 交互
- 确认后生成产物
</process>

<success_criteria>
- [ ] 输入已校验通过
- [ ] 模型设计符合方法论
- [ ] 输出格式正确
</success_criteria>
```

### Pattern 2: Progressive Disclosure with Metadata

**What:** 渐进式上下文加载模式 + 可计算元数据
**When to use:** 管理 Token 预算时
**Example:**

每个 context 文件需要添加 frontmatter 元数据：
```yaml
---
id: methodology-dimensional-modeling
type: methodology
level: always | scenario | onDemand
tags: [kimball, star-schema, fact-table]
applies_to: [design-new-model, review-existing-model]
includes: []
schema_version: 1
---
```

组装逻辑：
```javascript
// Source: Claude Code Skills Best Practices
// 三级上下文加载策略 + DAG 构建

import { parse as parseYaml } from 'yaml';
import matter from 'gray-matter';
import crypto from 'crypto';

const CONTEXT_LEVELS = {
  // Level 1: 始终加载（核心约束）
  always: [
    'context/platform/hive-constraints-core.md',
    'context/platform/dbt-hive-limitations-core.md',
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

  // Level 3: 按需加载
  onDemand: [
    'context/methodology/scd-strategies-core.md',
    'context/governance/metrics-core.md',
  ],
};

// 构建 DAG 并检测循环
function buildContextDAG(entryFiles, baseDir) {
  const visited = new Set();
  const recursionStack = new Set();
  const dag = new Map();
  const MAX_DEPTH = 10;

  function visit(filePath, depth = 0) {
    if (depth > MAX_DEPTH) {
      throw new Error(`Max include depth exceeded: ${filePath}`);
    }
    if (recursionStack.has(filePath)) {
      throw new Error(`Circular include detected: ${filePath}`);
    }
    if (visited.has(filePath)) {
      return dag.get(filePath);
    }

    recursionStack.add(filePath);

    // 路径安全检查
    const realPath = fs.realpathSync(path.resolve(baseDir, filePath));
    if (!realPath.startsWith(fs.realpathSync(baseDir))) {
      throw new Error(`Path escape attempt: ${filePath}`);
    }

    const { data, content } = matter(fs.readFileSync(realPath, 'utf8'));
    const node = {
      id: data.id || filePath,
      path: filePath,
      content,
      metadata: data,
      includes: [],
      hash: crypto.createHash('sha256').update(content).digest('hex').slice(0, 12),
    };

    for (const include of data.includes || []) {
      node.includes.push(visit(include, depth + 1));
    }

    visited.add(filePath);
    recursionStack.delete(filePath);
    dag.set(filePath, node);
    return node;
  }

  return entryFiles.map(f => visit(f));
}

// 组装时输出 trace
function assembleWithTrace(scenario, options) {
  const contexts = buildContextDAG([
    ...CONTEXT_LEVELS.always,
    ...(CONTEXT_LEVELS.scenario[scenario] || []),
  ], '.claude/data-warehouse');

  const trace = contexts.map(c => ({
    id: c.id,
    path: c.path,
    hash: c.hash,
  }));

  const assembled = contexts.map(c => c.content).join('\n\n');

  return {
    content: assembled,
    trace,
    totalFiles: contexts.length,
  };
}
```

### Pattern 3: Input/Output Schema with Versioning

**What:** JSON Schema 双向校验 + 版本化
**When to use:** 场景输入输出校验
**Example:**
```json
// schemas/input/design-new-model.schema.json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "dw:design-new-model:input:v1",
  "title": "Design New Model Input",
  "type": "object",
  "required": ["business_event", "grain", "schema_version"],
  "properties": {
    "schema_version": {
      "const": 1,
      "description": "Schema 版本，用于迁移"
    },
    "business_event": {
      "type": "string",
      "minLength": 2,
      "description": "业务事件名称",
      "errorMessage": "业务事件必须是至少 2 个字符的字符串"
    },
    "grain": {
      "type": "string",
      "minLength": 5,
      "description": "粒度声明（一行代表什么）",
      "errorMessage": "粒度声明必须是至少 5 个字符的字符串"
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

### Pattern 4: Validate with Severity Levels

**What:** 分级校验策略
**When to use:** validate 命令

| 级别 | 处理方式 | Exit Code | 示例 |
|------|---------|-----------|------|
| CRITICAL | Hard fail，阻断流程 | 1 | 粒度定义缺失、主键未声明、frontmatter 解析失败、schema_version 不支持 |
| WARNING | Warn + 给出修复建议，继续执行 | 0 | 命名不符规范、轻微超预算（<10%）、注释缺失 |
| INFO | 仅提示，不影响执行 | 0 | 可选字段未填、风格建议 |

```javascript
// validate 检查项清单
const VALIDATE_CHECKS = {
  critical: [
    'frontmatter_parseable',      // frontmatter 可解析
    'schema_version_supported',   // schema 版本支持
    'required_fields_present',    // 必填字段存在
    'includes_exist',             // 引用文件存在
    'no_circular_includes',       // 无循环引用
    'token_hard_limit',           // Token 硬限制（超出 20%）
  ],
  warning: [
    'naming_convention',          // 命名规范
    'token_soft_limit',           // Token 软限制（超出 <10%）
    'comments_complete',          // 注释完整
    'deprecated_syntax',          // 废弃语法
  ],
  info: [
    'optional_fields',            // 可选字段建议
    'style_suggestions',          // 风格建议
  ],
};
```

### Anti-Patterns to Avoid

- **Mega-Prompt 反模式:** 将所有上下文一次性注入，导致 Token 超限和性能下降。应使用渐进披露。
- **硬编码路径:** 不要在命令中硬编码文件路径，应通过配置或约定推导。
- **同步全量校验:** 不要在每次操作前校验所有 schemas，应按需校验。
- **忽略 includes 声明:** 场景 prompt 的 frontmatter 已声明 includes，组装时应尊重此声明。
- **Claude Code 中阻塞式交互:** 在 Claude Code 对话模式中不要使用 @inquirer/prompts 阻塞式交互，应使用 AskUserQuestion 工具或参数传递。

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter 解析 | 正则表达式解析 | gray-matter | 边界情况多（转义、多行、嵌套），库处理完善 |
| YAML 配置解析 | 手写 parser | yaml (eemeli) | YAML 1.2 规范复杂，手写易出错；避免 YAML 1.1 布尔陷阱 |
| Duplicate key 检测 | 手写检测 | yaml 库配置 | `yaml.parse(content, { uniqueKeys: true })` |
| JSON Schema 校验 | 手写校验逻辑 | ajv | Schema 规范庞大，ajv 支持所有 draft 版本 |
| Token 计数 | 字符数估算 | Anthropic API count_tokens | 中文 token 密度不稳定（1-2.5 字符/token），API 精确 |
| CLI 交互 | readline 手写 | @inquirer/prompts | 处理 TTY、颜色、验证等边界情况 |
| 参数解析 | 手写 args 处理 | commander | 处理 --flag、--key=value、位置参数等 |
| 错误消息格式化 | console.log 拼接 | 结构化错误对象 | 便于 --json 模式输出和 CI 集成 |
| 路径安全检查 | 简单字符串检查 | realpath + 根目录约束 | 防止 `../` 路径越界攻击 |

**Key insight:** 这些"简单"问题都有复杂的边界情况。YAML 解析看似简单，但处理锚点、别名、多文档需要完整实现规范。Token 计数的"4字符≈1token"规则对中文只有 ~50% 准确率。

---

## Common Pitfalls

### Pitfall 1: Token Budget Misjudgment

**What goes wrong:** 组装后的提示超过模型上下文限制，导致截断或失败
**Why it happens:** 中文 token 密度波动大（1-2.5 字符/token），粗略估算不准确
**How to avoid:**
- 使用 Anthropic 官方 `count_tokens` API 精确计算（可选依赖）
- 组装时设置预警阈值（如 80% 容量）
- 超限时提供用户选择界面
- **输出预算也要计入**：reserve_output 一并计算
**Warning signs:** 模型响应被截断、"继续"请求频繁、输出不完整

### Pitfall 2: YAML Parsing Edge Cases

**What goes wrong:** YAML frontmatter 解析失败或丢失字段；重复 key 静默覆盖
**Why it happens:**
- 手写正则无法处理所有 YAML 语法（多行字符串、特殊字符转义）
- YAML 1.1 将 `on/yes/no` 解析为布尔值
- 重复 key 默认静默覆盖
**How to avoid:**
- 使用 gray-matter + yaml (YAML 1.2) 库
- 配置 `uniqueKeys: true` 检测重复 key
- BOM/CRLF 规范化（确保 frontmatter 在首行）
```javascript
import { parse as parseYaml } from 'yaml';
const config = parseYaml(content, {
  uniqueKeys: true,  // 重复 key 报错
  version: '1.2',    // 强制 YAML 1.2
});
```
**Warning signs:** 包含 `|` 或 `>` 的字段解析错误、Unicode 字符丢失、布尔字段意外

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

### Pitfall 4: Interactive Mode in Wrong Context

**What goes wrong:** 在 CI/管道中运行交互命令导致挂起；在 Claude Code 对话中阻塞
**Why it happens:**
- inquirer 需要 TTY，管道环境没有
- Claude Code 对话模式下 stdin 不可用
**How to avoid:**
```javascript
// 模式检测
const isClaudeCodeDialog = !process.stdin.isTTY && !process.env.CI;
const isCIEnvironment = process.env.CI === 'true';
const isInteractiveCLI = process.stdin.isTTY;

if (isCIEnvironment && !batchMode) {
  console.error('Error: CI environment requires --batch flag.');
  process.exit(2);  // 参数错误
}

if (isClaudeCodeDialog) {
  // 使用 AskUserQuestion 工具而非 inquirer
}
```
**Warning signs:** CI 任务超时、脚本调用无响应、Claude Code 对话卡住

### Pitfall 5: Context Path Resolution & Security

**What goes wrong:** 相对路径在不同工作目录下解析错误；路径越界访问敏感文件
**Why it happens:** Node.js 的 `__dirname` vs `process.cwd()` 混淆；未做路径约束
**How to avoid:**
```javascript
import path from 'path';
import fs from 'fs';

function resolveContextPath(relativePath, baseDir) {
  const absolutePath = path.resolve(baseDir, relativePath);
  const realPath = fs.realpathSync(absolutePath);
  const realBase = fs.realpathSync(baseDir);

  // 安全检查：确保路径在 baseDir 内
  if (!realPath.startsWith(realBase)) {
    throw new Error(`Path escape attempt: ${relativePath}`);
  }

  return realPath;
}
```
**Warning signs:** "文件不存在"错误、开发环境正常但 CI 失败、安全审计警告

### Pitfall 6: Output Extraction for Schema Validation

**What goes wrong:** 对模型输出整段 Markdown 直接 JSON.parse 失败
**Why it happens:** 模型输出包含解释性文字，JSON 嵌入在 code block 中
**How to avoid:**
```javascript
// 约束输出载体格式
const OUTPUT_PATTERNS = [
  /```json\n([\s\S]*?)\n```/,           // JSON code block
  /<json>([\s\S]*?)<\/json>/,            // XML-style tag
  /^(\{[\s\S]*\})$/m,                    // 纯 JSON（fallback）
];

function extractAndValidate(output, schema) {
  for (const pattern of OUTPUT_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        return validateWithSchema(data, schema);
      } catch (e) {
        continue;  // 尝试下一个模式
      }
    }
  }
  return { valid: false, error: 'No valid JSON found in output' };
}
```
**Warning signs:** 校验频繁失败、用户反馈"输出正确但校验不过"

---

## Token Counting Strategy

### API-Optional Architecture

Token 计数 API 是可选依赖，设计为优雅降级：

```javascript
// Token 计数服务
class TokenCounter {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    this.cache = new Map();
    this.model = options.model || 'claude-sonnet-4-5';
    this.toolVersion = '1.0.0';
  }

  // Cache key 包含所有影响因素
  getCacheKey(content) {
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    return `${this.model}:${this.toolVersion}:${contentHash}`;
  }

  async count(content) {
    const cacheKey = this.getCacheKey(content);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (this.apiKey) {
      try {
        const client = new Anthropic({ apiKey: this.apiKey });
        const response = await client.messages.countTokens({
          model: this.model,
          messages: [{ role: 'user', content }],
        });
        const tokens = response.input_tokens;
        this.cache.set(cacheKey, tokens);
        return tokens;
      } catch (e) {
        console.warn('Token API failed, using fallback:', e.message);
      }
    }

    // 保守估算 fallback：1 中文字符 = 1 token
    return this.conservativeEstimate(content);
  }

  conservativeEstimate(content) {
    // 中文字符按 1:1，英文按 4:1
    let tokens = 0;
    for (const char of content) {
      tokens += /[\u4e00-\u9fff]/.test(char) ? 1 : 0.25;
    }
    return Math.ceil(tokens * 1.1);  // 10% buffer
  }
}
```

### Budget Calculation with Output Reserve

```javascript
async function checkBudget(input, scenario, options = {}) {
  const counter = new TokenCounter();

  const inputTokens = await counter.count(input);
  const reserveOutput = options.reserveOutput || 4000;  // 输出预留
  const totalBudget = options.budget || 8000;

  const available = totalBudget - reserveOutput;
  const usage = inputTokens / available;

  return {
    inputTokens,
    reserveOutput,
    totalBudget,
    available,
    usage: Math.round(usage * 100),
    status: usage > 1 ? 'CRITICAL' : usage > 0.8 ? 'WARNING' : 'OK',
  };
}
```

---

## Batch Mode & CI Integration

### Output Channel Convention

```
机器可读结果 → stdout（--json/--jsonl）
人类提示/日志 → stderr
即使失败也输出完整 report（方便 CI 收集）
```

### Exit Code Semantics

| Exit Code | Meaning | Examples |
|-----------|---------|----------|
| 0 | 成功（可能有 WARNING/INFO） | 校验通过、组装完成 |
| 1 | 校验/业务失败 | CRITICAL 校验失败、超预算、--strict 下的 WARNING |
| 2 | 参数/系统错误 | 参数错误、文件不存在、权限问题、uncaught 异常 |

```javascript
// Batch 模式输出示例
function outputResult(result, options) {
  if (options.json) {
    // 机器可读 JSON 到 stdout
    process.stdout.write(JSON.stringify(result, null, 2));
  }

  // 日志始终到 stderr
  if (result.warnings.length > 0) {
    console.error('Warnings:', result.warnings);
  }

  // Exit code 基于严重级别
  if (result.criticals.length > 0) {
    process.exit(1);
  }
  if (options.strict && result.warnings.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}
```

---

## Testing Requirements

### Golden Fixtures & Snapshots

```
tests/
├── fixtures/
│   ├── assemble/
│   │   ├── design-new-model/
│   │   │   ├── input.yaml
│   │   │   └── expected-output.md
│   │   └── generate-sql/
│   │       ├── input.yaml
│   │       └── expected-output.md
│   └── validate/
│       ├── valid-input.yaml
│       ├── invalid-missing-grain.yaml
│       └── expected-errors.json
├── unit/
│   ├── dag-cycle-detection.test.js
│   ├── token-counting.test.js
│   ├── output-extraction.test.js
│   └── schema-validation.test.js
└── integration/
    ├── assemble-e2e.test.js
    └── validate-e2e.test.js
```

### Required Test Cases

| Category | Test Cases |
|----------|------------|
| DAG | 循环检测、深度限制、路径安全 |
| Token | API 模式、fallback 模式、cache 命中 |
| Schema | 版本迁移、错误消息、中文字段 |
| Output | JSON 提取、多种格式、无效输出 |
| E2E | 完整组装流程、校验流程、批处理模式 |

---

## Code Examples

### Example 1: YAML Frontmatter Parsing (Updated)

```javascript
// Source: gray-matter + yaml npm documentation
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import fs from 'fs';

function parsePromptFile(filePath) {
  const rawContent = fs.readFileSync(filePath, 'utf8');

  // 规范化换行（处理 CRLF）
  const content = rawContent.replace(/\r\n/g, '\n');

  // 检查 BOM
  const cleanContent = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;

  const { data, content: body } = matter(cleanContent, {
    engines: {
      yaml: (s) => parseYaml(s, {
        uniqueKeys: true,
        version: '1.2',
      }),
    },
  });

  return {
    metadata: {
      id: data.id,
      type: data.type,
      level: data.level || 'scenario',
      schema_version: data.schema_version || 1,
      token_budget: data.token_budget || 1500,
      includes: data.includes || [],
      applies_to: data.applies_to || [],
    },
    content: body.trim(),
  };
}
```

### Example 2: JSON Schema Validation with Version Check

```javascript
// Source: ajv documentation + ajv-errors
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import fs from 'fs';

const SUPPORTED_SCHEMA_VERSIONS = [1];

function createValidator(schemaPath) {
  const ajv = new Ajv({ allErrors: true, verbose: true });
  addFormats(ajv);
  ajvErrors(ajv);

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const validate = ajv.compile(schema);

  return function validateInput(data) {
    // 版本检查
    if (data.schema_version && !SUPPORTED_SCHEMA_VERSIONS.includes(data.schema_version)) {
      return {
        valid: false,
        severity: 'CRITICAL',
        errors: [{
          path: '/schema_version',
          message: `Schema version ${data.schema_version} not supported. Supported: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}`,
          migration: `Please upgrade your input to schema version ${SUPPORTED_SCHEMA_VERSIONS.at(-1)}`,
        }],
      };
    }

    const valid = validate(data);
    if (!valid) {
      return {
        valid: false,
        severity: 'CRITICAL',
        errors: validate.errors.map(err => ({
          path: err.instancePath || '/',
          message: err.message,
          keyword: err.keyword,
        })),
      };
    }
    return { valid: true, severity: 'OK', errors: [] };
  };
}
```

### Example 3: Command Frontmatter Structure (Updated)

```yaml
# Source: 项目现有 /gsd:* 命令模式 + Codex Review
---
name: dw:assemble
description: 根据场景组装完整提示
argument-hint: "<scenario> [--context-level=standard] [--json] [--strict]"
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
1. 解析场景名称和参数
2. 读取场景 prompt.md 的 frontmatter
3. 构建 context DAG（检测循环、深度）
4. 根据 includes 加载上下文
5. 计算总 token 数（含 reserve_output）
6. 如超限：
   - 交互模式：告警并提示用户选择
   - 批处理模式：按优先级裁剪或报错
7. 输出组装结果（含 trace）

**输出格式：**
- 默认：Markdown（给模型）
- --json：JSON（给 CI/调试），包含 trace、token breakdown、依赖图
</process>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| js-yaml (YAML 1.1) | yaml (YAML 1.2) | 持续 | 避免 on/yes 布尔陷阱 |
| inquirer (legacy) | @inquirer/prompts | 2023 | ESM 原生，体积减少 50%，支持独立导入 |
| 字符数估算 token | Anthropic count_tokens API | 2024 | 精确计数，免费调用 |
| ajv 6 (draft-04) | ajv 8 (draft-2020-12) | 2021 | 支持最新 JSON Schema 规范 |
| 自定义命令格式 | Claude Code Skills 合并 | 2025.10 | commands/ 和 skills/ 统一，更灵活 |
| Node.js 20 LTS | Node.js 22 LTS | 2024.10 | 支持到 2027-04，更长生命周期 |

**Deprecated/outdated:**
- `inquirer` 旧版包：仍可用但不再活跃开发，新项目用 `@inquirer/prompts`
- `@anthropic-ai/tokenizer`：仅适用于 Claude 3 之前的模型，现在用 API
- `js-yaml`：仍广泛使用但 YAML 1.1 有布尔陷阱，新项目建议 `yaml`

---

## Open Questions

1. **Token 计数离线方案**
   - What we know: Anthropic API 提供精确计数，但需要网络请求和 API key
   - What's unclear: 完全离线环境（如 air-gapped CI）如何处理
   - Recommendation: 保守估算 fallback + 可选校准模式（在线少量样本拟合后离线使用）
   - **Resolution:** 设计为 API-optional，无 key 时自动降级

2. **Skills vs Commands 选择**
   - What we know: Claude Code 支持两种扩展方式，功能等价
   - What's unclear: 长期来看是否会分化
   - Recommendation: 使用 commands/（与现有 /gsd:* 一致），观察社区动向

3. **多平台扩展的配置热加载**
   - What we know: 用户决定通过添加 `platform/*.md` 扩展新平台
   - What's unclear: 运行时是否需要重新加载配置
   - Recommendation: 每次命令执行时重新扫描配置（简单可靠）

---

## Sources

### Primary (HIGH confidence)
- [Claude Code Plugin Architecture](https://github.com/anthropics/claude-code/blob/main/plugins/README.md) - 官方插件结构
- [Anthropic Token Counting API](https://platform.claude.com/docs/en/build-with-claude/token-counting) - 官方文档
- [gray-matter npm](https://www.npmjs.com/package/gray-matter) - frontmatter 解析
- [yaml npm](https://www.npmjs.com/package/yaml) - YAML 1.2 解析
- [ajv npm](https://www.npmjs.com/package/ajv) - JSON Schema 校验
- [Anthropic Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) - 技能编写规范
- [commander npm](https://www.npmjs.com/package/commander) - CLI 参数解析

### Secondary (MEDIUM confidence)
- [@inquirer/prompts npm](https://www.npmjs.com/package/@inquirer/prompts) - CLI 交互
- [Claude Code Skills Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) - 技能机制分析
- [Claude Prompt Engineering Best Practices 2026](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026) - 提示工程模式

### Tertiary (LOW confidence - 需验证)
- Token 估算规则"4字符≈1token"对英文约 80% 准确
- 中文 token 密度范围 1-2.5 字符/token 基于社区经验

### Review Sources
- **Codex Review (2026-02-01)** - OpenAI GPT-4.1 审阅，补充了配置优先级、DAG 构建、schema 版本化、batch 输出契约、测试要求等内容

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 库均有官方文档和广泛使用，经 Codex 确认
- Architecture: HIGH - 基于项目现有 /gsd:* 模式 + Codex 补充的最佳实践
- Pitfalls: HIGH - 初版 MEDIUM，经 Codex 补充后升级
- Testing: MEDIUM - 测试策略明确，需实际验证

**Research date:** 2026-02-01
**Codex review date:** 2026-02-01
**Valid until:** 2026-03-01（30 天，技术栈稳定）

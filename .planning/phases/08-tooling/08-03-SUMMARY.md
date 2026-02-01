---
phase: 08-tooling
plan: 03
subsystem: tooling
tags: [nodejs, esm, gray-matter, ajv, yaml, commander, cli]

# Dependency graph
requires:
  - phase: 08-01
    provides: scenarios.yaml/platforms.yaml/assembly-rules.yaml 配置文件和 JSON schemas
provides:
  - assemble.js 提示组装脚本，支持 --json/--trace 输出
  - validate.js 分级校验脚本，支持 --strict 模式
  - scaffold.js 脚手架生成脚本，自动更新配置
  - package.json 依赖声明，支持 npm scripts
affects: [dw-commands, ci-integration, new-scenario-creation]

# Tech tracking
tech-stack:
  added: [gray-matter@4.0.3, yaml@2.6.0, ajv@8.17.1, ajv-formats@3.0.1, ajv-errors@3.0.0, commander@12.1.0]
  patterns: [ESM modules, CLI with commander, token estimation, context DAG]

key-files:
  created:
    - .claude/data-warehouse/package.json
    - .claude/data-warehouse/scripts/assemble.js
    - .claude/data-warehouse/scripts/validate.js
    - .claude/data-warehouse/scripts/scaffold.js
    - .claude/data-warehouse/package-lock.json
  modified: []

key-decisions:
  - "ESM only (type: module) - 与现代 npm 生态一致"
  - "Node.js >= 22 - 支持到 2027-04，原生 ESM"
  - "Token 估算 1:1 保守策略 - 1 中文字符 = 1 token + 10% buffer"
  - "分级校验 CRITICAL/WARNING/INFO - 与评审场景 P0/P1/P2 对齐"
  - "scaffold 自动更新 scenarios.yaml - 减少手动配置步骤"

patterns-established:
  - "CLI 参数模式: commander + --json + --help"
  - "配置加载模式: yaml 1.2 + uniqueKeys: true"
  - "安全路径解析: realpath + baseDir 约束"
  - "错误处理模式: exit 0/1/2 (成功/业务失败/参数错误)"

# Metrics
duration: 5min
completed: 2026-02-01
---

# Phase 8 Plan 03: 核心辅助脚本 Summary

**创建 assemble.js/validate.js/scaffold.js 三个核心脚本，实现提示组装、规格校验、脚手架生成功能，支持 --json 输出模式**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-01T10:14:34Z
- **Completed:** 2026-02-01T10:19:43Z
- **Tasks:** 3
- **Files created:** 5

## Accomplishments

- 创建 package.json，声明所有核心依赖（gray-matter, yaml, ajv, commander）
- 实现 assemble.js，支持场景组装、上下文加载、token 预算控制、--json/--trace 输出
- 实现 validate.js，支持分级校验（CRITICAL/WARNING/INFO）、--json/--strict 模式
- 实现 scaffold.js，支持新场景脚手架生成，自动更新 scenarios.yaml
- 所有脚本使用 ESM 格式，通过语法检查和 --help 验证

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建 package.json 和 assemble.js** - `760d761` (feat)
2. **Task 2: 创建 validate.js 和 scaffold.js** - `4092461` (feat)
3. **Task 3: 安装依赖并验证脚本可运行** - `f47b007` (chore)

## Files Created

| 文件 | 行数 | 说明 |
|------|------|------|
| `.claude/data-warehouse/package.json` | 21 | npm 依赖声明 |
| `.claude/data-warehouse/scripts/assemble.js` | 511 | 提示组装逻辑 |
| `.claude/data-warehouse/scripts/validate.js` | 517 | 规格校验逻辑 |
| `.claude/data-warehouse/scripts/scaffold.js` | 538 | 脚手架生成逻辑 |
| `.claude/data-warehouse/package-lock.json` | 234 | 依赖锁定版本 |

## 功能验证

### assemble.js

```bash
node scripts/assemble.js design-new-model --json --trace
# 输出: 组装后的提示 + token breakdown + trace 信息
```

支持参数：
- `--context-level <level>` - 上下文加载级别
- `--platform <platform>` - 目标平台
- `--json` - JSON 格式输出
- `--trace` - 包含上下文来源追踪

### validate.js

```bash
node scripts/validate.js design-new-model --input=./input.json --json --strict
# 输出: 分级校验报告（CRITICAL/WARNING/INFO）
```

支持参数：
- `--input <file>` - 输入文件路径
- `--output <file>` - 输出文件路径
- `--json` - JSON 格式报告
- `--strict` - WARNING 也导致 exit 1

### scaffold.js

```bash
node scripts/scaffold.js data-profiling --name="数据画像"
# 创建: prompts/scenarios/data-profiling/ 目录结构
# 更新: config/scenarios.yaml
```

支持参数：
- `--name <name>` - 场景中文名称
- `--json` - JSON 格式结果

## Decisions Made

| 决策 | 选择 | 理由 |
|------|------|------|
| 模块系统 | ESM only | 与 @inquirer/prompts 等现代库兼容 |
| Node 版本 | >= 22 | 支持到 2027-04，原生 ESM |
| Token 估算 | 保守 1:1 | 1 中文字符 = 1 token + 10% buffer |
| 错误分级 | CRITICAL/WARNING/INFO | 与评审场景 P0/P1/P2 对齐 |
| 配置更新 | scaffold 自动更新 | 减少手动配置步骤 |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - 所有脚本均通过语法检查和功能验证。

## Next Phase Readiness

- 三个核心脚本已就绪，可被 `/dw:*` 命令调用
- 依赖已安装，可直接运行 `npm run assemble/validate/scaffold`
- **Phase 8 完成** - 所有工具化计划已执行

---
*Phase: 08-tooling*
*Completed: 2026-02-01*

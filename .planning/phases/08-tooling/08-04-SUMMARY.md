---
phase: 08-tooling
plan: 04
subsystem: tooling
tags: [claude-code, slash-commands, dw-assistant, prompt-system]

# Dependency graph
requires:
  - phase: 08-01
    provides: scenarios.yaml, assembly-rules.yaml 配置文件
  - phase: 08-03
    provides: scripts/assemble.js, scripts/validate.js, scripts/scaffold.js 辅助脚本
provides:
  - /dw:design 设计新模型命令
  - /dw:review 评审已有模型命令
  - /dw:generate-sql 生成 SQL 命令
  - /dw:define-metric 定义指标命令
  - /dw:generate-dq 生成 DQ 规则命令
  - /dw:analyze-lineage 血缘分析命令
  - /dw:assemble 提示组装命令
  - /dw:validate 输入校验命令
  - /dw:new-scenario 场景脚手架命令
affects: [future-scenarios, user-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "命令文件格式：frontmatter + objective + execution_context + context + process + success_criteria"
    - "场景命令引用对应 prompt.md 和上下文文件"
    - "工具命令调用 scripts/ 下的辅助脚本"

key-files:
  created:
    - .claude/commands/dw/design.md
    - .claude/commands/dw/review.md
    - .claude/commands/dw/generate-sql.md
    - .claude/commands/dw/define-metric.md
    - .claude/commands/dw/generate-dq.md
    - .claude/commands/dw/analyze-lineage.md
    - .claude/commands/dw/assemble.md
    - .claude/commands/dw/validate.md
    - .claude/commands/dw/new-scenario.md
  modified:
    - .gitignore

key-decisions:
  - "命令格式与 /gsd:* 风格保持一致"
  - "场景命令的 context 部分直接引用 prompt.md frontmatter includes 列表"
  - "工具命令通过 Bash 调用 scripts/ 下的 Node.js 脚本"
  - "更新 .gitignore 排除 .claude/commands/dw/ 目录"

patterns-established:
  - "/dw:* 命令命名规范：场景用动词（design/review/generate-sql）、工具用名词动词（assemble/validate/new-scenario）"
  - "两段/三段式交互在命令 process 中明确说明"

# Metrics
duration: 3min
completed: 2026-02-01
---

# Phase 8 Plan 4: /dw:* 命令文件 Summary

**创建 9 个 Claude Code 斜杠命令，让用户通过 /dw:design、/dw:review 等命令使用数仓助手功能**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-01T10:15:10Z
- **Completed:** 2026-02-01T10:18:06Z
- **Tasks:** 2
- **Files created:** 9 (+ 1 modified)

## Accomplishments

- 创建 6 个场景命令文件，覆盖数仓助手全部六大核心场景
- 创建 3 个工具命令文件，提供提示组装、输入校验、场景脚手架功能
- 命令格式与 /gsd:* 风格一致，包含中文描述和帮助信息
- 每个场景命令正确引用对应的 prompt.md 和上下文文件

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建 6 个场景命令** - `8012fe3` (feat)
   - design.md, review.md, generate-sql.md, define-metric.md, generate-dq.md, analyze-lineage.md
   - 同时更新 .gitignore 排除 .claude/commands/dw/

2. **Task 2: 创建 3 个工具命令** - `3b55a4d` (feat)
   - assemble.md, validate.md, new-scenario.md

## Files Created/Modified

### 场景命令（6 个）

| 命令 | 场景 | 主要功能 |
|------|------|----------|
| `.claude/commands/dw/design.md` | design-new-model | 设计事实表/维度表 |
| `.claude/commands/dw/review.md` | review-existing-model | 评审模型规范性 |
| `.claude/commands/dw/generate-sql.md` | generate-sql | 生成 Hive SQL |
| `.claude/commands/dw/define-metric.md` | define-metrics | 定义标准化指标 |
| `.claude/commands/dw/generate-dq.md` | generate-dq-rules | 生成 DQ 规则 |
| `.claude/commands/dw/analyze-lineage.md` | analyze-lineage | 分析数据血缘 |

### 工具命令（3 个）

| 命令 | 脚本调用 | 主要功能 |
|------|----------|----------|
| `.claude/commands/dw/assemble.md` | scripts/assemble.js | 组装完整提示 |
| `.claude/commands/dw/validate.md` | scripts/validate.js | 校验输入/输出 |
| `.claude/commands/dw/new-scenario.md` | scripts/scaffold.js | 创建场景脚手架 |

### 配置更新

- `.gitignore` - 添加 `!.claude/commands/` 和 `!.claude/commands/dw/` 排除规则

## Decisions Made

1. **命令格式与 /gsd:* 一致** — 保持项目风格统一，降低用户学习成本
2. **context 部分引用 includes 列表** — 从 prompt.md frontmatter 获取上下文文件列表，确保一致性
3. **工具命令调用 Node.js 脚本** — 通过 `cd .claude/data-warehouse && node scripts/xxx.js $ARGUMENTS` 调用，与 08-03 脚本对接
4. **更新 .gitignore** — 原 `.claude/*` 规则排除了命令目录，需添加排除规则

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 更新 .gitignore 排除命令目录**
- **Found during:** Task 1 (创建场景命令)
- **Issue:** `.claude/*` 被 .gitignore 忽略，git add 失败
- **Fix:** 添加 `!.claude/commands/` 和 `!.claude/commands/dw/` 排除规则
- **Files modified:** .gitignore
- **Verification:** git add 成功，文件可提交
- **Committed in:** 8012fe3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** .gitignore 更新是必要的，否则命令文件无法纳入版本控制。无scope creep。

## Issues Encountered

None - plan executed smoothly after .gitignore fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

### 已完成

- Phase 8 所有计划已执行完毕
- 数仓助手 v1 全系统已交付

### 可验证项

- 用户可运行 `/dw:design` 触发设计场景
- 用户可运行 `/dw:review` 触发评审场景
- 用户可运行 `/dw:assemble` 组装提示
- 用户可运行 `/dw:validate` 校验输入
- 所有命令包含中文描述和帮助信息

### 后续建议

1. 运行 `/gsd:verify-work 8` 执行 Phase 8 验收测试
2. 运行 `/gsd:audit-milestone` 审计整个 v1 里程碑
3. 编写用户使用文档（README）

---
*Phase: 08-tooling*
*Completed: 2026-02-01*

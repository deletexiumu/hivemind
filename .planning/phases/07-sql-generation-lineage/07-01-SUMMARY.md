---
phase: 07-sql-generation-lineage
plan: 01
subsystem: prompts
tags: [sql-generation, hive, two-stage, validator, time-expressions]

# Dependency graph
requires:
  - phase: 04-design-new-model
    provides: Two-stage interaction pattern, output template format
  - phase: 06-governance-scenarios
    provides: Validator pattern (P0/P1/P2), precision levels (A/B/C/D)
provides:
  - SQL generation main prompt (two-stage interaction)
  - SQL output template (SQL + Validator + 5 supporting docs)
  - Dynamic time expressions cheat sheet
affects: [07-02, 07-03, 08-tooling]

# Tech tracking
tech-stack:
  added: []
  patterns: [two-stage-sql-generation, validator-self-check, partition-aware-generation]

key-files:
  created:
    - .claude/data-warehouse/prompts/scenarios/generate-sql/prompt.md
    - .claude/data-warehouse/prompts/scenarios/generate-sql/output-template.md
    - .claude/data-warehouse/prompts/scenarios/generate-sql/time-expressions.md
  modified: []

key-decisions:
  - "8 categories of required questions (A-H) for Stage 1 confirmation"
  - "Validator with P0 (blocking) / P1 (warning) / P2 (info) three levels"
  - "Dynamic time expressions preferred over hardcoded dates"
  - "Partition filter enforcement as mandatory mechanism"

patterns-established:
  - "SQL Output Bundle: SQL + Validator + specification + performance tips + dependencies"
  - "Partition predicate template: bare column comparison for pruning"
  - "SCD2 semantic locking: must confirm is_current vs as-of before generation"

# Metrics
duration: 8min
completed: 2026-02-01
---

# Phase 7 Plan 01: SQL Generation Core Prompt System Summary

**两段式 SQL 生成提示系统：8 类必问项 + Validator 自检 + 动态时间表达速查表**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-01T05:05:56Z
- **Completed:** 2026-02-01T05:14:00Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- 创建 SQL 生成场景主提示，实现两段式交互模式（Stage 1 确认 + Stage 2 生成）
- 设计 8 类必问项清单（A-H），覆盖取数目标、数据源、分区、时间、过滤、SCD2、聚合、成本
- 实现 Validator 自检机制，分 P0/P1/P2 三级（阻断/警告/提示）
- 创建动态时间表达速查表，包含 8+ 种常见时间窗表达和分区谓词模板

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建 SQL 生成主提示 prompt.md** - `23978c1` (feat)
2. **Task 2: 创建 SQL 生成输出模板 output-template.md** - `97d92e7` (feat)
3. **Task 3: 创建动态时间表达速查表 time-expressions.md** - `876a8da` (feat)

## Files Created

- `.claude/data-warehouse/prompts/scenarios/generate-sql/prompt.md` - SQL 生成主提示（两段式交互 + 8 类必问项 + Validator 清单）
- `.claude/data-warehouse/prompts/scenarios/generate-sql/output-template.md` - 输出模板（Stage 1 确认 + Stage 2 完整产物）
- `.claude/data-warehouse/prompts/scenarios/generate-sql/time-expressions.md` - 动态时间表达速查表（Hive 3.x 日期函数）

## Decisions Made

1. **8 类必问项设计（A-H）** — 覆盖 SQL 生成所有关键信息，确保 Stage 1 一次确认无遗漏
2. **Validator P0/P1/P2 分级** — P0 阻断（分区过滤、笛卡尔积）、P1 警告（JOIN 放大、SCD2）、P2 提示（性能建议）
3. **动态时间表达优先** — 默认使用 DATE_SUB/TRUNC/ADD_MONTHS，避免硬编码日期
4. **分区谓词模板** — 强制"裸字段比较常量"写法，禁止对分区列做函数/CAST

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SQL 生成核心提示系统完成，可用于生成 Hive SQL
- 下一步：创建 SQL 生成案例库（07-02-PLAN.md 已计划 3 个案例）
- 依赖：已有血缘分析增强（07-02）可复用 Validator 模式

---
*Phase: 07-sql-generation-lineage*
*Plan: 01*
*Completed: 2026-02-01*

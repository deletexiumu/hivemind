---
phase: 05-review-existing-model
plan: 01
subsystem: prompts
tags: [review, issue-classification, checklist, P0-P3, quality-score]

# Dependency graph
requires:
  - phase: 04-design-new-model
    provides: 7个精简版上下文文件(*-core.md)用于规则追溯
provides:
  - 问题分级标准(P0-P3)与评分机制(门禁+质量分)
  - 五大检查维度的33条结构化规则
  - 评审场景目录结构
affects: [05-02, 05-03, Phase 6 治理场景]

# Tech tracking
tech-stack:
  added: []
  patterns: [issue-severity-levels, gate-plus-score, checklist-driven-review]

key-files:
  created:
    - .claude/data-warehouse/prompts/scenarios/review-existing-model/issue-classification.md
    - .claude/data-warehouse/prompts/scenarios/review-existing-model/review-checklist.md
  modified: []

key-decisions:
  - "P0门禁机制: P0>0则结论=不通过，与quality_score解耦"
  - "质量分仅计P1/P2/P3: P1(-10), P2(-3), P3(-1)"
  - "三态结论: 不通过/通过/有条件通过"
  - "检查项ID格式: {维度前缀}{序号}，如N01/L01/G01/F01/D01"

patterns-established:
  - "检查清单格式: ID | 检查项 | 级别 | 规则"
  - "规则来源引用: 每个维度标注源自哪个*-core.md文档"

# Metrics
duration: 12min
completed: 2026-02-01
---

# Phase 5 Plan 01: 问题分级与检查清单 Summary

**P0-P3四级问题分级标准 + 门禁/质量分评分机制 + 五大检查维度33条规则清单**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-01T00:36:00Z
- **Completed:** 2026-02-01T00:48:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- 建立 P0/P1/P2/P3 四级问题分级标准，P0 作为门禁阻断机制
- 设计门禁 + 质量分评分体系，支持三态结论（不通过/通过/有条件通过）
- 创建五大检查维度（命名/分层/粒度/字段/dbt）共 33 条规则
- 每条规则可追溯到项目已有的 *-core.md 规范文档

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建场景目录结构** - `25b5bfc` (chore)
2. **Task 2: 创建问题分级文档** - `e22834c` (feat)
3. **Task 3: 创建检查清单文档** - `cb57581` (feat)

## Files Created/Modified

- `.claude/data-warehouse/prompts/scenarios/review-existing-model/.gitkeep` - 目录占位
- `.claude/data-warehouse/prompts/scenarios/review-existing-model/issue-classification.md` - P0-P3 分级标准与评分机制
- `.claude/data-warehouse/prompts/scenarios/review-existing-model/review-checklist.md` - 五大维度 33 条检查规则

## Decisions Made

1. **P0 门禁与质量分解耦** - P0 仅作为 pass/fail 门禁，quality_score 仅反映 P1-P3 的设计质量
2. **检查项 ID 命名规范** - 采用 {维度前缀}{序号} 格式（N=命名, L=分层, G=粒度, F=字段, D=dbt）
3. **规则来源强制引用** - 每个检查维度必须标注源自哪个 *-core.md 文档，确保与 Phase 4 设计场景一致

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered

None

## User Setup Required

None - no external service configuration required

## Next Phase Readiness

- issue-classification.md 和 review-checklist.md 已就绪，可供 05-02（主提示文件）引用
- 33 条检查规则覆盖五大维度，为 prompt.md 的检查逻辑提供基础
- 评分机制已明确，Stage 1 输出可直接使用

---
*Phase: 05-review-existing-model*
*Completed: 2026-02-01*

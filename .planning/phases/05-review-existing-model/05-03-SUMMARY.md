---
phase: 05-review-existing-model
plan: 03
subsystem: prompts
tags: [review, examples, quality-gate, checklist, dbt]

# Dependency graph
requires:
  - phase: 05-01
    provides: issue-classification, review-checklist (33 rules)
  - phase: 05-02
    provides: prompt.md, output-template.md, fix-suggestions.md
provides:
  - 3 review examples covering high/medium/low quality models
  - Good-model example (pass, score 97)
  - Naming-issues example (conditional pass, score 67)
  - Multiple-issues example (fail, P0 gate)
affects: [06-governance, 08-tooling, documentation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Example format: Input -> Stage 1 -> Stage 2 -> Summary
    - Rule ID references (N01-N10, L01-L05, G01-G05, F01-F06, D01-D07)

key-files:
  created:
    - .claude/data-warehouse/prompts/scenarios/review-existing-model/examples/good-model.md
    - .claude/data-warehouse/prompts/scenarios/review-existing-model/examples/naming-issues.md
    - .claude/data-warehouse/prompts/scenarios/review-existing-model/examples/multiple-issues.md

key-decisions:
  - "Example structure matches Phase 4 design-new-model format for consistency"
  - "Rule IDs referenced throughout for checklist traceability"
  - "P0 gate demonstrated with quality score irrelevant when P0 > 0"

patterns-established:
  - "Review example format: frontmatter + input + Stage 1 + Stage 2 + summary"
  - "Quality level coverage: high (pass) / medium (conditional) / low (fail)"

# Metrics
duration: 2min 23s
completed: 2026-02-01
---

# Phase 05 Plan 03: Review Examples Summary

**3 个模型评审案例覆盖高/中/低质量等级，展示完整两段式交互和 P0 门禁机制**

## Performance

- **Duration:** 2min 23s
- **Started:** 2026-01-31T16:47:55Z
- **Completed:** 2026-01-31T16:50:18Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- 创建 examples/ 目录和 3 个质量等级案例
- good-model.md：高质量模型（通过，97 分，仅 1 个 P2）
- naming-issues.md：命名问题模型（有条件通过，67 分，3 个 P1）
- multiple-issues.md：严重缺陷模型（不通过，P0 门禁触发）
- 所有案例均引用 review-checklist.md 的规则 ID

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建案例目录并创建高质量模型案例 good-model.md** - `eb9e8d1` (feat)
2. **Task 2: 创建命名问题案例 naming-issues.md** - `0d99214` (feat)
3. **Task 3: 创建多问题案例 multiple-issues.md** - `abe1b1f` (feat)

## Files Created

| 文件 | 说明 |
|------|------|
| `examples/good-model.md` | 高质量模型案例（通过，97 分） |
| `examples/naming-issues.md` | 命名问题案例（有条件通过，67 分） |
| `examples/multiple-issues.md` | 多问题案例（不通过，P0 门禁） |

## Decisions Made

| 决策 | 理由 |
|------|------|
| 案例结构统一 | 与 Phase 4 design-new-model 案例格式一致：输入 -> Stage 1 -> Stage 2 -> 要点 |
| 规则 ID 引用 | 每个问题关联 review-checklist.md 规则 ID（如 N01, L02, G02） |
| P0 门禁演示 | multiple-issues.md 展示 P0 > 0 时结论为"不通过"，质量分仅供参考 |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Phase 5 完成状态：**
- [x] 05-01: 问题分级 + 检查清单（33 条规则）
- [x] 05-02: 主提示 + 输出模板 + 修复建议模板
- [x] 05-03: 3 个案例（good-model/naming-issues/multiple-issues）

**可交付物完整性：**
- prompt.md: 主提示文件
- issue-classification.md: P0-P3 分级规则
- review-checklist.md: 33 条检查规则
- output-template.md: 两段式输出模板
- fix-suggestions.md: S/M/L/XL 修复建议模板
- examples/: 3 个案例覆盖三种评审结论

**Ready for Phase 6:** 评审场景完整，可进入治理场景（指标/DQ/血缘）。

---

*Phase: 05-review-existing-model*
*Plan: 03*
*Completed: 2026-02-01*

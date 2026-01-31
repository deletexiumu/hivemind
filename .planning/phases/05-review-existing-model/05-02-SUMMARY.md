---
phase: 05-review-existing-model
plan: 02
subsystem: prompts
tags: [review, prompt-engineering, two-stage-interaction, fix-suggestions]

# Dependency graph
requires:
  - phase: 05-01
    provides: 问题分级标准（P0-P3）+ 评审检查清单（33 条规则）
  - phase: 04-02
    provides: 两段式交互模式参考（Stage 1 规格书 + Stage 2 完整产物）
provides:
  - 评审场景主提示文件 prompt.md（4-block 结构 + 两段式交互）
  - 输出模板 output-template.md（Stage 1 问题概览 + Stage 2 修复建议格式）
  - 修复建议模板 fix-suggestions.md（S/M/L/XL 四档详细度规则）
affects: [05-03, 06-review-existing-model, 08-tooling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 两段式交互模式（Stage 1 概览 + Stage 2 详细）
    - 智能范围评审（根据输入确定可评审维度）
    - 修复建议分档（S/M/L/XL）

key-files:
  created:
    - .claude/data-warehouse/prompts/scenarios/review-existing-model/prompt.md
    - .claude/data-warehouse/prompts/scenarios/review-existing-model/output-template.md
    - .claude/data-warehouse/prompts/scenarios/review-existing-model/fix-suggestions.md
  modified: []

key-decisions:
  - "两段式交互：Stage 1 输出问题概览，Stage 2 输出详细修复建议"
  - "智能范围评审：根据输入内容（SQL/元信息/schema.yml/DDL）确定可评审维度"
  - "修复建议分档：S（单点）/M（同文件联动）/L（逻辑重构）/XL（多文件联动）"
  - "特殊情况处理：问题 <= 2 且无 P0 时自动合并输出精简修复建议"

patterns-established:
  - "评审提示 4-block 结构：INSTRUCTIONS/CONTEXT/TASK/OUTPUT FORMAT"
  - "前后对比格式：当前 vs 修复后 + 修复理由"
  - "检查清单聚合视图：默认仅展开失败项"

# Metrics
duration: 8min
completed: 2026-02-01
---

# Phase 5 Plan 2: 主提示与输出模板 Summary

**评审场景主提示文件 + 两段式交互输出模板 + S/M/L/XL 四档修复建议格式**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-31T16:42:02Z
- **Completed:** 2026-01-31T16:50:00Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- 创建评审场景主提示文件 prompt.md，采用 4-block 结构和两段式交互机制
- 创建输出模板 output-template.md，定义 Stage 1 问题概览和 Stage 2 修复建议格式
- 创建修复建议模板 fix-suggestions.md，定义 S/M/L/XL 四档详细度规则和示例

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建主提示文件 prompt.md** - `888541e` (feat)
2. **Task 2: 创建输出模板文件 output-template.md** - `dd62a4f` (feat)
3. **Task 3: 创建修复建议模板文件 fix-suggestions.md** - `56f0a9d` (feat)

## Files Created

- `.claude/data-warehouse/prompts/scenarios/review-existing-model/prompt.md` - 评审场景主提示，包含 4-block 结构和两段式交互
- `.claude/data-warehouse/prompts/scenarios/review-existing-model/output-template.md` - Stage 1/Stage 2 输出格式模板
- `.claude/data-warehouse/prompts/scenarios/review-existing-model/fix-suggestions.md` - S/M/L/XL 修复建议格式模板

## Decisions Made

1. **两段式交互设计** — 与 Phase 4 设计场景保持一致，Stage 1 输出问题概览减少返工，Stage 2 输出详细修复建议
2. **智能范围评审** — 根据输入内容自动确定可评审维度，缺失信息时先做部分评审并主动追问
3. **修复建议分档** — S/M/L/XL 四档根据改动范围/风险/不确定性分类，确保输出一致性
4. **特殊情况处理** — 问题少（<= 2）且无 P0 时自动合并输出精简修复建议，提高效率

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 评审场景提示系统基础完成
- 准备执行 05-03-PLAN.md 创建评审案例
- 可用于实际评审测试

---
*Phase: 05-review-existing-model*
*Completed: 2026-02-01*

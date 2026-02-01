---
phase: 06-governance-scenarios
plan: 03
subsystem: governance
tags: [dq-rules, dbt-tests, dbt-expectations, hive, quality]

# Dependency graph
requires:
  - phase: 06-01
    provides: dq-rules-core.md 治理上下文基础
  - phase: 04-01
    provides: 精简版上下文文件 (*-core.md)
provides:
  - DQ 规则生成场景主提示 (prompt.md)
  - Stage 1/Stage 2 输出模板 (output-template.md)
  - 事实表 DQ 规则案例 (fact-table-dq.md)
  - 维度表 DQ 规则案例含 SCD2 处理 (dim-table-dq.md)
affects:
  - 06-04 血缘分析场景 (可能引用 DQ 规则检测)
  - 08 工具化 (DQ 规则自动生成)

# Tech tracking
tech-stack:
  added: [dbt-expectations 0.10.x, dbt-utils]
  patterns: [字段类型驱动规则推断, 分层阈值策略, SCD2 有效行过滤]

key-files:
  created:
    - .claude/data-warehouse/prompts/scenarios/generate-dq-rules/prompt.md
    - .claude/data-warehouse/prompts/scenarios/generate-dq-rules/output-template.md
    - .claude/data-warehouse/prompts/scenarios/generate-dq-rules/examples/fact-table-dq.md
    - .claude/data-warehouse/prompts/scenarios/generate-dq-rules/examples/dim-table-dq.md
  modified: []

key-decisions:
  - "8 类必问项清单覆盖 DQ 规则生成所有关键信息"
  - "Stage 1 规则清单包含字段/规则类型/依据/阈值/优先级五列"
  - "SCD2 维度表使用 where: is_current = 1 过滤历史行"
  - "分区过滤使用 date_sub(current_date, N) Hive 语法"

patterns-established:
  - "DQ 规则推断：字段后缀 -> 规则类型映射"
  - "阈值分级：0 容忍(dbt 原生) / 比例(mostly) / 行数(warn_if/error_if)"
  - "SCD2 双重唯一性：代理键全量唯一，自然键当前有效行唯一"

# Metrics
duration: 5min
completed: 2026-02-01
---

# Phase 6 Plan 03: DQ 规则生成场景 Summary

**字段类型驱动的 dbt tests 配置生成，支持事实表和 SCD2 维度表的两段式交互**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-01T01:54:22Z
- **Completed:** 2026-02-01T01:59:00Z
- **Tasks:** 4
- **Files created:** 5

## Accomplishments

- 创建 generate-dq-rules 场景完整目录结构
- 主提示文件实现 8 类必问项清单（分区/窗口/SCD2/阈值/新鲜度等）
- 输出模板覆盖 Stage 1 规则清单预览和 Stage 2 dbt tests YAML
- 两个案例分别展示事实表组合唯一性和维度表 SCD2 有效行过滤

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建 generate-dq-rules 场景目录** - `6a62bb7` (chore)
2. **Task 2: 创建主提示文件 prompt.md** - `2eeeb26` (feat)
3. **Task 3: 创建输出模板文件 output-template.md** - `830aa33` (feat)
4. **Task 4: 创建案例库（事实表 + 维度表）** - `51a5feb` (feat)

## Files Created

- `.claude/data-warehouse/prompts/scenarios/generate-dq-rules/prompt.md` - 4-block 结构主提示，含 8 类必问项清单和规则推断速查表
- `.claude/data-warehouse/prompts/scenarios/generate-dq-rules/output-template.md` - Stage 1 规则清单 + Stage 2 dbt tests YAML 格式模板
- `.claude/data-warehouse/prompts/scenarios/generate-dq-rules/examples/fact-table-dq.md` - 订单明细事实表案例，展示组合唯一性和外键检测
- `.claude/data-warehouse/prompts/scenarios/generate-dq-rules/examples/dim-table-dq.md` - 客户维度表 SCD2 案例，展示有效行过滤

## Decisions Made

1. **8 类必问项分类** — A-H 八个类别覆盖目标/字段/分区/窗口/SCD2/阈值/新鲜度/Hive 方言
2. **规则清单五列格式** — 字段 + 规则类型 + 依据 + 阈值 + 优先级，便于用户确认
3. **SCD2 有效行过滤** — 维度表测试添加 `where: "is_current = 1"` 排除历史版本
4. **Hive 分区过滤语法** — 统一使用 `date_sub(current_date, N)` 控制扫描范围

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DQ 规则生成场景已完成，可继续 06-04 血缘分析场景
- 与 Phase 5 评审场景的检查清单 ID 已建立对应关系
- dbt-expectations 依赖已在模板中标注

---

*Phase: 06-governance-scenarios*
*Completed: 2026-02-01*

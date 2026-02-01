---
phase: 06-governance-scenarios
plan: 02
subsystem: governance
tags: [metrics, semantic-layer, dbt, metricflow, yaml]

# Dependency graph
requires:
  - phase: 06-01
    provides: metrics-core.md 指标分类与 Semantic Layer 格式
provides:
  - define-metrics 场景完整提示系统
  - 两段式交互（Stage 1 规格书 + Stage 2 Semantic Layer YAML）
  - 原子指标和派生指标案例
affects: [06-03, 06-04, 08-tooling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 指标三分法（原子/派生/复合）与 MetricFlow 类型映射
    - Stage 1 必问项（grain、时间字段、可切维度）
    - meta.depends_on 血缘追溯机制

key-files:
  created:
    - .claude/data-warehouse/prompts/scenarios/define-metrics/prompt.md
    - .claude/data-warehouse/prompts/scenarios/define-metrics/output-template.md
    - .claude/data-warehouse/prompts/scenarios/define-metrics/examples/atomic-metric.md
    - .claude/data-warehouse/prompts/scenarios/define-metrics/examples/derived-metric.md

key-decisions:
  - "Stage 1 必问项固定为 grain、时间字段、可切维度（Codex 共识）"
  - "派生指标使用 type_params.metrics 声明依赖，meta.depends_on 冗余声明支持血缘分析"
  - "原子指标过滤条件在 metric 层通过 filter 实现，保持 measure 通用性"

patterns-established:
  - "指标 ID 格式：{domain}_{name}，如 order_total_amount"
  - "派生指标必须在 meta.depends_on 中声明所有依赖指标 ID"
  - "两段式交互：Stage 1 规格书确认后再生成 Stage 2 YAML"

# Metrics
duration: 4min
completed: 2026-02-01
---

# Phase 6 Plan 02: 指标定义场景 Summary

**dbt Semantic Layer 2.0 兼容的指标定义场景提示系统，支持原子/派生指标两段式交互定义**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-01T01:52:46Z
- **Completed:** 2026-02-01T01:56:51Z
- **Tasks:** 4
- **Files created:** 4

## Accomplishments

- 创建 define-metrics 场景完整目录结构
- 实现 4-block 主提示文件（INSTRUCTIONS/CONTEXT/TASK/OUTPUT FORMAT）
- 设计 Stage 1 指标规格书 + Stage 2 Semantic Layer YAML 双输出模板
- 提供原子指标（订单总额）和派生指标（平均客单价）完整案例

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建 define-metrics 场景目录** - 合并到 Task 2（空目录无法单独提交）
2. **Task 2: 创建主提示文件 prompt.md** - `196563d` (feat)
3. **Task 3: 创建输出模板 output-template.md** - `a696f18` (feat)
4. **Task 4: 创建案例库** - `a206a06` (feat)

## Files Created

- `.claude/data-warehouse/prompts/scenarios/define-metrics/prompt.md` - 指标定义场景主提示，4-block 结构 + 两段式交互
- `.claude/data-warehouse/prompts/scenarios/define-metrics/output-template.md` - Stage 1 规格书 + Stage 2 Semantic Layer YAML 模板
- `.claude/data-warehouse/prompts/scenarios/define-metrics/examples/atomic-metric.md` - 原子指标案例（订单总额，type: simple）
- `.claude/data-warehouse/prompts/scenarios/define-metrics/examples/derived-metric.md` - 派生指标案例（平均客单价，type: derived + depends_on）

## Decisions Made

| 决策 | 选择 | 理由 |
|------|------|------|
| Stage 1 必问项 | grain、时间字段、可切维度 | Codex 共识，确保 semantic_model 完整性 |
| 依赖声明位置 | type_params.metrics + meta.depends_on | 前者 MetricFlow 必需，后者支持血缘分析工具 |
| 过滤条件位置 | metric 层 filter 而非 measure | 保持 measure 通用性，业务过滤在指标层 |
| 分母为零处理 | NULLIF 返回 NULL | 无订单时不计算，避免除零错误 |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Task 1 空目录无法单独 git 提交，合并到 Task 2 提交（正常行为）

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- define-metrics 场景完整就绪，可支持指标定义工作流
- 提供 metrics-core.md 上下文引用，与 06-01 完整集成
- 案例覆盖原子和派生两种最常见指标类型
- 06-03（DQ 规则场景）和 06-04（血缘分析场景）可并行开发

---
*Phase: 06-governance-scenarios*
*Plan: 02*
*Completed: 2026-02-01*

---
phase: 04-design-new-model
plan: 02
subsystem: prompts
tags: [prompt-engineering, two-stage-interaction, star-schema, dbt-template, output-template]

# Dependency graph
requires:
  - phase: 04-01
    provides: 7 个精简版上下文文件 (*-core.md)
provides:
  - 设计新模型场景主提示文件 (prompt.md)
  - 输出格式模板 (output-template.md)
  - 两段式交互机制 (Stage 1 规格书 + Stage 2 完整产物)
affects: [04-03, phase-5, phase-8]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "两段式交互模式：Stage 1 建模规格书 + Stage 2 完整产物"
    - "4-block 结构化提示：INSTRUCTIONS/CONTEXT/TASK/OUTPUT FORMAT"
    - "运行时注入机制：CONTEXT_PLACEHOLDER + includes 声明"
    - "输出交付契约：### File: {path} 格式"

key-files:
  created:
    - .claude/data-warehouse/prompts/scenarios/design-new-model/prompt.md
    - .claude/data-warehouse/prompts/scenarios/design-new-model/output-template.md
  modified: []

key-decisions:
  - "两段式交互：Stage 1 输出规格书让用户确认，Stage 2 才生成代码，减少返工"
  - "必填最小集：业务事件 + 粒度，指标需求作为推荐信息（缺失时推断）"
  - "运行时注入：Phase 4 手动组装，Phase 8 工具化自动组合"
  - "输出交付契约：使用 ### File: {path} 格式便于后续自动落盘"

patterns-established:
  - "场景提示目录结构：prompt.md + output-template.md + examples/"
  - "Stage 1 输出结构：输入解析 + 决策摘要 + 假设清单 + 完整度评估 + 待确认"
  - "Stage 2 输出结构：星型图 + 事实表 + 维度表 + 分层落点 + dbt 模板"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 4 Plan 02: Prompt & Output Template Summary

**创建"设计新模型"场景的主提示文件和输出模板，实现两段式交互机制，覆盖 DESIGN-01 ~ DESIGN-06 需求**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-31T11:03:33Z
- **Completed:** 2026-01-31T11:05:59Z
- **Tasks:** 3
- **Files created:** 2

## Accomplishments

- 创建主提示文件 prompt.md（~440 字，约 1200 tokens）
- 创建输出模板文件 output-template.md（~745 字，约 700 tokens）
- 实现两段式交互：Stage 1 建模规格书 + Stage 2 完整产物
- 实现 4-block 结构化提示：INSTRUCTIONS/CONTEXT/TASK/OUTPUT FORMAT
- 配置运行时注入机制：includes 声明 7 个 *-core 文件
- 定义输出交付契约：`### File: {path}` 格式
- 内嵌简单案例展示 Stage 1 输出格式

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建场景目录结构** - (merged with Task 2, empty dir not trackable)
2. **Task 2: 创建主提示文件 prompt.md** - `ec62e95` (feat)
3. **Task 3: 创建输出模板文件 output-template.md** - `30901a9` (feat)

## Files Created

| 文件 | 用途 | 字数 | Token 估算 |
|------|------|------|------------|
| `prompt.md` | 场景主提示（4-block 结构） | 440 | ~1200 |
| `output-template.md` | Stage 2 输出格式模板 | 745 | ~700 |

## Requirements Coverage

| 需求 | 实现位置 | 状态 |
|------|----------|------|
| DESIGN-01: 输入业务事件/指标/粒度，输出星型模型 | prompt.md TASK 块 | Done |
| DESIGN-02: 事实表定义（粒度、度量、DDL、schema.yml） | output-template.md 第 2 节 | Done |
| DESIGN-03: 维度表定义（SCD、自然键/代理键、DDL） | output-template.md 第 3 节 | Done |
| DESIGN-04: 分层落点建议 | output-template.md 第 4 节 | Done |
| DESIGN-05: dbt model 模板 | output-template.md 第 5 节 | Done |
| DESIGN-06: 事实表标准字段 | output-template.md 第 2 节标准字段表 | Done |

## Decisions Made

1. **两段式交互**: Stage 1 先输出规格书让用户确认，Stage 2 才生成完整代码，避免生成后大改导致返工
2. **必填最小集**: 仅"业务事件"和"粒度"为必填，指标需求作为推荐信息，其他可选，体现"少追问多推断"原则
3. **运行时注入**: Phase 4 由执行者手动组装/注入上下文，Phase 8 才工具化自动组合
4. **输出交付契约**: 使用 `### File: {path}` 格式，便于后续工具化自动落盘

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- prompt.md 和 output-template.md 就绪，可供 Plan 03 创建输入模板和案例
- 两段式交互机制已定义，Plan 03 可基于此创建测试案例
- 输出交付契约已定义，Phase 8 工具化可基于此实现自动落盘

---
*Phase: 04-design-new-model*
*Completed: 2026-01-31*

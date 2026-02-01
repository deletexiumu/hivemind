---
phase: 06-governance-scenarios
plan: 04
subsystem: governance
tags: [lineage, blood-relation, mermaid, dbt, sql-parsing, confidence-level]

# Dependency graph
requires:
  - phase: 06-01
    provides: metrics-core.md, dq-rules-core.md (治理上下文基础)
  - phase: 03-02
    provides: dbt-hive-limitations-core.md (平台约束)
  - phase: 02-03
    provides: layering-system-core.md (分层体系)
provides:
  - analyze-lineage 场景完整提示系统
  - 表级血缘分析（Mermaid 图 + 依赖清单）
  - 字段级血缘分析（映射表 + 置信度标注 A-D）
  - 2 个血缘分析案例（表级/字段级）
affects: [phase-07, phase-08, impact-analysis]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 两段式交互（Stage 1 表级 + Stage 2 字段级）
    - 精度等级标注（A/B/C/D 置信度）
    - Mermaid 分层着色约定

key-files:
  created:
    - .claude/data-warehouse/prompts/scenarios/analyze-lineage/prompt.md
    - .claude/data-warehouse/prompts/scenarios/analyze-lineage/output-template.md
    - .claude/data-warehouse/prompts/scenarios/analyze-lineage/examples/table-level.md
    - .claude/data-warehouse/prompts/scenarios/analyze-lineage/examples/column-level.md
  modified: []

key-decisions:
  - "两段式血缘交互：Stage 1 表级概览 + Stage 2 字段级详细"
  - "精度等级 A-D：A 高置信/B 中置信/C 低置信/D 需人工确认"
  - "dbt 优先解析：ref()/source() 调用优先于原生表名"
  - "静态解析优先：先做 AST 解析，复杂结构再用 LLM 补全"
  - "Mermaid 分层着色：ODS 淡蓝/维度淡黄/事实淡绿/汇总淡紫"

patterns-established:
  - "字段映射表格式：目标字段|源表|源字段|转换|置信度|方法|标记"
  - "字段标记类型：GENERATED/EXPR/CASE/CTE/AGG/WINDOW/UDF/STAR_EXPANSION"

# Metrics
duration: 4min
completed: 2026-02-01
---

# Phase 6 Plan 04: 血缘分析场景 Summary

**表级血缘（Mermaid 图 + 依赖清单）与字段级血缘（映射表 + A-D 置信度标注）的两段式分析系统，支持 dbt ref()/source() 解析**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-01T01:55:37Z
- **Completed:** 2026-02-01T01:59:12Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- 创建 analyze-lineage 场景目录结构
- 实现两段式交互（Stage 1 表级 + Stage 2 字段级）
- 定义精度等级 A-D 及处理策略
- 完成 2 个典型案例（多表 JOIN 表级血缘、窗口函数字段级血缘）

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建 analyze-lineage 场景目录** - `1310ebb` (chore)
2. **Task 2: 创建主提示文件 prompt.md** - `0faa3af` (feat)
3. **Task 3: 创建输出模板文件 output-template.md** - `cd75065` (feat)
4. **Task 4: 创建案例库（表级 + 字段级）** - `6e0d194` (feat)

## Files Created/Modified

- `.claude/data-warehouse/prompts/scenarios/analyze-lineage/prompt.md` - 血缘分析主提示，4-block 结构，两段式交互
- `.claude/data-warehouse/prompts/scenarios/analyze-lineage/output-template.md` - Stage 1/2 输出格式模板
- `.claude/data-warehouse/prompts/scenarios/analyze-lineage/examples/table-level.md` - 多表 JOIN 表级血缘案例
- `.claude/data-warehouse/prompts/scenarios/analyze-lineage/examples/column-level.md` - 窗口函数字段级血缘案例

## Decisions Made

| 决策 | 选择 | 理由 |
|------|------|------|
| 交互模式 | 两段式（Stage 1/2） | 与 Phase 4/5 保持一致，表级快速概览，字段级按需展开 |
| 精度等级 | A/B/C/D 四级 | 平衡自动化与准确性，D 级需人工确认 |
| 解析优先级 | dbt ref/source > 原生表名 | dbt 项目中 ref/source 更可靠，原生表名可能是动态拼接 |
| 静态解析优先 | AST 解析 > LLM 推断 | 静态解析确定性高，LLM 仅用于复杂结构补全 |
| Mermaid 着色 | 按分层着色 | 视觉区分 ODS/DWD/DWS/ADS，快速识别依赖路径 |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 血缘分析场景（LINEAGE-01 ~ LINEAGE-03）基础完成
- Phase 7 可扩展：影响评估（LINEAGE-04）、SQL 生成（SQLGEN）
- 待 Phase 8 工具化：自动上下文组装、CLI 集成

---

*Phase: 06-governance-scenarios*
*Plan: 04*
*Completed: 2026-02-01*

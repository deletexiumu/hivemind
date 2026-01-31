---
phase: 02-methodology
plan: 02
subsystem: methodology
tags: [kimball, fact-table, scd, dbt-hive, dimensional-modeling]

# Dependency graph
requires:
  - phase: 01-infrastructure
    provides: 目录结构、术语表 (terms.md)
  - phase: 02-01
    provides: 维度建模指南 (dimensional-modeling.md)
provides:
  - METHOD-02 事实表类型指南 (fact-table-types.md)
  - METHOD-03 SCD 策略指南 (scd-strategies.md)
  - 可加性分类规范与聚合方式
  - dbt-hive 无 Snapshots 的 SCD Type 2 实现路径
  - 迟到事实/迟到维度处理策略
affects:
  - 02-03 (分层体系规范)
  - 04-design (模型设计场景)
  - 05-review (模型评审场景)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SCD2 字段合同：effective_start/end + is_current + 右开区间"
    - "可加性标注：schema.yml meta.additivity"
    - "迟到维 Unknown 成员占位"
    - "dbt-hive SCD2：全量重建 vs Current/History 拆分"

key-files:
  created:
    - .claude/data-warehouse/context/methodology/fact-table-types.md
    - .claude/data-warehouse/context/methodology/scd-strategies.md
  modified: []

key-decisions:
  - "SCD2 区间采用右开语义 [effective_start, effective_end)"
  - "当前记录 effective_end = 9999-12-31（非 NULL）"
  - "迟到维使用 Unknown 成员占位（customer_sk = -1）"
  - "小维表全量重建，大维表 Current/History 拆分"

patterns-established:
  - "七段式方法论文档结构：适用范围 + 读者导航 + TL;DR + 核心概念 + 决策树 + 实操指南 + 误区/检查清单"
  - "双受众标识 [Analyst]/[Engineer] 穿插呈现"
  - "可加性三分类：可加/半可加/不可加 + 正确聚合方式"
  - "SCD2 五约束合同：区间语义、current 唯一、区间不重叠、tie-breaker、dbt tests"

# Metrics
duration: 4min
completed: 2026-01-31
---

# Phase 2 Plan 02: 事实表类型 + SCD 策略指南 Summary

**事实表四类型选型指南（事务/周期快照/累积快照/无事实）+ 可加性规范，SCD 三策略指南 + dbt-hive 无 Snapshots 实现路径**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-31T02:57:20Z
- **Completed:** 2026-01-31T03:01:52Z
- **Tasks:** 2/2
- **Files created:** 2

## Accomplishments

- METHOD-02 事实表类型指南（501 行）：覆盖事务/周期快照/累积快照/无事实表四种类型，包含可加性表格、迟到事实处理策略、Mermaid 决策树
- METHOD-03 SCD 策略指南（649 行）：覆盖 SCD Type 1/2/3，包含 5 约束字段合同、dbt-hive 两种实现路径、迟到维度处理、标准查询模式
- 双受众标识 [Analyst]/[Engineer] 穿插呈现，分析侧聚焦查询模式，工程侧聚焦实现细节
- 所有文档包含误区表格 + 检查清单，支持实操自查

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写事实表类型指南 (METHOD-02)** - `62f6031` (feat)
2. **Task 2: 编写 SCD 策略指南 (METHOD-03)** - `067c4b0` (feat)

## Files Created

- `.claude/data-warehouse/context/methodology/fact-table-types.md` - 事实表类型指南，501 行，覆盖事务/周期快照/累积快照/无事实表 + 可加性 + 迟到事实
- `.claude/data-warehouse/context/methodology/scd-strategies.md` - SCD 策略指南，649 行，覆盖 Type 1/2/3 + dbt-hive 实现 + 迟到维度

## Decisions Made

1. **SCD2 区间语义**：采用右开区间 `[effective_start, effective_end)`，避免边界日期重复命中
2. **当前记录标识**：`effective_end = '9999-12-31'` 而非 NULL，简化查询逻辑
3. **迟到维处理**：使用 Unknown 成员占位（`customer_sk = -1`），保证事实表外键完整性
4. **大小维表策略**：小维表（<100 万行）全量重建，大维表拆分 Current/History 表

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- METHOD-02 和 METHOD-03 完成，与 METHOD-01（维度建模）形成完整的 Kimball 方法论核心文档
- 下一步：02-03 分层体系规范（ODS/DWD/DWS/ADS）
- 交叉引用已建立：scd-strategies.md 链接到 dimensional-modeling.md，fact-table-types.md 链接到 terms.md

---
*Phase: 02-methodology*
*Completed: 2026-01-31*

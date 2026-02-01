---
phase: 06-governance-scenarios
plan: 01
subsystem: governance
tags: [dbt-semantic-layer, dq-rules, metrics, metricflow, dbt-expectations]

# Dependency graph
requires:
  - phase: 04-design-new-model
    provides: "*-core.md 模式（精简版上下文文件结构）"
  - phase: 05-review-existing-model
    provides: "检查清单规则 ID（G01/D01/D03 等）"
provides:
  - "metrics-core.md: 指标分类体系 + Semantic Layer 2.0 格式速查"
  - "dq-rules-core.md: 字段类型驱动规则 + 分层阈值策略"
  - "governance 上下文目录结构"
affects: [06-02-PLAN, 06-03-PLAN, 06-04-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "context-core frontmatter 格式统一（type/domain/document/source/version/token_budget）"
    - "字段类型驱动规则推断策略"
    - "分层阈值策略（ODS 宽松/DWD-DWS 中等/ADS 严格）"

key-files:
  created:
    - ".claude/data-warehouse/context/governance/metrics-core.md"
    - ".claude/data-warehouse/context/governance/dq-rules-core.md"
  modified: []

key-decisions:
  - "指标三分法与 MetricFlow 类型映射（原子→simple，派生→derived/ratio，复合→derived 嵌套）"
  - "字段后缀模式驱动 DQ 规则推断（_id→unique，_amt→范围检测）"
  - "分层阈值策略量化（ODS 5%/10%，DWD-DWS 1%/5%，ADS 0%/1%）"

patterns-established:
  - "governance 上下文文件结构：frontmatter + 表格 + 示例片段"
  - "Source 标注规范：标明原始决策/文档来源"

# Metrics
duration: 5min
completed: 2026-02-01
---

# Phase 6 Plan 1: 治理上下文基础 Summary

**创建 governance 目录及两个精简版上下文文件，为指标/DQ/血缘三场景提供共享知识基础**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-01T01:47:49Z
- **Completed:** 2026-02-01T01:52:00Z
- **Tasks:** 3
- **Files created:** 2

## Accomplishments

- 创建 governance 上下文目录结构
- metrics-core.md：指标三分法 + MetricFlow 映射 + Semantic Layer 格式速查 + Stage 1 必问项
- dq-rules-core.md：字段类型驱动规则 + 分层阈值 + 三类阈值实现 + 新鲜度配置 + dbt-hive 约束

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建 governance 上下文目录** - (目录通过文件内容追踪)
2. **Task 2: 创建 metrics-core.md** - `983321b` (feat)
3. **Task 3: 创建 dq-rules-core.md** - `b0cebba` (feat)

## Files Created

| 文件 | 用途 | Token 估算 |
|------|------|------------|
| `.claude/data-warehouse/context/governance/metrics-core.md` | 指标分类 + Semantic Layer 格式 | ~900 tokens |
| `.claude/data-warehouse/context/governance/dq-rules-core.md` | DQ 规则推断 + 阈值策略 | ~950 tokens |

**合计:** ~1850 tokens（符合 <2000 token 预算）

## Decisions Made

1. **指标分类与 MetricFlow 映射**
   - 原子指标 → `type: simple`
   - 派生指标 → `type: derived` / `type: ratio`
   - 复合指标 → `type: derived`（嵌套引用）
   - 理由：与 dbt Semantic Layer 2.0 官方格式对齐

2. **字段类型驱动规则优先级**
   - P0：主键/代理键（`_id`/`_sk`/`_key`）→ unique + not_null
   - P1：金额/数量/状态（`_amt`/`_cnt`/`_status`）→ 范围/枚举检测
   - P2：布尔/外键（`is_`/`has_`/`*_key` FK）→ accepted_values/relationships
   - 理由：遵循 06-CONTEXT.md 用户决策，与 naming.md 字段命名规范一致

3. **分层阈值量化**
   - ODS：warn 5%, error 10%（贴源数据，容忍度高）
   - DWD/DWS：warn 1%, error 5%（中间层，质量要求中等）
   - ADS：warn 0%, error 1%（应用层，质量要求严格）
   - 理由：遵循 06-CONTEXT.md 用户决策

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 6 后续计划：**
- 06-02-PLAN（指标定义场景）可引用 `metrics-core.md`
- 06-03-PLAN（DQ 规则场景）可引用 `dq-rules-core.md`
- 06-04-PLAN（血缘分析场景）可复用分层规则和命名规范

**无阻塞项：**
- 两个 `*-core.md` 文件格式与 Phase 4 创建的精简版上下文一致
- frontmatter 包含 `type: context-core`，支持运行时注入

---
*Phase: 06-governance-scenarios*
*Completed: 2026-02-01*

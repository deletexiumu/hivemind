---
phase: 04-design-new-model
plan: 03
subsystem: prompts
tags: [example, kimball, scd, transaction-fact, periodic-snapshot, dbt]

# Dependency graph
requires:
  - phase: 04-01
    provides: 7 个 *-core.md 精简版上下文文件
provides:
  - 3 个完整案例（电商订单、用户行为、财务收入）
  - 输入->输出示例作为提示系统参考样例
  - 人工评审测试集
affects: [04-02, 05-review-existing-model, phase-review]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "案例结构：输入 + Stage 1 输出 + Stage 2 输出 + 要点总结"
    - "File: 路径契约：### File: {path} 格式标注代码文件"
    - "事实表类型覆盖：事务事实表 + 周期快照事实表"

key-files:
  created:
    - .claude/data-warehouse/prompts/scenarios/design-new-model/examples/e-commerce-order.md
    - .claude/data-warehouse/prompts/scenarios/design-new-model/examples/user-behavior-pv.md
    - .claude/data-warehouse/prompts/scenarios/design-new-model/examples/finance-revenue.md
  modified: []

key-decisions:
  - "案例结构统一：输入(YAML) -> Stage 1(决策摘要) -> Stage 2(完整产物) -> 要点"
  - "File: 路径契约与 output-template.md 保持一致"
  - "周期快照事实表落层 DWS，不是 DWD"
  - "SCD Type 2 维度的 FK 使用代理键（customer_key -> customer_sk）"

patterns-established:
  - "案例 frontmatter 包含 complexity/fact_type/dimensions/scd_types 元数据"
  - "Stage 2 输出使用 ### File: 格式，便于自动落盘"
  - "每个案例包含关键差异对比说明"

# Metrics
duration: 4min
completed: 2026-01-31
---

# Phase 4 Plan 03: Example Cases Summary

**3 个完整案例覆盖电商/用户行为/金融领域，展示事务事实表和周期快照事实表的输入->输出示例，使用 File: 路径契约与 output-template.md 格式对齐**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-31T11:03:56Z
- **Completed:** 2026-01-31T11:07:xx Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- 创建电商订单复杂案例（5 维度 + SCD Type 2 客户维度）
- 创建用户行为中等案例（全 Type 1，高频事件场景）
- 创建财务收入中等案例（周期快照事实表，落层 DWS）
- 所有案例使用 `### File:` 路径契约，与 output-template.md 格式一致

## Task Commits

Each task was committed atomically:

1. **Task 1: 创建电商订单案例（复杂）** - `0c73877` (feat)
2. **Task 2: 创建用户行为案例（中等）** - `d1aee84` (feat)
3. **Task 3: 创建财务收入案例（中等）** - `7068567` (feat)

## Files Created

| 文件 | 用途 | 字数 | 估算 Tokens |
|------|------|------|-------------|
| `e-commerce-order.md` | 电商订单复杂案例：事务事实表 + 多维度 + SCD2 | 961 | ~640-960 |
| `user-behavior-pv.md` | 用户行为中等案例：事件类 + 全 Type 1 | 482 | ~320-480 |
| `finance-revenue.md` | 财务收入中等案例：周期快照 + DWS 层 | 637 | ~420-640 |
| **合计** | | **2080** | **~1400** |

## Decisions Made

1. **案例结构统一化**：所有案例采用 输入 -> Stage 1 -> Stage 2 -> 要点 四部分结构
2. **File: 路径契约**：Stage 2 输出中每个文件使用 `### File: {path}` 格式，便于自动落盘
3. **周期快照落层 DWS**：财务收入案例明确周期快照事实表落 DWS 层，与事务事实表（DWD）形成对比
4. **SCD2 键策略示例**：电商案例展示 FK 使用 customer_key 指向 dim_customer.customer_sk

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 3 个案例就绪，可供 prompt.md 通过 `examples/` 目录引用
- 案例覆盖：
  - 领域：电商、用户行为、金融
  - 事实表类型：事务（2 个）、周期快照（1 个）
  - 复杂度：复杂（1 个）、中等（2 个）
  - SCD 类型：Type 1 + Type 2
- 输出格式与 output-template.md 一致（使用 File: 路径契约）
- 可作为 ROADMAP 成功标准第 4 条（人工评审测试集）

---
*Phase: 04-design-new-model*
*Completed: 2026-01-31*

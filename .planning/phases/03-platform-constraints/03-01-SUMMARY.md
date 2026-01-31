---
phase: 03
plan: 01
title: 平台约束库索引与 Hive 约束文档
status: complete
completed: 2026-01-31

subsystem: platform
tags: [hive, constraints, partition, orc, acid, performance]

dependency-graph:
  requires: [02-methodology]
  provides: [platform-constraints-index, hive-constraints-doc]
  affects: [03-02, 04-design, 05-review, 07-sqlgen]

tech-stack:
  added: []
  patterns: [risk-level-organization, unified-constraint-template]

key-files:
  created:
    - .claude/data-warehouse/context/platform/index.md
    - .claude/data-warehouse/context/platform/hive-constraints.md
  modified: []

decisions:
  - id: constraint-risk-levels
    choice: P0/P1/P2 三级分类
    reason: P0 必须遵守（违反导致数据错误或执行失败），P1 强烈建议，P2 可选优化
  - id: constraint-template
    choice: 统一模板（ID/原因/后果/规避/示例）
    reason: 确保一致性，便于 Claude 解析和人类阅读
  - id: performance-constraints
    choice: 独立性能优化章节
    reason: JOIN 顺序、分区裁剪、列裁剪、反模式需要集中说明

metrics:
  duration: 5 minutes
  tasks: 3/3
  lines-added: 702
  constraints-documented: 20
---

# Phase 3 Plan 01: 平台约束库索引与 Hive 约束文档 Summary

**One-liner:** 创建平台约束库索引页与 Hive 3.x 约束文档，定义 20 个约束（11 个 P0）覆盖分区/ORC/ACID/数据完整性/性能优化五大类。

---

## What Was Built

### 1. 平台约束库索引页 (`context/platform/index.md`)

- **P0 约束速查表**: 14 个 P0 约束一览（11 个 Hive + 3 个 dbt-hive）
- **文档列表**: 3 个文档（hive-constraints, dbt-hive-limitations, incremental-strategies）
- **阅读顺序建议**: Hive 约束 -> dbt-hive 限制 -> 增量策略
- **版本信息**: Hive 3.x, dbt-hive 1.10.x, dbt-core 1.10.x

### 2. Hive 3.x 平台约束文档 (`context/platform/hive-constraints.md`)

**约束覆盖情况:**

| 类别 | P0 | P1 | P2 | 合计 |
|------|----|----|----|----|
| 分区约束 | 4 | 2 | 0 | 6 |
| ORC 存储 | 0 | 2 | 1 | 3 |
| ACID 约束 | 4 | 1 | 0 | 5 |
| 数据完整性 | 3 | 0 | 0 | 3 |
| 性能优化 | 1 | 3 | 0 | 4 |
| **合计** | **12** | **8** | **1** | **21** |

**关键 P0 约束:**

1. HIVE-001: 动态分区列必须在 SELECT 末尾
2. HIVE-002: 分区列 dt 必须 NOT NULL
3. HIVE-003: 分区列 dt 必须为 yyyy-MM-dd 格式
4. HIVE-004: 禁止并发回刷同一分区
5. HIVE-010: MERGE 仅支持 ACID 表
6. HIVE-011: UPDATE/DELETE 仅支持 ACID 表
7. HIVE-012: ACID 表不支持 INSERT OVERWRITE
8. HIVE-014: 禁止 SELECT *（列漂移风险）
9. HIVE-015: 分区内业务键去重（取最新版本）
10. HIVE-016: Schema 变更合同（仅允许追加列）
11. HIVE-018: 分区裁剪优化（WHERE 必须包含分区条件）

---

## Decisions Made

| 决策 | 选择 | 理由 |
|------|------|------|
| 约束风险等级 | P0/P1/P2 三级 | P0 违反导致数据错误或执行失败，P1 影响性能，P2 可选优化 |
| 约束模板格式 | ID/原因/后果/规避/示例 | 统一格式便于 Claude 解析和人类阅读 |
| 性能优化章节 | 独立章节 | JOIN 顺序、分区裁剪、列裁剪、反模式需集中说明 |
| HIVE-018 等级 | P0 | 不使用分区条件导致全表扫描，是严重性能问题 |

---

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 519dde7 | feat(03-01): create platform constraints index page | context/platform/index.md |
| f8cca13 | feat(03-01): add Hive 3.x platform constraints document | context/platform/hive-constraints.md |
| 032cd2e | docs(03-01): sync index page with hive-constraints document | context/platform/index.md |

---

## Verification Results

| Criteria | Expected | Actual | Status |
|----------|----------|--------|--------|
| index.md exists | Yes | Yes | PASS |
| hive-constraints.md exists | Yes | Yes | PASS |
| Index page lines | >= 80 | 80 | PASS |
| Hive constraints lines | >= 300 | 624 | PASS |
| P0 constraints in index | >= 8 | 14 | PASS |
| HIVE-xxx constraints | >= 20 | 20 | PASS |
| Performance section | Exists | HIVE-017~020 | PASS |
| Link pattern | `[...](hive-constraints.md)` | Present | PASS |

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Next Phase Readiness

**For Plan 03-02 (dbt-hive 限制文档):**
- 索引页已创建框架，状态为 planned
- 约束 ID 命名空间已定义（DBT-HIVE-xxx）
- 可直接开始编写 dbt-hive-limitations.md

**For Phase 4+ (代码生成场景):**
- Hive 约束已文档化，可作为 SQL 生成的约束检查依据
- 分区裁剪、列裁剪等性能约束可嵌入 SQL 生成提示

---

*Completed: 2026-01-31 | Duration: 5 minutes | Tasks: 3/3*

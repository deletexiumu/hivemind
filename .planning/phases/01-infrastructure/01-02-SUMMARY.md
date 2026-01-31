---
phase: 01-infrastructure
plan: 02
subsystem: data-warehouse-governance
tags: [naming-conventions, prompting-guidelines, token-budget, yaml-frontmatter, xml-tags]

dependency_graph:
  requires:
    - phase: 01-01
      provides: directory-structure, glossary
  provides:
    - naming-conventions-document
    - prompting-guidelines-document
    - token-budget-configuration
    - yaml-frontmatter-specification
  affects:
    - phase-02 (methodology-library)
    - phase-03 (platform-constraints)
    - phase-04-07 (all-scenario-prompts)
    - all-future-prompts-and-models

tech_stack:
  added:
    - yaml-frontmatter-format
    - xml-tags-structure
  patterns:
    - single-file-token-limit-2000
    - conservative-token-estimation-1-to-1
    - snake-case-table-fields
    - kebab-case-files-dirs

key_files:
  created:
    - .claude/data-warehouse/docs/naming.md
    - .claude/data-warehouse/docs/prompting.md
    - .claude/data-warehouse/docs/token-budget.md
  modified: []

key_decisions:
  - "Table naming: {layer}_{type?}_{domain}_{entity}_{suffix?} pattern"
  - "Field naming: snake_case with type suffixes (_id, _amt, _cnt, _date, _time)"
  - "Standard fields: dw_create_time, dw_modify_time, etl_date for all tables"
  - "SCD Type 2 fields: dw_valid_from, dw_valid_to, is_current"
  - "Token limit: <2000 per file (hard), <1500 per file (target)"
  - "Token estimation: 1 token ≈ 1 Chinese character (conservative)"
  - "File naming: kebab-case for docs/dirs, snake_case for models"

patterns_established:
  - "Layer prefixes: ods_, dwd_, dws_, ads_, dim_, stg_, tmp_"
  - "Type markers: fact_, bridge_, agg_, snapshot_, map_"
  - "YAML frontmatter: type, title, status, version, domain, owner, updated_at, includes"
  - "XML tags: context, instructions, constraints, output_format, examples"

metrics:
  duration: 5m54s
  completed: 2026-01-31
---

# Phase 01 Plan 02: 命名规范与提示规范文档 Summary

**命名规范文档（37+ 正例覆盖表名/字段名/文件名）+ 提示规范文档（YAML frontmatter + XML 标签 + <2000 token 限制）+ Token 预算配置（保守 1:1 估算）**

## Performance

- **Duration:** 5m 54s
- **Started:** 2026-01-31T01:12:25Z
- **Completed:** 2026-01-31T01:18:19Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- 命名规范文档覆盖 5 大类（Schema、表名、字段名、标准字段、文件名），37+ 正例
- 提示规范文档定义 YAML frontmatter 格式、XML 标签规范、文件结构模板
- Token 预算配置建立保守估算原则（1 token ≈ 1 中文字符），明确 2000 token 硬限制
- 完整的命名检查清单（10+ 检查项/类别）

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写命名规范文档** - `c97b429` (docs)
2. **Task 2: 编写提示规范和 Token 预算文档** - `4fca15e` (docs)

## Files Created

| File | Lines | Purpose |
|------|------:|---------|
| `.claude/data-warehouse/docs/naming.md` | 400 | 数据仓库对象命名规范 |
| `.claude/data-warehouse/docs/prompting.md` | 359 | AI 提示工程规范 |
| `.claude/data-warehouse/docs/token-budget.md` | 197 | Token 预算配置 |

## What Was Built

### 命名规范覆盖

| 类别 | 内容 | 正例数 |
|------|------|--------|
| Schema/数据库 | `{layer}_db` 格式 | 6 |
| 表名分层前缀 | ods/dwd/dws/ads/dim/stg/tmp | 7 |
| 表类型标识 | fact/bridge/agg/snapshot/map | 5 |
| 完整表名示例 | 全部分层 | 28 |
| 字段命名模式 | id/date/time/amt/cnt/rate/is | 12 |
| 标准字段 | 元数据/事实表/维度表/分区 | 10 |
| 文件/目录 | kebab-case vs snake_case | 3 |

### 提示规范要点

- **YAML frontmatter 字段**：type, title, status, version, domain, owner, updated_at, includes
- **文件类型**：prompt, context, glossary, docs
- **XML 标签**：context, instructions, constraints, output_format, examples, input, thinking
- **Token 限制**：单文件 < 2000 tokens（硬限制），目标 < 1500 tokens
- **版本管理**：SemVer 语义化版本

### Token 预算配置

| 配置项 | 值 |
|--------|---:|
| 模型上下文 | 200,000 tokens |
| 可用输入 | 163,000 tokens |
| 单文件上限 | 2,000 tokens |
| 单文件目标 | 1,500 tokens |
| 保守估算 | 1 token ≈ 1 中文字符 |

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 表名格式 | `{layer}_{type?}_{domain}_{entity}_{suffix?}` | 分层清晰、语义完整、易于识别 |
| 字段后缀 | `_id`, `_amt`, `_cnt`, `_date`, `_time`, `is_` | 类型一目了然，避免歧义 |
| 标准元数据字段 | dw_create_time, dw_modify_time, etl_date | 所有表统一追踪 |
| Token 估算 | 保守 1:1 | 避免运行时超限 |
| 文件命名 | kebab-case（文档）vs snake_case（模型） | 解耦文件资产与数仓对象 |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Unblocked:**
- Phase 2: 方法论库（可引用命名规范和术语表）
- Phase 3: 平台约束（可遵循命名规范）
- Phase 4-7: 场景提示（可使用提示规范模板）

**Prerequisites Met:**
- [x] 命名规范完整（表名、字段名、文件名）
- [x] 提示规范完整（frontmatter、XML 标签、模板）
- [x] Token 预算明确（<2000 硬限制）
- [x] 所有文档包含正确的 YAML frontmatter

**Phase 1 Infrastructure Complete:**
- 01-01: 目录结构 + 术语表（89 条）
- 01-02: 命名规范 + 提示规范 + Token 预算

---

*Plan completed: 2026-01-31*
*Duration: 5m54s*
*Executor: gsd-plan-executor*

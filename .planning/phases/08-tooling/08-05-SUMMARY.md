---
phase: 08-tooling
plan: 05
subsystem: documentation
tags:
  - documentation
  - readme
  - extending
  - user-guide

dependency_graph:
  requires:
    - "08-03"  # 核心辅助脚本
    - "08-04"  # /dw:* 命令文件
  provides:
    - "工具使用指南 README.md"
    - "扩展开发指南 extending.md"
  affects:
    - "用户上手体验"
    - "扩展开发者体验"

tech_stack:
  added: []
  patterns:
    - "使用文档 + 扩展指南分离"
    - "两级文档（快速上手 + 深度扩展）"

key_files:
  created:
    - ".claude/data-warehouse/README.md"
    - ".claude/data-warehouse/docs/extending.md"
  modified: []

decisions:
  - id: "doc-structure"
    choice: "README + extending 分离"
    rationale: "用户先快速上手，开发者再深度扩展"

metrics:
  duration: "5m"
  completed: "2026-02-01"
---

# Phase 8 Plan 5: 使用文档和扩展指南 Summary

> README.md + extending.md 完成工具化阶段的文档交付

---

## One-liner

README.md 提供 9 个 /dw:* 命令的完整使用指南，extending.md 说明如何添加新场景和新平台。

---

## What Was Done

### Task 1: 创建 README.md

**文件：** `.claude/data-warehouse/README.md`

**内容覆盖：**

| 章节 | 内容 |
|------|------|
| 项目介绍 | HiveMind 数仓助手，6 个核心场景 |
| 快速开始 | npm install + 验证安装 |
| 场景命令表格 | 6 个场景命令（design, review, generate-sql, define-metric, generate-dq, analyze-lineage） |
| 工具命令表格 | 3 个工具命令（assemble, validate, new-scenario） |
| 目录结构 | 完整目录树说明 |
| 使用指南 | 每个场景的详细使用示例 |
| 技术栈 | Hive 4.x + dbt-hive 1.10.0, Kimball, ODS/DWD/DWS/ADS |
| 扩展开发链接 | 指向 docs/extending.md |

**统计：**
- 526 行
- 33 处 `/dw:*` 命令引用
- 6 个场景使用指南

**Commit:** `6ff8e74`

---

### Task 2: 创建扩展文档

**文件：** `.claude/data-warehouse/docs/extending.md`

**内容覆盖：**

| 章节 | 内容 |
|------|------|
| 添加新场景 - 脚手架方式 | `/dw:new-scenario` 使用说明 |
| 添加新场景 - 手动创建 | 7 步完整手动创建流程 |
| 场景设计原则 | 单一职责、两段式交互、Token 预算、中文输出 |
| 添加新平台支持 | 创建平台上下文、更新配置、更新组装规则 |
| 配置文件说明 | scenarios.yaml, platforms.yaml, assembly-rules.yaml 格式 |
| 测试新场景 | 校验输入、组装提示、端到端测试 |
| 常见问题 | Token 超限、调试组装、Schema 校验失败等 |

**统计：**
- 901 行
- 3 处 `/dw:new-scenario` 引用
- 5 个常见问题解答

**Commit:** `c8d7a21`

---

## Key Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| 文档结构 | README + extending 分离 | 用户先快速上手，开发者再深度扩展 |
| 场景使用指南详细度 | 每个场景完整示例 | 降低学习成本，便于复制粘贴 |
| 扩展文档两种方式 | 脚手架推荐 + 手动备选 | 脚手架高效，手动提供完全控制 |

---

## Verification Results

| 检查项 | 结果 | 说明 |
|--------|------|------|
| README.md 存在 | PASS | 526 行 |
| README.md >= 100 行 | PASS | 526 > 100 |
| extending.md 存在 | PASS | 901 行 |
| extending.md >= 80 行 | PASS | 901 > 80 |
| 命令列表引用 | PASS | 33 处 /dw:* 引用 |
| 脚手架使用说明 | PASS | 3 处 /dw:new-scenario 引用 |

---

## Artifacts

| 文件 | 行数 | 用途 |
|------|------|------|
| `.claude/data-warehouse/README.md` | 526 | 工具使用指南 |
| `.claude/data-warehouse/docs/extending.md` | 901 | 扩展开发指南 |

---

## Deviations from Plan

None — 计划按预期执行完成。

---

## Commits

| Hash | Message |
|------|---------|
| `6ff8e74` | docs(08-05): add README.md for data warehouse toolkit |
| `c8d7a21` | docs(08-05): add extending.md for extension development guide |

---

## Next Phase Readiness

Phase 8 全部完成。系统已准备好进行 v1 里程碑审计。

**建议下一步：**
1. 执行 `/gsd:audit-milestone` 进行 v1 验收
2. 验收通过后发布初版

---

*Summary 生成时间：2026-02-01*
*执行时长：5 分钟*

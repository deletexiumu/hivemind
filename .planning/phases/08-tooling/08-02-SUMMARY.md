---
phase: "08"
plan: "02"
title: "场景输入模板"
subsystem: tooling
tags: [input-template, user-experience, scenarios]
---

# Phase 8 Plan 2: 场景输入模板 - Summary

**JWT 输入模板：为每个场景提供结构化输入模板，降低使用门槛，确保输入信息完整性**

## 完成概览

| 指标 | 值 |
|------|-----|
| **状态** | Complete |
| **任务数** | 3/3 |
| **持续时间** | ~6 分钟 |
| **创建文件** | 6 个 input-template.md |
| **完成日期** | 2026-02-01 |

## 交付物清单

### Task 1: 设计与评审场景输入模板

| 文件路径 | 类型 | 必填字段 |
|----------|------|----------|
| `.claude/data-warehouse/prompts/scenarios/design-new-model/input-template.md` | 输入模板 | business_event, grain |
| `.claude/data-warehouse/prompts/scenarios/review-existing-model/input-template.md` | 输入模板 | model_code |

**Commit:** `652da44` - feat(08-02): create design-new-model and review-existing-model input templates

### Task 2: SQL生成与指标定义场景输入模板

| 文件路径 | 类型 | 必填字段 |
|----------|------|----------|
| `.claude/data-warehouse/prompts/scenarios/generate-sql/input-template.md` | 输入模板 | requirement, source_tables |
| `.claude/data-warehouse/prompts/scenarios/define-metrics/input-template.md` | 输入模板 | metric_name, business_desc |

**Commit:** `35e6eea` - feat(08-02): create generate-sql and define-metrics input templates

### Task 3: DQ规则与血缘分析场景输入模板

| 文件路径 | 类型 | 必填字段 |
|----------|------|----------|
| `.claude/data-warehouse/prompts/scenarios/generate-dq-rules/input-template.md` | 输入模板 | model_name, columns |
| `.claude/data-warehouse/prompts/scenarios/analyze-lineage/input-template.md` | 输入模板 | target_model |

**Commit:** `88ad819` - feat(08-02): create generate-dq-rules and analyze-lineage input templates

---

## 输入模板结构统一

每个输入模板包含以下统一结构：

1. **Frontmatter** - 类型、场景、版本标识
2. **字段定义表格** - 字段名、说明、类型、必填/推荐/可选
3. **YAML 模板** - 可直接复制填写的结构化模板
4. **示例输入** - 完整示例 + 最小输入示例
5. **常见错误提示** - 避免用户常见填写错误
6. **交互流程说明** - Stage 1/2 触发方式

---

## 字段名与 Schema 对应关系

| 场景 | 必填字段 | 验证状态 |
|------|----------|----------|
| design-new-model | `business_event`, `grain` | 通过 |
| review-existing-model | `model_code` | 通过 |
| generate-sql | `requirement`, `source_tables` | 通过 |
| define-metrics | `metric_name`, `business_desc` | 通过 |
| generate-dq-rules | `model_name`, `columns` | 通过 |
| analyze-lineage | `target_model` | 通过 |

---

## 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 模板格式 | YAML 带注释 | 结构清晰，注释提供即时指导 |
| 必填标注 | `**必填**` 加粗 + `[必填]` 注释 | 双重提示，避免遗漏 |
| 示例策略 | 完整 + 最小 两种示例 | 覆盖新手和熟练用户 |
| 错误提示 | 表格形式（错误 → 正确） | 对比清晰，易于理解 |

---

## 与其他组件的关联

| 关联文件 | 关联方式 | 说明 |
|----------|----------|------|
| `prompt.md` | 字段对应 | 输入模板字段与 prompt 输入格式一致 |
| `examples/*.md` | 示例参考 | 输入模板示例参考场景案例 |
| `schemas/input/*.schema.json` | 字段验证 | 字段名保持一致，支持 Schema 校验（08-01 创建） |

---

## Deviations from Plan

None - 计划按原定内容执行完成。

---

## Next Phase Readiness

**Phase 8 进度：** 2/3 计划完成

**已完成：**
- [x] 08-01: JSON Schema 定义（如已完成）
- [x] 08-02: 输入模板创建

**待执行：**
- [ ] 08-03: CLI 工具或集成框架

**Blockers/Concerns:** 无

---

## Metrics

- **执行时间：** ~6 分钟
- **创建文件：** 6 个
- **提交次数：** 3 个原子提交
- **字段覆盖率：** 100%（所有必填字段已定义）

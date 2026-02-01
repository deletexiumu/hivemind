---
phase: "08"
plan: "01"
subsystem: tooling
tags: [yaml-config, json-schema, ajv, validation, assembly]
dependency-graph:
  requires: []
  provides:
    - scenarios.yaml (6 场景配置映射)
    - platforms.yaml (Hive 平台上下文配置)
    - assembly-rules.yaml (三级上下文加载规则)
    - 12 个 JSON Schema (6 输入 + 6 输出)
  affects:
    - 08-02-PLAN.md (命令文件需引用配置)
    - 08-03-PLAN.md (组装脚本需读取配置)
tech-stack:
  added:
    - JSON Schema draft-2020-12
    - YAML 1.2 配置格式
  patterns:
    - 渐进披露上下文加载
    - 输入输出双向校验
    - 版本化 Schema ($id: dw:{scenario}:{input|output}:v1)
key-files:
  created:
    - .claude/data-warehouse/config/scenarios.yaml
    - .claude/data-warehouse/config/platforms.yaml
    - .claude/data-warehouse/config/assembly-rules.yaml
    - .claude/data-warehouse/schemas/input/design-new-model.schema.json
    - .claude/data-warehouse/schemas/input/review-existing-model.schema.json
    - .claude/data-warehouse/schemas/input/generate-sql.schema.json
    - .claude/data-warehouse/schemas/input/define-metrics.schema.json
    - .claude/data-warehouse/schemas/input/generate-dq-rules.schema.json
    - .claude/data-warehouse/schemas/input/analyze-lineage.schema.json
    - .claude/data-warehouse/schemas/output/design-new-model.schema.json
    - .claude/data-warehouse/schemas/output/review-existing-model.schema.json
    - .claude/data-warehouse/schemas/output/generate-sql.schema.json
    - .claude/data-warehouse/schemas/output/define-metrics.schema.json
    - .claude/data-warehouse/schemas/output/generate-dq-rules.schema.json
    - .claude/data-warehouse/schemas/output/analyze-lineage.schema.json
  modified: []
decisions:
  - id: config-yaml-format
    choice: YAML 1.2 配置格式
    rationale: 避免 YAML 1.1 的 on/yes 布尔陷阱，支持中文注释
  - id: schema-version-v1
    choice: draft-2020-12 + schema_version=1
    rationale: 最新 JSON Schema 规范，内置版本字段支持迁移
  - id: context-levels-three
    choice: always/scenario/onDemand 三级加载
    rationale: 平衡 token 预算与上下文完整性
  - id: error-message-chinese
    choice: errorMessage 使用中文
    rationale: 面向中文用户，提高错误可读性
metrics:
  duration: 6m 11s
  completed: 2026-02-01
---

# Phase 08 Plan 01: 配置与 Schema Summary

配置文件 + JSON Schema 基础设施建立完成，为提示组装和规格校验提供数据基础

## One-liner

3 个 YAML 配置文件（场景/平台/组装规则）+ 12 个 JSON Schema（6 场景 x 输入输出）建立完整的配置中心和校验规范

## Changes Made

### Task 1: 创建配置文件

**交付物：**

1. **scenarios.yaml** — 6 场景配置映射
   - 每个场景包含：id, name, description, prompt_file, output_template, requires_context, max_tokens, examples_dir
   - requires_context 从各场景 prompt.md frontmatter includes 提取
   - max_tokens 从 prompt.md frontmatter token_budget 提取

2. **platforms.yaml** — Hive 平台配置
   - 核心约束文件：hive-constraints-core.md, dbt-hive-limitations-core.md
   - 完整版文档路径（onDemand 加载）
   - 平台特定配置：分区、回刷窗口、物化策略、SCD2 实现

3. **assembly-rules.yaml** — 组装规则
   - Token 预算：max_tokens=4000, reserve_output=1500, available_input=2500
   - 三级上下文加载：always(platform+naming) > scenario > onDemand
   - 优先级排序：platform > methodology > layers > governance > naming > examples
   - 裁剪策略：priority 模式，保护 platform 类别

**Commit:** `d4e44e7`

### Task 2: 创建 JSON Schema

**交付物：**

12 个 JSON Schema 文件（6 输入 + 6 输出）

**输入 Schema 必填字段：**

| 场景 | 必填字段 | 说明 |
|------|----------|------|
| design-new-model | business_event, grain | 业务事件 + 粒度 |
| review-existing-model | model_code | 待评审代码 |
| generate-sql | requirement, source_tables | 取数需求 + 数据源 |
| define-metrics | metric_name, business_desc | 指标名 + 业务描述 |
| generate-dq-rules | model_name, columns | 模型名 + 字段清单 |
| analyze-lineage | target_model | 目标模型代码 |

**输出 Schema 结构：**

| 场景 | 核心输出结构 |
|------|--------------|
| design-new-model | fact_table_definition, dimension_definitions, layer_mapping, dbt_template |
| review-existing-model | summary, issues, quality_score, checklist |
| generate-sql | sql_code, explanation, validator_result, performance_hints |
| define-metrics | metric_definition, semantic_layer_yaml, documentation |
| generate-dq-rules | dbt_tests_yaml, rules_summary, rules_list, layer_thresholds |
| analyze-lineage | table_lineage, column_lineage, impact_assessment |

**Schema 特性：**
- 使用 draft-2020-12 格式
- $id 格式：`dw:{scenario}:{input|output}:v1`
- 中文 description 和 errorMessage
- schema_version 字段支持未来迁移

**Commit:** `763af1f`

## Decisions Made

| 决策 | 选择 | 理由 |
|------|------|------|
| 配置格式 | YAML 1.2 | 避免 on/yes 布尔陷阱，支持中文注释 |
| Schema 版本 | draft-2020-12 | 最新规范，ajv 8.x 完整支持 |
| 版本字段 | schema_version: 1 | 内置版本支持未来迁移 |
| 上下文层级 | always/scenario/onDemand | 平衡 token 预算与完整性 |
| 错误消息 | 中文 errorMessage | 面向中文用户 |
| Token 预算 | 4000 总/1500 输出预留 | 确保输入+输出不超限 |

## Deviations from Plan

None - 计划按预期执行完成。

## Verification Results

- [x] 3 个配置文件存在且格式正确
- [x] scenarios.yaml 包含 6 个完整场景配置
- [x] platforms.yaml 包含 hive 平台配置
- [x] assembly-rules.yaml 包含三级上下文规则和 token 预算
- [x] 12 个 JSON Schema 文件存在
- [x] 每个 Schema 是合法 JSON（python json.tool 验证通过）
- [x] Schema 包含 $schema 和 $id 字段
- [x] 输入 Schema 包含 errorMessage 字段

## Next Phase Readiness

**08-02-PLAN.md 依赖已就绪：**
- scenarios.yaml 提供场景配置查询
- platforms.yaml 提供平台上下文文件清单
- assembly-rules.yaml 提供组装规则

**08-03-PLAN.md 依赖已就绪：**
- JSON Schema 提供输入输出校验规范
- 配置文件提供组装参数

## Files Created

```
.claude/data-warehouse/
├── config/
│   ├── scenarios.yaml          # 6 场景配置映射
│   ├── platforms.yaml          # Hive 平台配置
│   └── assembly-rules.yaml     # 组装规则
└── schemas/
    ├── input/
    │   ├── design-new-model.schema.json
    │   ├── review-existing-model.schema.json
    │   ├── generate-sql.schema.json
    │   ├── define-metrics.schema.json
    │   ├── generate-dq-rules.schema.json
    │   └── analyze-lineage.schema.json
    └── output/
        ├── design-new-model.schema.json
        ├── review-existing-model.schema.json
        ├── generate-sql.schema.json
        ├── define-metrics.schema.json
        ├── generate-dq-rules.schema.json
        └── analyze-lineage.schema.json
```

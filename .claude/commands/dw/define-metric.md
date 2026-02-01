---
name: dw:define-metric
description: 定义标准化指标并生成 Semantic Layer 配置
argument-hint: "[指标名称和业务描述]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
根据用户输入的指标名称和业务描述，输出标准化指标定义和 dbt Semantic Layer YAML 配置。

**输出产物：**
- 指标规格书
- dbt Semantic Layer YAML（semantic_models + metrics）
- 口径说明文档
</objective>

<execution_context>
@./.claude/data-warehouse/prompts/scenarios/define-metrics/prompt.md
@./.claude/data-warehouse/prompts/scenarios/define-metrics/output-template.md
@./.claude/data-warehouse/prompts/scenarios/define-metrics/input-template.md
</execution_context>

<context>
# 运行时上下文（从 prompt.md frontmatter includes 加载）
@./.claude/data-warehouse/context/governance/metrics-core.md
@./.claude/data-warehouse/context/methodology/fact-table-types-core.md
@./.claude/data-warehouse/context/layers/layering-system-core.md
@./.claude/data-warehouse/docs/naming-core.md
</context>

<process>
1. **解析用户输入**
   - 如果 $ARGUMENTS 非空，解析为指标需求
   - 如果为空，询问指标名称和业务描述

2. **执行两段式交互**
   - Stage 1：输出指标规格书 + 待确认问题
   - 等待用户确认
   - Stage 2：生成 Semantic Layer YAML + 口径说明

3. **输出产物**
   - 按 output-template.md 格式输出
   - 使用 `### File: {path}` 标记可落盘文件
</process>

<success_criteria>
- [ ] 指标分类已确定（原子/派生/复合）
- [ ] 必问项已确认（grain/时间字段/可切维度）
- [ ] YAML 配置完整（semantic_models + metrics）
- [ ] 派生指标依赖关系清晰
</success_criteria>

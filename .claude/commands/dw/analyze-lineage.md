---
name: dw:analyze-lineage
description: 分析数据血缘关系并评估变更影响
argument-hint: "[SQL 代码或变更描述]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
根据用户输入的 SQL 或 dbt 模型代码，输出表级和字段级血缘关系，支持变更影响评估。

**输出产物：**
- 表级血缘图（Mermaid）
- 字段级血缘映射表
- JOIN 关联分析
- 变更影响评估报告（如需）
</objective>

<execution_context>
@./.claude/data-warehouse/prompts/scenarios/analyze-lineage/prompt.md
@./.claude/data-warehouse/prompts/scenarios/analyze-lineage/output-template.md
@./.claude/data-warehouse/prompts/scenarios/analyze-lineage/input-template.md
@./.claude/data-warehouse/prompts/scenarios/analyze-lineage/impact-analysis-template.md
</execution_context>

<context>
# 运行时上下文（从 prompt.md frontmatter includes 加载）
@./.claude/data-warehouse/context/platform/dbt-hive-limitations-core.md
@./.claude/data-warehouse/context/layers/layering-system-core.md
@./.claude/data-warehouse/docs/naming-core.md
</context>

<process>
1. **解析用户输入**
   - 如果 $ARGUMENTS 非空，解析为 SQL 代码或变更描述
   - 如果为空，询问待分析的代码

2. **执行三段式交互**
   - Stage 1：输出表级血缘概览 + JOIN 关联分析
   - Stage 2（按需）：输出字段级血缘映射表
   - Stage 3（按需）：输出变更影响评估报告

3. **输出产物**
   - 按 output-template.md 格式输出
   - 使用边级置信度（A/B/C/D）
   - 使用 `### File: {path}` 标记可落盘文件
</process>

<success_criteria>
- [ ] 表级血缘已识别（ref/source/原生表）
- [ ] JOIN 关联已分析（类型/条件/风险标记）
- [ ] 边级置信度已标注（证据/位置）
- [ ] 影响评估完整（如需，含全链路追踪）
</success_criteria>

---
name: dw:design
description: 设计新的数仓模型（事实表/维度表）
argument-hint: "[业务事件描述]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
根据业务需求设计星型模型，包含事实表、维度表、SCD 策略、分层落点。

**输出产物：**
- 建模规格书
- DDL 语句
- dbt schema.yml
- dbt SQL 模型
</objective>

<execution_context>
@./.claude/data-warehouse/prompts/scenarios/design-new-model/prompt.md
@./.claude/data-warehouse/prompts/scenarios/design-new-model/output-template.md
@./.claude/data-warehouse/prompts/scenarios/design-new-model/input-template.md
</execution_context>

<context>
# 运行时上下文（从 prompt.md frontmatter includes 加载）
@./.claude/data-warehouse/context/methodology/dimensional-modeling-core.md
@./.claude/data-warehouse/context/methodology/fact-table-types-core.md
@./.claude/data-warehouse/context/methodology/scd-strategies-core.md
@./.claude/data-warehouse/context/layers/layering-system-core.md
@./.claude/data-warehouse/context/platform/hive-constraints-core.md
@./.claude/data-warehouse/context/platform/dbt-hive-limitations-core.md
@./.claude/data-warehouse/docs/naming-core.md
</context>

<process>
1. **解析用户输入**
   - 如果 $ARGUMENTS 非空，解析为业务需求
   - 如果为空，询问业务事件和粒度

2. **执行两段式交互**
   - Stage 1：生成建模规格书 + 待确认问题
   - 等待用户确认
   - Stage 2：生成完整产物

3. **输出产物**
   - 按 output-template.md 格式输出
   - 使用 `### File: {path}` 标记可落盘文件
</process>

<success_criteria>
- [ ] 输入已解析（业务事件 + 粒度）
- [ ] 规格书已确认
- [ ] 产物完整（DDL + schema.yml + dbt SQL）
</success_criteria>

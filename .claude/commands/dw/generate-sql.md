---
name: dw:generate-sql
description: 根据取数需求生成 Hive SQL
argument-hint: "[取数需求描述]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
根据用户的取数口径/过滤/时间窗需求，生成 Hive SQL 及配套文档。

**输出产物：**
- Hive SQL（带中文注释）
- Validator 自检结果
- 口径说明文档
- 性能提示
- 依赖说明
</objective>

<execution_context>
@./.claude/data-warehouse/prompts/scenarios/generate-sql/prompt.md
@./.claude/data-warehouse/prompts/scenarios/generate-sql/output-template.md
@./.claude/data-warehouse/prompts/scenarios/generate-sql/input-template.md
@./.claude/data-warehouse/prompts/scenarios/generate-sql/time-expressions.md
</execution_context>

<context>
# 运行时上下文（从 prompt.md frontmatter includes 加载）
@./.claude/data-warehouse/context/platform/hive-constraints-core.md
@./.claude/data-warehouse/context/layers/layering-system-core.md
@./.claude/data-warehouse/docs/naming-core.md
</context>

<process>
1. **解析用户输入**
   - 如果 $ARGUMENTS 非空，解析为取数需求
   - 如果为空，询问取数目标和数据源

2. **执行两段式交互**
   - Stage 1：输出取数需求理解确认 + 待确认问题
   - 等待用户确认
   - Stage 2：生成完整 SQL 及配套文档

3. **输出产物**
   - 按 output-template.md 格式输出
   - 执行 Validator 自检（P0 阻断）
   - 使用 `### File: {path}` 标记可落盘文件
</process>

<success_criteria>
- [ ] 取数需求已确认（8 类必问项）
- [ ] SQL 已生成（带中文注释）
- [ ] Validator 自检通过（无 P0）
- [ ] 口径说明完整
</success_criteria>

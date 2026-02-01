---
name: dw:generate-dq
description: 根据模型定义生成 dbt tests 数据质量规则
argument-hint: "[模型名称或字段清单]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
根据用户输入的表/模型定义，自动生成完整的 dbt tests 配置。

**输出产物：**
- 规则清单预览
- dbt tests YAML（schema.yml）
- dbt-expectations 配置（如需）
</objective>

<execution_context>
@./.claude/data-warehouse/prompts/scenarios/generate-dq-rules/prompt.md
@./.claude/data-warehouse/prompts/scenarios/generate-dq-rules/output-template.md
@./.claude/data-warehouse/prompts/scenarios/generate-dq-rules/input-template.md
</execution_context>

<context>
# 运行时上下文（从 prompt.md frontmatter includes 加载）
@./.claude/data-warehouse/context/governance/dq-rules-core.md
@./.claude/data-warehouse/context/layers/layering-system-core.md
@./.claude/data-warehouse/context/platform/hive-constraints-core.md
@./.claude/data-warehouse/context/platform/dbt-hive-limitations-core.md
@./.claude/data-warehouse/docs/naming-core.md
</context>

<process>
1. **解析用户输入**
   - 如果 $ARGUMENTS 非空，尝试读取模型或解析字段清单
   - 如果为空，询问目标模型和字段清单

2. **执行两段式交互**
   - Stage 1：输出规则清单预览 + 待确认问题
   - 等待用户确认
   - Stage 2：生成完整 dbt tests YAML

3. **输出产物**
   - 按 output-template.md 格式输出
   - 字段类型驱动规则推断
   - 使用 `### File: {path}` 标记可落盘文件
</process>

<success_criteria>
- [ ] 8 类必问项已确认（目标/字段/分区/窗口/SCD2/阈值/新鲜度/Hive 方言）
- [ ] 规则清单完整（按字段后缀推断）
- [ ] 分层阈值适配（ODS 宽松 / DWD-DWS 中等 / ADS 严格）
- [ ] YAML 配置可运行
</success_criteria>

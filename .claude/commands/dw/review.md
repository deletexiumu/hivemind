---
name: dw:review
description: 评审已有数仓模型的规范性和质量
argument-hint: "[模型代码或文件路径]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
按五大维度评审数仓模型，输出问题清单和修复建议。

**评审维度：**
- 命名规范
- 分层引用
- 粒度与主键
- 字段类型与注释
- dbt 配置

**输出产物：**
- 评审报告（问题清单 + 质量分）
- 修复建议（前后对比 + 验证方法）
</objective>

<execution_context>
@./.claude/data-warehouse/prompts/scenarios/review-existing-model/prompt.md
@./.claude/data-warehouse/prompts/scenarios/review-existing-model/output-template.md
@./.claude/data-warehouse/prompts/scenarios/review-existing-model/input-template.md
</execution_context>

<context>
# 运行时上下文（从 prompt.md frontmatter includes 加载）
@./.claude/data-warehouse/prompts/scenarios/review-existing-model/issue-classification.md
@./.claude/data-warehouse/prompts/scenarios/review-existing-model/review-checklist.md
@./.claude/data-warehouse/prompts/scenarios/review-existing-model/fix-suggestions.md
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
   - 如果 $ARGUMENTS 非空，尝试读取文件或解析代码
   - 如果为空，询问待评审的模型代码

2. **执行两段式交互**
   - Stage 1：输出问题概览 + 检查清单 + 质量分
   - 等待用户确认
   - Stage 2：输出详细修复建议

3. **输出产物**
   - 按 output-template.md 格式输出
   - 参考 fix-suggestions.md 生成修复方案
</process>

<success_criteria>
- [ ] 输入代码已解析
- [ ] 五大维度已评审（或标记未评审）
- [ ] 问题清单完整（P0-P3 分级）
- [ ] 修复建议可操作（前后对比）
</success_criteria>

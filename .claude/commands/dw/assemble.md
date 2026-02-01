---
name: dw:assemble
description: 根据场景组装完整提示
argument-hint: "<scenario> [--context-level=standard] [--json]"
allowed-tools:
  - Read
  - Bash
  - Glob
---

<objective>
根据场景配置组装完整提示包，包含系统提示、上下文、场景提示。

支持输出格式：
- 默认：Markdown（直接可用）
- --json：JSON（含 token breakdown、trace）

支持上下文级别：
- minimal：仅必需上下文
- standard：标准上下文（默认）
- full：包含所有可选上下文
</objective>

<execution_context>
@./.claude/data-warehouse/config/scenarios.yaml
@./.claude/data-warehouse/config/assembly-rules.yaml
</execution_context>

<process>
1. **解析场景参数**
   - 场景 ID（如 design-new-model, review-existing-model）
   - 上下文级别（minimal/standard/full）
   - 输出格式（markdown/json）

2. **调用组装脚本**
   ```bash
   cd .claude/data-warehouse && node scripts/assemble.js $ARGUMENTS
   ```

3. **返回组装结果**
   - Markdown 格式：直接输出可用提示
   - JSON 格式：含 token breakdown 和 trace
</process>

<usage_examples>
```bash
# 组装设计场景提示（标准上下文，Markdown 输出）
/dw:assemble design-new-model

# 组装评审场景提示（完整上下文）
/dw:assemble review-existing-model --context-level=full

# JSON 格式输出（含 token 统计）
/dw:assemble generate-sql --json
```
</usage_examples>

<success_criteria>
- [ ] 场景 ID 有效
- [ ] 上下文文件正确加载
- [ ] 输出格式正确
- [ ] Token 预算未超限
</success_criteria>

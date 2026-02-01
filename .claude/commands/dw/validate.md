---
name: dw:validate
description: 校验场景输入/输出是否符合规格
argument-hint: "<scenario> --input=<file> [--output=<file>] [--strict]"
allowed-tools:
  - Read
  - Bash
---

<objective>
校验用户输入或模型输出是否符合场景规格。

**校验级别：**
- CRITICAL：必填缺失 → 阻断
- WARNING：规范不符 → 警告
- INFO：建议 → 提示

**校验对象：**
- --input：校验用户输入是否符合场景输入模板
- --output：校验模型输出是否符合输出模板
</objective>

<execution_context>
@./.claude/data-warehouse/schemas/input/*.schema.json
@./.claude/data-warehouse/schemas/output/*.schema.json
</execution_context>

<process>
1. **解析参数**
   - 场景 ID
   - 输入文件路径（--input）
   - 输出文件路径（--output，可选）
   - 严格模式（--strict，可选）

2. **调用校验脚本**
   ```bash
   cd .claude/data-warehouse && node scripts/validate.js $ARGUMENTS
   ```

3. **返回校验报告**
   - 校验结果（PASS/WARN/FAIL）
   - 问题清单（按级别分组）
   - 修复建议
</process>

<usage_examples>
```bash
# 校验设计场景输入
/dw:validate design-new-model --input=./my-input.yaml

# 校验评审场景输出
/dw:validate review-existing-model --output=./review-result.md

# 严格模式（WARNING 也阻断）
/dw:validate generate-sql --input=./query.yaml --strict
```
</usage_examples>

<output_format>
### 校验报告

**场景：** {scenario-id}
**校验对象：** {input/output}
**结果：** {PASS/WARN/FAIL}

#### 问题清单

| 级别 | 字段 | 问题 | 建议 |
|------|------|------|------|
| CRITICAL | business_event | 必填字段缺失 | 请提供业务事件描述 |
| WARNING | measures | 格式不规范 | 建议使用 YAML 列表格式 |

#### 统计

- CRITICAL: {N}
- WARNING: {N}
- INFO: {N}
</output_format>

<success_criteria>
- [ ] 场景 ID 有效
- [ ] 文件路径存在且可读
- [ ] Schema 校验执行成功
- [ ] 报告格式完整
</success_criteria>

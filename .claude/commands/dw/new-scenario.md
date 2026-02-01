---
name: dw:new-scenario
description: 创建新场景的脚手架文件
argument-hint: "<scenario-id> [--name=\"场景名称\"]"
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
为新场景生成完整的脚手架文件。

**生成内容：**
- prompt.md — 场景提示主文件
- output-template.md — 输出模板
- input-template.md — 输入模板
- examples/ — 案例目录
- schemas/input/{scenario}.schema.json — 输入 Schema
- schemas/output/{scenario}.schema.json — 输出 Schema

并自动更新配置文件 scenarios.yaml。
</objective>

<process>
1. **解析参数**
   - 场景 ID（如 new-custom-scenario）
   - 场景名称（中文，可选）

2. **调用脚手架脚本**
   ```bash
   cd .claude/data-warehouse && node scripts/scaffold.js $ARGUMENTS
   ```

3. **列出创建的文件**
   - 显示文件路径和简要说明

4. **提示下一步**
   - 填充 prompt.md 核心逻辑
   - 定义输入/输出模板
   - 编写案例
</process>

<usage_examples>
```bash
# 创建新场景（使用 ID 作为名称）
/dw:new-scenario my-custom-scenario

# 创建新场景（指定中文名称）
/dw:new-scenario data-profiling --name="数据画像分析"
```
</usage_examples>

<output_format>
### 场景脚手架创建完成

**场景 ID：** {scenario-id}
**场景名称：** {name}

#### 创建的文件

| 文件 | 说明 | 状态 |
|------|------|------|
| prompts/scenarios/{id}/prompt.md | 场景提示主文件 | 待填充 |
| prompts/scenarios/{id}/output-template.md | 输出模板 | 待填充 |
| prompts/scenarios/{id}/input-template.md | 输入模板 | 待填充 |
| prompts/scenarios/{id}/examples/ | 案例目录 | 已创建 |
| schemas/input/{id}.schema.json | 输入 Schema | 骨架已生成 |
| schemas/output/{id}.schema.json | 输出 Schema | 骨架已生成 |

#### 配置更新

- [x] scenarios.yaml 已添加场景条目

#### 下一步

1. 编辑 `prompt.md`，填充场景核心逻辑
2. 定义 `input-template.md` 和 `output-template.md`
3. 完善 JSON Schema 校验规则
4. 编写至少 1 个案例
5. 创建对应的 `/dw:{id}` 命令文件
</output_format>

<success_criteria>
- [ ] 场景 ID 符合命名规范（kebab-case）
- [ ] 所有脚手架文件已创建
- [ ] scenarios.yaml 已更新
- [ ] 命令引导完整
</success_criteria>

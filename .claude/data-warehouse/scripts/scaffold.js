#!/usr/bin/env node

/**
 * scaffold.js - 脚手架生成脚本
 *
 * 为新场景生成标准目录结构和模板文件。
 *
 * Usage:
 *   node scaffold.js <scenario-id> [--name="场景名称"]
 *
 * Examples:
 *   node scaffold.js data-profiling --name="数据画像"
 *   node scaffold.js etl-optimization
 *
 * @version 1.0.0
 * @author HiveMind
 */

import { program } from 'commander';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname 兼容
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础目录
const BASE_DIR = path.resolve(__dirname, '..');
const CONFIG_DIR = path.join(BASE_DIR, 'config');
const PROMPTS_DIR = path.join(BASE_DIR, 'prompts', 'scenarios');
const SCHEMAS_DIR = path.join(BASE_DIR, 'schemas');

// -----------------------------------------
// CLI 定义
// -----------------------------------------
program
  .name('scaffold')
  .description('生成新场景的脚手架文件')
  .argument('<scenario-id>', '场景 ID（kebab-case，如 data-profiling）')
  .option('--name <name>', '场景中文名称')
  .option('--json', '输出 JSON 格式结果')
  .helpOption('-h, --help', '显示帮助信息')
  .parse(process.argv);

const scenarioId = program.args[0];
const options = program.opts();

// -----------------------------------------
// 模板内容
// -----------------------------------------

/**
 * 生成 prompt.md 模板
 * @param {string} id - 场景 ID
 * @param {string} name - 场景名称
 * @returns {string} 模板内容
 */
function generatePromptTemplate(id, name) {
  return `---
id: ${id}
name: ${name}
version: 1.0.0
type: scenario
level: scenario
token_budget: 1500
includes:
  - context/platform/hive-constraints-core
  - context/platform/dbt-hive-limitations-core
  - docs/naming-core
applies_to:
  - ${id}
schema_version: 1
---

# ${name}

## 角色定义

你是一个专业的数仓架构师，擅长 ${name} 相关的任务。

## 任务目标

根据用户输入，完成 ${name} 任务，输出符合规范的结果。

## 输入要求

### 必填信息

- **信息 A:** [描述必填信息 A]
- **信息 B:** [描述必填信息 B]

### 可选信息

- **信息 C:** [描述可选信息 C]

## 处理流程

### Stage 1: 确认需求

1. 分析用户输入
2. 确认关键信息
3. 输出规格确认

### Stage 2: 生成产物

1. 根据确认的规格生成产物
2. 应用质量检查
3. 输出最终结果

## 约束条件

- 遵循 Hive 平台约束
- 遵循 dbt-hive 适配器限制
- 遵循命名规范

## 输出格式

参见 output-template.md
`;
}

/**
 * 生成 output-template.md 模板
 * @param {string} id - 场景 ID
 * @param {string} name - 场景名称
 * @returns {string} 模板内容
 */
function generateOutputTemplate(id, name) {
  return `---
id: ${id}-output
name: ${name} 输出模板
version: 1.0.0
type: output-template
schema_version: 1
---

# ${name} 输出模板

## Stage 1: 规格确认

\`\`\`yaml
# 规格确认
scenario: ${id}
stage: 1
status: pending_confirmation

specification:
  # 关键信息确认
  key_info_a: "[确认的信息 A]"
  key_info_b: "[确认的信息 B]"

  # 推断信息
  inferred:
    - "[推断 1]"
    - "[推断 2]"

confirmation_required:
  - "[需要用户确认的事项]"
\`\`\`

---

## Stage 2: 完整产物

### 2.1 主要输出

\`\`\`yaml
# 主要输出
scenario: ${id}
stage: 2
status: complete

output:
  # 产物内容
  content: |
    [产物内容]
\`\`\`

### 2.2 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 规范符合性 | PASS/FAIL | [说明] |
| 完整性 | PASS/FAIL | [说明] |

---

## 输出交付约定

\`\`\`
### File: [output-path]
[文件内容]
\`\`\`
`;
}

/**
 * 生成 input-template.md 模板
 * @param {string} id - 场景 ID
 * @param {string} name - 场景名称
 * @returns {string} 模板内容
 */
function generateInputTemplate(id, name) {
  return `---
id: ${id}-input
name: ${name} 输入模板
version: 1.0.0
type: input-template
schema_version: 1
---

# ${name} 输入模板

## 输入格式

\`\`\`yaml
# ${name} 输入
schema_version: 1

# 必填字段
required_field_a: ""     # 必填信息 A
required_field_b: ""     # 必填信息 B

# 可选字段
optional_field_c: ""     # 可选信息 C（默认值）

# 高级选项
advanced:
  option_1: false        # 高级选项 1
  option_2: ""           # 高级选项 2
\`\`\`

## 字段说明

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| required_field_a | 是 | string | 必填信息 A |
| required_field_b | 是 | string | 必填信息 B |
| optional_field_c | 否 | string | 可选信息 C |
| advanced.option_1 | 否 | boolean | 高级选项 1 |
| advanced.option_2 | 否 | string | 高级选项 2 |

## 示例

\`\`\`yaml
schema_version: 1
required_field_a: "示例值 A"
required_field_b: "示例值 B"
\`\`\`
`;
}

/**
 * 生成输入 Schema
 * @param {string} id - 场景 ID
 * @param {string} name - 场景名称
 * @returns {object} Schema 对象
 */
function generateInputSchema(id, name) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `dw:${id}:input:v1`,
    title: `${name} Input`,
    description: `${name} 场景输入规格`,
    type: 'object',
    required: ['schema_version'],
    properties: {
      schema_version: {
        const: 1,
        description: 'Schema 版本',
        errorMessage: 'schema_version 必须为 1',
      },
      // 添加更多字段...
    },
    additionalProperties: false,
  };
}

/**
 * 生成输出 Schema
 * @param {string} id - 场景 ID
 * @param {string} name - 场景名称
 * @returns {object} Schema 对象
 */
function generateOutputSchema(id, name) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `dw:${id}:output:v1`,
    title: `${name} Output`,
    description: `${name} 场景输出规格`,
    type: 'object',
    required: ['schema_version', 'scenario', 'stage', 'status'],
    properties: {
      schema_version: {
        const: 1,
        description: 'Schema 版本',
        errorMessage: 'schema_version 必须为 1',
      },
      scenario: {
        const: id,
        description: '场景 ID',
        errorMessage: `scenario 必须为 ${id}`,
      },
      stage: {
        type: 'integer',
        enum: [1, 2],
        description: '阶段编号',
        errorMessage: 'stage 必须为 1 或 2',
      },
      status: {
        type: 'string',
        enum: ['pending_confirmation', 'complete', 'error'],
        description: '状态',
        errorMessage: 'status 必须为 pending_confirmation、complete 或 error',
      },
    },
    additionalProperties: true,
  };
}

// -----------------------------------------
// 文件操作
// -----------------------------------------

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 写入文件
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @returns {boolean} 是否为新建
 */
function writeFile(filePath, content) {
  const isNew = !fs.existsSync(filePath);
  fs.writeFileSync(filePath, content, 'utf8');
  return isNew;
}

/**
 * 更新 scenarios.yaml
 * @param {string} id - 场景 ID
 * @param {string} name - 场景名称
 * @returns {boolean} 是否成功添加
 */
function updateScenariosConfig(id, name) {
  const configPath = path.join(CONFIG_DIR, 'scenarios.yaml');

  if (!fs.existsSync(configPath)) {
    console.error(`[WARN] scenarios.yaml 不存在，跳过配置更新`);
    return false;
  }

  const content = fs.readFileSync(configPath, 'utf8');
  const config = parseYaml(content, { version: '1.2', uniqueKeys: true });

  // 检查是否已存在
  const existing = config.scenarios.find((s) => s.id === id);
  if (existing) {
    console.error(`[WARN] 场景 ${id} 已存在于配置中，跳过`);
    return false;
  }

  // 添加新场景
  const newScenario = {
    id,
    name,
    description: `${name} 场景（待完善描述）`,
    prompt_file: `prompts/scenarios/${id}/prompt.md`,
    output_template: `prompts/scenarios/${id}/output-template.md`,
    requires_context: [
      'context/platform/hive-constraints-core',
      'context/platform/dbt-hive-limitations-core',
      'docs/naming-core',
    ],
    max_tokens: 1500,
    examples_dir: `prompts/scenarios/${id}/examples`,
  };

  config.scenarios.push(newScenario);

  // 写回配置
  const newContent = stringifyYaml(config, {
    version: '1.2',
    lineWidth: 0, // 不自动换行
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN',
  });

  fs.writeFileSync(configPath, newContent, 'utf8');
  return true;
}

// -----------------------------------------
// 主逻辑
// -----------------------------------------

async function main() {
  try {
    // 验证场景 ID 格式
    if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(scenarioId)) {
      console.error(`[ERROR] 场景 ID 必须是 kebab-case 格式（如 data-profiling）`);
      process.exit(2);
    }

    // 确定场景名称
    const scenarioName = options.name || scenarioId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    // 创建的文件列表
    const createdFiles = [];
    const skippedFiles = [];

    // 1. 创建场景目录
    const scenarioDir = path.join(PROMPTS_DIR, scenarioId);
    ensureDir(scenarioDir);

    // 2. 创建 examples 目录
    const examplesDir = path.join(scenarioDir, 'examples');
    ensureDir(examplesDir);

    // 3. 生成 prompt.md
    const promptPath = path.join(scenarioDir, 'prompt.md');
    if (!fs.existsSync(promptPath)) {
      writeFile(promptPath, generatePromptTemplate(scenarioId, scenarioName));
      createdFiles.push(`prompts/scenarios/${scenarioId}/prompt.md`);
    } else {
      skippedFiles.push(`prompts/scenarios/${scenarioId}/prompt.md (已存在)`);
    }

    // 4. 生成 output-template.md
    const outputTemplatePath = path.join(scenarioDir, 'output-template.md');
    if (!fs.existsSync(outputTemplatePath)) {
      writeFile(outputTemplatePath, generateOutputTemplate(scenarioId, scenarioName));
      createdFiles.push(`prompts/scenarios/${scenarioId}/output-template.md`);
    } else {
      skippedFiles.push(`prompts/scenarios/${scenarioId}/output-template.md (已存在)`);
    }

    // 5. 生成 input-template.md
    const inputTemplatePath = path.join(scenarioDir, 'input-template.md');
    if (!fs.existsSync(inputTemplatePath)) {
      writeFile(inputTemplatePath, generateInputTemplate(scenarioId, scenarioName));
      createdFiles.push(`prompts/scenarios/${scenarioId}/input-template.md`);
    } else {
      skippedFiles.push(`prompts/scenarios/${scenarioId}/input-template.md (已存在)`);
    }

    // 6. 生成 .gitkeep for examples
    const gitkeepPath = path.join(examplesDir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      writeFile(gitkeepPath, '');
      createdFiles.push(`prompts/scenarios/${scenarioId}/examples/.gitkeep`);
    }

    // 7. 生成输入 Schema
    const inputSchemaPath = path.join(SCHEMAS_DIR, 'input', `${scenarioId}.schema.json`);
    if (!fs.existsSync(inputSchemaPath)) {
      writeFile(inputSchemaPath, JSON.stringify(generateInputSchema(scenarioId, scenarioName), null, 2));
      createdFiles.push(`schemas/input/${scenarioId}.schema.json`);
    } else {
      skippedFiles.push(`schemas/input/${scenarioId}.schema.json (已存在)`);
    }

    // 8. 生成输出 Schema
    const outputSchemaPath = path.join(SCHEMAS_DIR, 'output', `${scenarioId}.schema.json`);
    if (!fs.existsSync(outputSchemaPath)) {
      writeFile(outputSchemaPath, JSON.stringify(generateOutputSchema(scenarioId, scenarioName), null, 2));
      createdFiles.push(`schemas/output/${scenarioId}.schema.json`);
    } else {
      skippedFiles.push(`schemas/output/${scenarioId}.schema.json (已存在)`);
    }

    // 9. 更新 scenarios.yaml
    const configUpdated = updateScenariosConfig(scenarioId, scenarioName);
    if (configUpdated) {
      createdFiles.push('config/scenarios.yaml (已更新)');
    }

    // 输出结果
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            scenario_id: scenarioId,
            scenario_name: scenarioName,
            created_files: createdFiles,
            skipped_files: skippedFiles,
            config_updated: configUpdated,
            next_steps: [
              `编辑 prompts/scenarios/${scenarioId}/prompt.md 完善提示内容`,
              `编辑 prompts/scenarios/${scenarioId}/output-template.md 完善输出模板`,
              `编辑 schemas/input/${scenarioId}.schema.json 添加输入字段`,
              `在 examples/ 目录添加示例文件`,
            ],
          },
          null,
          2
        )
      );
    } else {
      console.log(`\n脚手架生成完成: ${scenarioId}\n`);
      console.log(`场景名称: ${scenarioName}\n`);

      if (createdFiles.length > 0) {
        console.log('创建的文件:');
        createdFiles.forEach((f) => console.log(`  + ${f}`));
        console.log('');
      }

      if (skippedFiles.length > 0) {
        console.log('跳过的文件:');
        skippedFiles.forEach((f) => console.log(`  - ${f}`));
        console.log('');
      }

      console.log('下一步:');
      console.log(`  1. 编辑 prompts/scenarios/${scenarioId}/prompt.md 完善提示内容`);
      console.log(`  2. 编辑 prompts/scenarios/${scenarioId}/output-template.md 完善输出模板`);
      console.log(`  3. 编辑 schemas/input/${scenarioId}.schema.json 添加输入字段`);
      console.log(`  4. 在 examples/ 目录添加示例文件`);
      console.log('');
    }
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(2);
  }
}

main();

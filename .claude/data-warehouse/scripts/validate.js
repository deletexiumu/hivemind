#!/usr/bin/env node

/**
 * validate.js - 规格校验脚本
 *
 * 使用 JSON Schema 校验场景输入/输出，支持分级错误处理。
 *
 * Usage:
 *   node validate.js <scenario> --input=<file> [--output=<file>] [--json] [--strict]
 *
 * Examples:
 *   node validate.js design-new-model --input=./my-input.json
 *   node validate.js generate-sql --input=./input.yaml --json --strict
 *   node validate.js review-existing-model --input=./in.json --output=./out.json
 *
 * @version 1.0.0
 * @author HiveMind
 */

import { program } from 'commander';
import { parse as parseYaml } from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname 兼容
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础目录
const BASE_DIR = path.resolve(__dirname, '..');
const SCHEMAS_DIR = path.join(BASE_DIR, 'schemas');

// 支持的 schema 版本
const SUPPORTED_SCHEMA_VERSIONS = [1];

// -----------------------------------------
// CLI 定义
// -----------------------------------------
program
  .name('validate')
  .description('校验场景输入/输出规格')
  .argument('<scenario>', '场景 ID（如 design-new-model, generate-sql）')
  .option('--input <file>', '输入文件路径（JSON 或 YAML）')
  .option('--output <file>', '输出文件路径（可选，用于校验输出）')
  .option('--json', '输出 JSON 格式报告')
  .option('--strict', 'WARNING 级别也导致失败（exit 1）')
  .helpOption('-h, --help', '显示帮助信息')
  .parse(process.argv);

const scenarioId = program.args[0];
const options = program.opts();

// -----------------------------------------
// 错误分级
// -----------------------------------------

/**
 * 错误级别定义
 */
const SEVERITY = {
  CRITICAL: 'CRITICAL', // 必填字段缺失、schema 版本不支持 → exit 1
  WARNING: 'WARNING', // 命名不符、轻微超预算 → 警告但继续
  INFO: 'INFO', // 可选字段未填 → 仅提示
};

/**
 * 默认错误消息翻译
 */
const DEFAULT_ERROR_MESSAGES = {
  required: '必填字段缺失',
  type: '字段类型错误',
  minLength: '字符串长度不足',
  maxLength: '字符串长度超限',
  minimum: '数值低于最小值',
  maximum: '数值超过最大值',
  pattern: '格式不匹配',
  enum: '值不在允许范围内',
  additionalProperties: '包含未知字段',
  const: '值必须为指定常量',
};

// -----------------------------------------
// 文件加载
// -----------------------------------------

/**
 * 加载并解析数据文件（JSON 或 YAML）
 * @param {string} filePath - 文件路径
 * @returns {object} 解析后的数据
 */
function loadDataFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.json') {
    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(`JSON 解析失败: ${e.message}`);
    }
  } else if (ext === '.yaml' || ext === '.yml') {
    try {
      return parseYaml(content, { version: '1.2', uniqueKeys: true });
    } catch (e) {
      throw new Error(`YAML 解析失败: ${e.message}`);
    }
  } else {
    // 尝试自动检测
    try {
      return JSON.parse(content);
    } catch {
      try {
        return parseYaml(content, { version: '1.2', uniqueKeys: true });
      } catch {
        throw new Error(`无法解析文件格式: ${filePath}`);
      }
    }
  }
}

/**
 * 加载 JSON Schema
 * @param {string} schemaPath - Schema 文件路径
 * @returns {object} Schema 对象
 */
function loadSchema(schemaPath) {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema 文件不存在: ${schemaPath}`);
  }

  const content = fs.readFileSync(schemaPath, 'utf8');
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Schema JSON 解析失败: ${e.message}`);
  }
}

// -----------------------------------------
// 校验器
// -----------------------------------------

/**
 * 创建 AJV 校验器实例
 * @returns {Ajv} 配置好的 AJV 实例
 */
function createValidator() {
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false,
  });
  addFormats(ajv);
  ajvErrors(ajv);
  return ajv;
}

/**
 * 翻译错误消息
 * @param {object} error - AJV 错误对象
 * @returns {string} 翻译后的错误消息
 */
function translateError(error) {
  // 优先使用 schema 中定义的 errorMessage
  if (error.message && !error.message.startsWith('must ')) {
    return error.message;
  }

  // 使用默认翻译
  const keyword = error.keyword;
  const defaultMsg = DEFAULT_ERROR_MESSAGES[keyword];

  if (defaultMsg) {
    // 添加额外信息
    if (keyword === 'required' && error.params?.missingProperty) {
      return `${defaultMsg}: ${error.params.missingProperty}`;
    }
    if (keyword === 'minLength' && error.params?.limit) {
      return `${defaultMsg}（最小 ${error.params.limit} 字符）`;
    }
    if (keyword === 'enum' && error.params?.allowedValues) {
      return `${defaultMsg}: [${error.params.allowedValues.join(', ')}]`;
    }
    return defaultMsg;
  }

  return error.message || '未知错误';
}

/**
 * 分级处理校验错误
 * @param {object[]} errors - AJV 错误列表
 * @returns {object} 分级后的错误
 */
function categorizeErrors(errors) {
  const result = {
    critical: [],
    warning: [],
    info: [],
  };

  for (const error of errors) {
    const path = error.instancePath || '/';
    const message = translateError(error);
    const errorObj = {
      path,
      message,
      keyword: error.keyword,
      params: error.params,
    };

    // 分级规则
    if (error.keyword === 'required') {
      result.critical.push(errorObj);
    } else if (error.keyword === 'const' && path.includes('schema_version')) {
      result.critical.push(errorObj);
    } else if (error.keyword === 'type' || error.keyword === 'enum') {
      result.critical.push(errorObj);
    } else if (error.keyword === 'pattern' || error.keyword === 'minLength') {
      result.warning.push(errorObj);
    } else if (error.keyword === 'additionalProperties') {
      result.info.push(errorObj);
    } else {
      result.warning.push(errorObj);
    }
  }

  return result;
}

/**
 * 计算合规性评分
 * @param {object} categorized - 分级后的错误
 * @returns {number} 0-100 的评分
 */
function calculateScore(categorized) {
  // 初始分 100
  let score = 100;

  // CRITICAL 扣分：每个 -20
  score -= categorized.critical.length * 20;

  // WARNING 扣分：每个 -5
  score -= categorized.warning.length * 5;

  // INFO 扣分：每个 -1
  score -= categorized.info.length * 1;

  return Math.max(0, score);
}

/**
 * 校验数据
 * @param {object} data - 待校验数据
 * @param {object} schema - JSON Schema
 * @returns {object} 校验结果
 */
function validateData(data, schema) {
  // 版本检查
  if (data.schema_version !== undefined) {
    if (!SUPPORTED_SCHEMA_VERSIONS.includes(data.schema_version)) {
      return {
        valid: false,
        severity: SEVERITY.CRITICAL,
        errors: {
          critical: [
            {
              path: '/schema_version',
              message: `Schema 版本 ${data.schema_version} 不支持。支持的版本: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}`,
              keyword: 'version',
              params: { version: data.schema_version },
            },
          ],
          warning: [],
          info: [],
        },
        score: 0,
      };
    }
  }

  // AJV 校验
  const ajv = createValidator();
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (valid) {
    return {
      valid: true,
      severity: 'OK',
      errors: { critical: [], warning: [], info: [] },
      score: 100,
    };
  }

  // 分级处理错误
  const categorized = categorizeErrors(validate.errors || []);
  const score = calculateScore(categorized);

  // 确定总体级别
  let severity = 'OK';
  if (categorized.critical.length > 0) {
    severity = SEVERITY.CRITICAL;
  } else if (categorized.warning.length > 0) {
    severity = SEVERITY.WARNING;
  } else if (categorized.info.length > 0) {
    severity = SEVERITY.INFO;
  }

  return {
    valid: categorized.critical.length === 0,
    severity,
    errors: categorized,
    score,
  };
}

// -----------------------------------------
// 报告生成
// -----------------------------------------

/**
 * 生成 Markdown 格式报告
 * @param {string} scenarioId - 场景 ID
 * @param {string} type - 校验类型（input/output）
 * @param {object} result - 校验结果
 * @returns {string} Markdown 报告
 */
function generateMarkdownReport(scenarioId, type, result) {
  const lines = [];

  lines.push(`# 校验报告: ${scenarioId}`);
  lines.push('');
  lines.push(`**类型:** ${type}`);
  lines.push(`**状态:** ${result.valid ? 'PASS' : 'FAIL'}`);
  lines.push(`**级别:** ${result.severity}`);
  lines.push(`**评分:** ${result.score}/100`);
  lines.push('');

  // CRITICAL 错误
  if (result.errors.critical.length > 0) {
    lines.push('## CRITICAL 错误');
    lines.push('');
    lines.push('以下错误必须修复：');
    lines.push('');
    for (const err of result.errors.critical) {
      lines.push(`- **${err.path}**: ${err.message}`);
    }
    lines.push('');
  }

  // WARNING 警告
  if (result.errors.warning.length > 0) {
    lines.push('## WARNING 警告');
    lines.push('');
    lines.push('建议修复以下问题：');
    lines.push('');
    for (const err of result.errors.warning) {
      lines.push(`- **${err.path}**: ${err.message}`);
    }
    lines.push('');
  }

  // INFO 提示
  if (result.errors.info.length > 0) {
    lines.push('## INFO 提示');
    lines.push('');
    lines.push('可选改进：');
    lines.push('');
    for (const err of result.errors.info) {
      lines.push(`- **${err.path}**: ${err.message}`);
    }
    lines.push('');
  }

  // 无错误
  if (
    result.errors.critical.length === 0 &&
    result.errors.warning.length === 0 &&
    result.errors.info.length === 0
  ) {
    lines.push('## 结果');
    lines.push('');
    lines.push('校验通过，无问题发现。');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 生成 JSON 格式报告
 * @param {string} scenarioId - 场景 ID
 * @param {object} inputResult - 输入校验结果
 * @param {object|null} outputResult - 输出校验结果
 * @returns {object} JSON 报告
 */
function generateJsonReport(scenarioId, inputResult, outputResult) {
  const report = {
    scenario: scenarioId,
    timestamp: new Date().toISOString(),
    input: inputResult
      ? {
          valid: inputResult.valid,
          severity: inputResult.severity,
          score: inputResult.score,
          errors: inputResult.errors,
        }
      : null,
    output: outputResult
      ? {
          valid: outputResult.valid,
          severity: outputResult.severity,
          score: outputResult.score,
          errors: outputResult.errors,
        }
      : null,
    overall: {
      valid: inputResult?.valid && (outputResult?.valid ?? true),
      score: outputResult
        ? Math.round((inputResult.score + outputResult.score) / 2)
        : inputResult?.score ?? 0,
    },
  };

  return report;
}

// -----------------------------------------
// 主逻辑
// -----------------------------------------

async function main() {
  try {
    // 检查必需参数
    if (!options.input && !options.output) {
      console.error('[ERROR] 必须指定 --input 或 --output 参数');
      process.exit(2);
    }

    let inputResult = null;
    let outputResult = null;

    // 校验输入
    if (options.input) {
      const inputSchemaPath = path.join(SCHEMAS_DIR, 'input', `${scenarioId}.schema.json`);
      if (!fs.existsSync(inputSchemaPath)) {
        console.error(`[ERROR] 输入 Schema 不存在: ${inputSchemaPath}`);
        console.error(`可用场景: design-new-model, review-existing-model, generate-sql, define-metrics, generate-dq-rules, analyze-lineage`);
        process.exit(2);
      }

      const inputData = loadDataFile(options.input);
      const inputSchema = loadSchema(inputSchemaPath);
      inputResult = validateData(inputData, inputSchema);
    }

    // 校验输出
    if (options.output) {
      const outputSchemaPath = path.join(SCHEMAS_DIR, 'output', `${scenarioId}.schema.json`);
      if (!fs.existsSync(outputSchemaPath)) {
        console.error(`[ERROR] 输出 Schema 不存在: ${outputSchemaPath}`);
        process.exit(2);
      }

      const outputData = loadDataFile(options.output);
      const outputSchema = loadSchema(outputSchemaPath);
      outputResult = validateData(outputData, outputSchema);
    }

    // 输出报告
    if (options.json) {
      const report = generateJsonReport(scenarioId, inputResult, outputResult);
      console.log(JSON.stringify(report, null, 2));
    } else {
      if (inputResult) {
        console.log(generateMarkdownReport(scenarioId, 'input', inputResult));
      }
      if (outputResult) {
        console.log(generateMarkdownReport(scenarioId, 'output', outputResult));
      }
    }

    // 确定退出码
    const hasCritical =
      (inputResult?.errors?.critical?.length > 0) ||
      (outputResult?.errors?.critical?.length > 0);

    const hasWarning =
      (inputResult?.errors?.warning?.length > 0) ||
      (outputResult?.errors?.warning?.length > 0);

    if (hasCritical) {
      process.exit(1);
    }

    if (options.strict && hasWarning) {
      console.error('[WARN] --strict 模式下 WARNING 导致失败');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(2);
  }
}

main();

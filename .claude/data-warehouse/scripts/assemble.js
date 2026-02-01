#!/usr/bin/env node

/**
 * assemble.js - 提示组装脚本
 *
 * 根据场景配置组装完整提示，支持上下文加载、token 预算控制、trace 输出。
 *
 * Usage:
 *   node assemble.js <scenario> [--context-level=standard] [--platform=hive] [--json] [--trace]
 *
 * Examples:
 *   node assemble.js design-new-model
 *   node assemble.js generate-sql --json --trace
 *   node assemble.js review-existing-model --context-level=minimal --platform=hive
 *
 * @version 1.0.0
 * @author HiveMind
 */

import { program } from 'commander';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname 兼容
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础目录
const BASE_DIR = path.resolve(__dirname, '..');
const CONFIG_DIR = path.join(BASE_DIR, 'config');

// -----------------------------------------
// CLI 定义
// -----------------------------------------
program
  .name('assemble')
  .description('根据场景组装完整提示')
  .argument('<scenario>', '场景 ID（如 design-new-model, generate-sql）')
  .option('--context-level <level>', '上下文加载级别', 'standard')
  .option('--platform <platform>', '目标平台', 'hive')
  .option('--json', '输出 JSON 格式（含 trace、token breakdown）')
  .option('--trace', '在输出中包含上下文来源追踪')
  .helpOption('-h, --help', '显示帮助信息')
  .parse(process.argv);

const scenarioId = program.args[0];
const options = program.opts();

// -----------------------------------------
// 配置加载
// -----------------------------------------

/**
 * 加载 YAML 配置文件
 * @param {string} filename - 配置文件名
 * @returns {object} 解析后的配置
 */
function loadConfig(filename) {
  const filePath = path.join(CONFIG_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`配置文件不存在: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return parseYaml(content, { version: '1.2', uniqueKeys: true });
}

/**
 * 查找场景配置
 * @param {string} id - 场景 ID
 * @returns {object|null} 场景配置
 */
function findScenario(id) {
  const config = loadConfig('scenarios.yaml');
  return config.scenarios.find((s) => s.id === id) || null;
}

/**
 * 加载组装规则
 * @returns {object} 组装规则配置
 */
function loadAssemblyRules() {
  return loadConfig('assembly-rules.yaml');
}

/**
 * 加载平台配置
 * @param {string} platformId - 平台 ID
 * @returns {object|null} 平台配置
 */
function loadPlatformConfig(platformId) {
  const config = loadConfig('platforms.yaml');
  return config.platforms.find((p) => p.id === platformId) || null;
}

// -----------------------------------------
// 文件加载与解析
// -----------------------------------------

/**
 * 安全解析文件路径
 * @param {string} relativePath - 相对路径
 * @param {string} baseDir - 基础目录
 * @returns {string} 绝对路径
 */
function resolveSecurePath(relativePath, baseDir) {
  // 移除 .md 扩展名（如果配置中省略了）
  let normalizedPath = relativePath;
  if (!normalizedPath.endsWith('.md') && !normalizedPath.endsWith('.json')) {
    normalizedPath = `${normalizedPath}.md`;
  }

  const absolutePath = path.resolve(baseDir, normalizedPath);
  const realBase = fs.realpathSync(baseDir);

  // 检查路径是否存在
  if (!fs.existsSync(absolutePath)) {
    return null; // 文件不存在
  }

  const realPath = fs.realpathSync(absolutePath);

  // 安全检查：确保路径在 baseDir 内
  if (!realPath.startsWith(realBase)) {
    throw new Error(`路径越界尝试: ${relativePath}`);
  }

  return realPath;
}

/**
 * 解析带 frontmatter 的 Markdown 文件
 * @param {string} filePath - 文件路径
 * @returns {object} { metadata, content }
 */
function parseMarkdownFile(filePath) {
  const rawContent = fs.readFileSync(filePath, 'utf8');

  // 规范化换行（处理 CRLF）
  const content = rawContent.replace(/\r\n/g, '\n');

  // 检查 BOM
  const cleanContent = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;

  try {
    const { data, content: body } = matter(cleanContent, {
      engines: {
        yaml: (s) =>
          parseYaml(s, {
            uniqueKeys: true,
            version: '1.2',
          }),
      },
    });

    return {
      metadata: data,
      content: body.trim(),
    };
  } catch (e) {
    // 如果 frontmatter 解析失败，返回整个内容
    return {
      metadata: {},
      content: cleanContent.trim(),
    };
  }
}

// -----------------------------------------
// Token 估算
// -----------------------------------------

/**
 * 保守估算 token 数
 * 1 中文字符 = 1 token，1 英文单词 ≈ 0.25 token
 * @param {string} content - 内容
 * @returns {number} 估算 token 数
 */
function estimateTokens(content) {
  if (!content) return 0;

  let tokens = 0;
  for (const char of content) {
    // 中文字符按 1:1
    if (/[\u4e00-\u9fff]/.test(char)) {
      tokens += 1;
    } else {
      // 英文/数字/符号按 0.25
      tokens += 0.25;
    }
  }

  // 10% buffer
  return Math.ceil(tokens * 1.1);
}

// -----------------------------------------
// 上下文组装
// -----------------------------------------

/**
 * 加载上下文文件
 * @param {string[]} contextPaths - 上下文文件路径列表
 * @param {object} rules - 组装规则
 * @returns {object[]} 加载的上下文列表
 */
function loadContextFiles(contextPaths, rules) {
  const contexts = [];
  const missingFiles = [];

  for (const ctxPath of contextPaths) {
    const fullPath = resolveSecurePath(ctxPath, BASE_DIR);

    if (!fullPath) {
      missingFiles.push(ctxPath);
      if (rules.assembly.missing_file_strategy === 'error') {
        throw new Error(`上下文文件不存在: ${ctxPath}`);
      }
      continue;
    }

    const parsed = parseMarkdownFile(fullPath);
    const tokens = estimateTokens(parsed.content);

    // 确定优先级类别
    let priorityCategory = 'naming'; // 默认最低优先级
    if (ctxPath.includes('platform')) {
      priorityCategory = 'platform';
    } else if (ctxPath.includes('methodology')) {
      priorityCategory = 'methodology';
    } else if (ctxPath.includes('layers')) {
      priorityCategory = 'layers';
    } else if (ctxPath.includes('governance')) {
      priorityCategory = 'governance';
    }

    contexts.push({
      path: ctxPath,
      fullPath,
      content: parsed.content,
      metadata: parsed.metadata,
      tokens,
      priority: rules.priority_order[priorityCategory] || 99,
      category: priorityCategory,
    });
  }

  // 警告缺失文件
  if (missingFiles.length > 0 && rules.assembly.missing_file_strategy === 'warn') {
    console.error(`[WARN] 以下上下文文件不存在:`);
    missingFiles.forEach((f) => console.error(`  - ${f}`));
  }

  // 按优先级排序
  contexts.sort((a, b) => a.priority - b.priority);

  return contexts;
}

/**
 * 检测 onDemand 上下文
 * 根据关键词触发加载额外上下文
 * @param {string} userInput - 用户输入（可选）
 * @param {object} rules - 组装规则
 * @returns {string[]} 需要加载的 onDemand 上下文路径
 */
function detectOnDemandContexts(userInput, rules) {
  if (!userInput) return [];

  const triggered = [];
  const onDemandItems = rules.context_levels.onDemand || [];

  for (const item of onDemandItems) {
    const keywords = item.trigger_keywords || [];
    for (const keyword of keywords) {
      if (userInput.includes(keyword)) {
        triggered.push(item.path);
        break;
      }
    }
  }

  return triggered;
}

/**
 * 裁剪上下文以适应 token 预算
 * @param {object[]} contexts - 上下文列表
 * @param {number} budget - 可用 token 预算
 * @param {object} rules - 组装规则
 * @returns {object} { contexts, truncated, totalTokens }
 */
function truncateContexts(contexts, budget, rules) {
  let totalTokens = 0;
  const included = [];
  const truncated = [];
  const protectedCategories = new Set(rules.truncation.protected || []);

  for (const ctx of contexts) {
    if (totalTokens + ctx.tokens <= budget) {
      included.push(ctx);
      totalTokens += ctx.tokens;
    } else if (protectedCategories.has(ctx.category)) {
      // 保护类别强制包含
      included.push(ctx);
      totalTokens += ctx.tokens;
    } else {
      // 标记为被裁剪
      truncated.push({
        path: ctx.path,
        tokens: ctx.tokens,
        reason: 'token_budget_exceeded',
      });
    }
  }

  return { contexts: included, truncated, totalTokens };
}

// -----------------------------------------
// 组装主逻辑
// -----------------------------------------

/**
 * 组装完整提示
 * @param {string} scenarioId - 场景 ID
 * @param {object} options - 组装选项
 * @returns {object} 组装结果
 */
async function assemblePrompt(scenarioId, options) {
  // 1. 加载场景配置
  const scenario = findScenario(scenarioId);
  if (!scenario) {
    throw new Error(`场景不存在: ${scenarioId}\n可用场景: design-new-model, review-existing-model, generate-sql, define-metrics, generate-dq-rules, analyze-lineage`);
  }

  // 2. 加载组装规则
  const rules = loadAssemblyRules();

  // 3. 加载平台配置
  const platform = loadPlatformConfig(options.platform);
  if (!platform) {
    throw new Error(`平台不存在: ${options.platform}`);
  }

  // 4. 加载场景提示文件
  const promptPath = resolveSecurePath(scenario.prompt_file, BASE_DIR);
  if (!promptPath) {
    throw new Error(`场景提示文件不存在: ${scenario.prompt_file}`);
  }
  const promptFile = parseMarkdownFile(promptPath);

  // 5. 加载输出模板
  let outputTemplate = null;
  if (scenario.output_template) {
    const outputPath = resolveSecurePath(scenario.output_template, BASE_DIR);
    if (outputPath) {
      outputTemplate = parseMarkdownFile(outputPath);
    }
  }

  // 6. 构建上下文列表
  const contextPaths = [];

  // always 级别上下文
  const alwaysContexts = rules.context_levels.always || [];
  for (const item of alwaysContexts) {
    contextPaths.push(item.path);
  }

  // 场景级别上下文
  for (const ctxPath of scenario.requires_context || []) {
    if (!contextPaths.includes(ctxPath)) {
      contextPaths.push(ctxPath);
    }
  }

  // 7. 加载上下文文件
  const contexts = loadContextFiles(contextPaths, rules);

  // 8. Token 预算计算
  const promptTokens = estimateTokens(promptFile.content);
  const outputTemplateTokens = outputTemplate ? estimateTokens(outputTemplate.content) : 0;
  const contextTokens = contexts.reduce((sum, ctx) => sum + ctx.tokens, 0);

  const totalInputTokens = promptTokens + outputTemplateTokens + contextTokens;
  const budget = rules.token_budget.available_input;
  const usageRatio = totalInputTokens / budget;

  // 9. 检查是否需要裁剪
  let finalContexts = contexts;
  let truncatedInfo = [];

  if (usageRatio > 1) {
    const truncResult = truncateContexts(contexts, budget - promptTokens - outputTemplateTokens, rules);
    finalContexts = truncResult.contexts;
    truncatedInfo = truncResult.truncated;
  }

  // 10. 组装最终提示
  const sections = [];

  // 系统提示（如有）
  sections.push(`# ${scenario.name}\n\n${scenario.description}`);

  // 上下文部分
  if (finalContexts.length > 0) {
    sections.push('---\n## 参考上下文\n');
    for (const ctx of finalContexts) {
      sections.push(`### ${ctx.metadata.id || path.basename(ctx.path, '.md')}\n\n${ctx.content}\n`);
    }
  }

  // 场景提示
  sections.push('---\n## 场景提示\n');
  sections.push(promptFile.content);

  // 输出模板
  if (outputTemplate) {
    sections.push('---\n## 输出模板\n');
    sections.push(outputTemplate.content);
  }

  const assembledContent = sections.join('\n\n');
  const finalTokens = estimateTokens(assembledContent);

  // 11. 构建结果
  const result = {
    scenario: scenarioId,
    platform: options.platform,
    content: assembledContent,
    tokens: {
      prompt: promptTokens,
      output_template: outputTemplateTokens,
      contexts: contexts.reduce((sum, ctx) => sum + ctx.tokens, 0),
      total_input: totalInputTokens,
      final: finalTokens,
      budget: budget,
      reserve_output: rules.token_budget.reserve_output,
      usage_percent: Math.round(usageRatio * 100),
    },
    status: usageRatio > 1 ? 'TRUNCATED' : usageRatio > 0.8 ? 'WARNING' : 'OK',
  };

  // trace 信息
  if (options.trace) {
    result.trace = {
      contexts_loaded: finalContexts.map((ctx) => ({
        path: ctx.path,
        tokens: ctx.tokens,
        priority: ctx.priority,
        category: ctx.category,
      })),
      contexts_truncated: truncatedInfo,
      prompt_file: scenario.prompt_file,
      output_template: scenario.output_template,
    };
  }

  // 警告信息
  if (truncatedInfo.length > 0) {
    result.warnings = [`${truncatedInfo.length} 个上下文文件因 token 预算被裁剪`];
  }

  return result;
}

// -----------------------------------------
// 主入口
// -----------------------------------------

async function main() {
  try {
    const result = await assemblePrompt(scenarioId, options);

    if (options.json) {
      // JSON 格式输出到 stdout
      console.log(JSON.stringify(result, null, 2));
    } else {
      // Markdown 格式输出
      console.log(result.content);

      // 如果有警告，输出到 stderr
      if (result.warnings) {
        console.error('\n[WARN] ' + result.warnings.join('\n[WARN] '));
      }

      // 如果启用 trace，输出摘要到 stderr
      if (options.trace && result.trace) {
        console.error('\n--- Trace ---');
        console.error(`Prompt file: ${result.trace.prompt_file}`);
        console.error(`Contexts loaded: ${result.trace.contexts_loaded.length}`);
        console.error(`Total tokens: ${result.tokens.final}`);
        console.error(`Usage: ${result.tokens.usage_percent}%`);
        console.error(`Status: ${result.status}`);
      }
    }

    // 状态码
    if (result.status === 'TRUNCATED') {
      process.exit(0); // 警告但不阻断
    }
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(2);
  }
}

main();

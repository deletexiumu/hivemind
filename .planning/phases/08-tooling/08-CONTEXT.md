# Phase 8: 工具化 - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

构建提示系统的集成框架：作为 Claude Code 插件实现，支持根据场景、角色、平台动态组装提示，建立规格校验机制，完成整个系统的工具化。

**交付物：**
- TOOLS-01: 提示包可按场景 + 角色 + 平台动态组装
- TOOLS-02: 规格校验工具检查模板字段完整性
- TOOLS-03: 每个场景配套输入模板和输出模板

</domain>

<decisions>
## Implementation Decisions

### CLI 设计
- **集成形式：** 作为 Claude Code 插件，命令格式为 `/dw:*`
- **交互模式：** 默认交互式引导，支持 `--batch` 或 `--non-interactive` 模式用于 CI/脚本
- **输出格式：** 默认 Markdown（人读友好），`--json` 标志切换结构化输出
- **命令范围：** 8 个场景命令
  - 6 个核心场景：`/dw:design` `/dw:review` `/dw:generate-sql` `/dw:define-metric` `/dw:generate-dq` `/dw:analyze-lineage`
  - 2 个工具命令：`/dw:assemble` `/dw:validate`

### 组装策略
- **context-level：** 场景自适应，根据场景复杂度自动选择注入级别
- **Token 超限处理：** 告警并让用户选择保留哪些部分
- **注入优先级：** 平台约束 > 方法论 > 治理（确保生成有效代码）
- **配置格式：** YAML（与 dbt 一致，人读友好）

### 校验机制
- **校验范围：** 输入完整性 + 输出合规性双向校验
- **报告格式：** 详细报告（逐项检查结果 + 建议 + 评分）
- **失败处理：** 分级处理（关键项失败阻断，非关键项警告继续）
- **规则定义：** JSON Schema 格式（工具生态兼容性好）

### 集成方式
- **插件结构：** 独立插件，完全自包含于 `.claude/plugins/data-warehouse/`
- **场景扩展：** 提供 `/dw:new-scenario` 脚手架命令自动生成场景骨架
- **平台扩展：** 通过添加 `platform/*.md` + 配置文件即可扩展新平台
- **外部依赖：** 允许调用 dbt、hive-cli 等外部工具

### Claude's Discretion
- 插件内部目录结构
- 脚手架生成的默认模板内容
- 校验报告的具体格式细节
- 错误消息的措辞风格

</decisions>

<specifics>
## Specific Ideas

- 命令风格参考 Claude Code 现有的 `/gsd:*` 系列，保持一致性
- 场景自适应的 context-level 可以根据输入复杂度判断（字段数、维度数等）
- Token 超限时的用户选择界面应该清晰显示各部分的 token 占用

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-tooling*
*Context gathered: 2026-02-01*

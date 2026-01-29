# Phase 1: 基础设施 - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

建立项目的基础骨架：目录结构、术语表、命名规范、提示 token 限制规范。为后续 Phase 2-8 的方法论和场景提示提供统一的基础设施。

**交付物：**
- 标准化目录结构
- 中英术语对照表（80+ 条）
- 命名规范文档（20+ 实例）
- 提示规范文档（token 限制、模板结构）

</domain>

<decisions>
## Implementation Decisions

### 术语表设计
- **格式：** 四栏（中文 - 英文 - 定义 - 示例）
- **组织：** 按领域分组（Claude 根据术语分布自然划分，预计包含维度建模、分层体系、指标治理、SCD/增量等）
- **示例风格：** 混合（代码片段 + 场景句子），根据术语类型选择合适方式

### 命名规范风格
- **Schema 命名：** 分层简短前缀（`stg_`, `ods_`, `dwd_`, `dws_`, `ads_`）
- **表名命名：** 分层简短或类型完整均可（`dwd_orders` 或 `dwd_fact_orders`，`dim_customer`）
- **字段命名：** 全小写下划线分隔（`order_amount`, `customer_id`）
- **示例密度：** Claude 根据规则复杂度决定是否配正反例
- **指标命名：** Phase 6 处理，本阶段不覆盖

### 目录结构组织
- **顶层组织：** Claude 决定（按功能或按场景）
- **嵌套深度：** Claude 决定（根据内容复杂度灵活）
- **文件命名：** Claude 决定（预计全小写连字符）
- **多平台扩展：** 暂不考虑，先只支持 Hive

### 提示规范格式
- **Token 限制：** Claude 决定执行方式（Phase 8 工具会提供检查）
- **版本管理：** 在文件头部标记（version, last_updated）
- **模板结构：** Claude 决定（YAML frontmatter 或纯 Markdown）
- **输入/输出格式：** Markdown 表格/列表（人类可读性优先）

### Claude's Discretion
- 术语表的具体领域划分数量和名称
- 命名规范的示例密度和正反例选择
- 目录结构的顶层组织方式和嵌套深度
- 文件命名约定（全小写连字符 vs 下划线）
- 提示模板的具体结构（YAML frontmatter vs 纯 Markdown）
- Token 限制的执行策略

</decisions>

<specifics>
## Specific Ideas

- Schema 和表名的命名风格：用户明确要求 schema 必须是分层简短（`ods_`），表名可灵活（`fact_`、`dim_`、`bridge_` 等类型完整形式也可接受）
- 术语表需要四栏完整信息，包含定义和示例，不只是简单的中英对照
- 输入/输出模板使用 Markdown 格式，强调人类可读性
- 提示文件需要在头部标记版本号和更新日期

</specifics>

<deferred>
## Deferred Ideas

- 指标名命名规范 → Phase 6（指标口径定义场景）
- 多平台支持（Snowflake、BigQuery）→ v2 或后续里程碑
- Token 限制自动检查工具 → Phase 8（工具化）

</deferred>

---

*Phase: 01-infrastructure*
*Context gathered: 2026-01-30*

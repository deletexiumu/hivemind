# Phase 4: 场景 2 实现（设计新模型） - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

实现"设计新模型"场景的完整提示系统：用户输入业务事件/指标/粒度，系统输出星型模型设计、事实表定义、维度选择、分层落点建议、dbt 模板代码。

**覆盖需求：** DESIGN-01 ~ DESIGN-06
- 用户输入业务事件/指标/粒度 → 输出星型模型设计
- 输出事实表定义（粒度声明、度量字段、DDL + schema.yml）
- 输出维度表定义（SCD 策略、自然键/代理键、DDL + schema.yml）
- 输出分层落点建议（DWD/DWS 分配及理由）
- 输出 dbt model 模板（可直接使用的骨架代码）
- 事实表必须包含标准字段（etl_date、is_deleted 等）

</domain>

<decisions>
## Implementation Decisions

### 输入格式设计
- **混合模式**：提供 YAML/Markdown 模板，但允许自由文本描述；系统智能解析 + 追问缺失信息
- **必填最小集**：只需业务事件 + 粒度两个核心要素，其余（指标、字段清单）可通过后续追问补充
- **支持多事件**：允许一次输入多个相关业务事件（如订单 + 退款 + 物流），统一设计星型模型
- **缺失信息处理**：Claude 自行决定（主动追问 vs 智能推断 + 确认）

### 输出结构与详细度
- **星型图可视化**：同时提供 Mermaid ER 图 + ASCII 文本图，用户按需选用
- **DDL 完整性**：生成可直接在 Hive 执行的 CREATE TABLE 语句，包括分区、存储格式（ORC）、字段注释
- **schema.yml 完整集**：包含 description、tests（unique/not_null/accepted_values/relationships）、meta 标签、数据分类、敏感标记、审计字段 tests
- **SQL 模板完成度**：Claude 根据输入完整度决定（完整输入→可运行 SQL；部分输入→骨架 + TODO）

### 决策指导逻辑
- **事实表类型**：系统根据用户描述自动推荐（事务/周期快照/累积快照/无度量），并解释推荐原因
- **SCD 策略**：系统根据维度属性自动推荐 Type 1/2/3，并解释原因（不逐个询问）
- **分层落点**：列出可能的分层选项（DWD/DWS/ADS），给出推荐及各选项利弊
- **度量可加总性**：每个度量字段必须标记可加总性类型（完全可加/半可加/不可加）

### Claude's Discretion
- 输入信息不完整时的处理策略（追问 vs 推断）
- SQL 模板的完成度（取决于输入完整度）
- 案例库的复杂度梯度设计
- 案例的具体内容完整度（取决于 token 预算）

</decisions>

<specifics>
## Specific Ideas

### 案例库设计
- **领域覆盖**：多领域（电商 + 用户行为/流量 + 金融/成本收入）
- **复杂度梯度**：Claude 自行设计梯度
- **引用方式**：混合模式 — 一个简单案例内嵌在提示中作为答复样例，其余案例放在 examples/ 目录按需引用
- **案例内容**：Claude 根据场景和 token 预算决定

</specifics>

<deferred>
## Deferred Ideas

None — 讨论完全聚焦在 Phase 4 范围内。

</deferred>

---

*Phase: 04-design-new-model*
*Context gathered: 2026-01-31*

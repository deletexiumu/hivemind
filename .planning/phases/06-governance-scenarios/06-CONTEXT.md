# Phase 6: 治理场景（指标、DQ、血缘基础） - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

实现三个治理相关的场景：指标口径定义（METRICS）、DQ 规则生成（DQRULES）、基础血缘分析（LINEAGE）。为数据治理和质量保证提供标准化提示工具。

本阶段交付：
- 指标定义提示 + Semantic Layer YAML 输出
- DQ 规则生成提示 + dbt tests 配置输出
- 基础血缘分析提示 + 表级/字段级血缘输出

**不在本阶段范围：**
- SQL 生成（Phase 7）
- 变更影响评估（Phase 7）
- 工具化 CLI 集成（Phase 8）

</domain>

<decisions>
## Implementation Decisions

### 指标定义交互

#### 指标分类
- 采用「原子/派生/复合」三分法，简单易用
- 不增加业务领域、计算周期等维度，避免过度复杂

#### 输入最小集
- 用户最少提供：指标名称 + 业务描述
- Claude 负责推断计算公式和源表映射
- 用户可选提供公式草稿以提高准确度

#### Semantic Layer 输出
- 采用 dbt Semantic Layer 2.0 标准格式
- 输出可直接用于 dbt 项目
- 包含 metrics 定义和 semantic_models 关联

#### 指标关联规则
- 派生/复合指标**强制关联**已定义的原子指标 ID
- 确保指标血缘可追溯
- 构建指标依赖关系图

### DQ 规则生成策略

#### 规则推断逻辑
- 采用「字段类型驱动」策略：
  - `_id` 字段 → `unique` + `not_null`
  - `_amt/_cnt` 字段 → `not_null` + 范围检测
  - `_status/_type` 字段 → `accepted_values`
  - 外键字段 → `relationships`

#### dbt-expectations 使用
- 推荐但不强制
- 默认使用 dbt 原生 tests（unique、not_null、accepted_values、relationships）
- 复杂场景推荐 dbt-expectations（如类型检测、正则匹配）

#### 告警阈值分层
- 分层默认值策略：
  - ODS 层：warn 5%, error 10%（宽松，贴源数据容忍度高）
  - DWD/DWS 层：warn 1%, error 5%（中等）
  - ADS 层：warn 0%, error 1%（严格，应用层数据质量要求高）

#### 新鲜度检测
- T+1 标准策略：
  - `warn_after: {count: 1, period: day}`
  - `error_after: {count: 2, period: day}`
- 符合离线数仓典型场景

### 血缘分析精度

#### 精度级别定位
- 提供两种模式供用户选择：
  - **表级模式**：保证 100% 准确，快速输出
  - **字段级模式**：尽力解析，明确标记精度限制

#### 复杂 SQL 处理
- 尽力解析窗口函数、CTE、子查询
- 遇到递归 CTE、动态 SQL 时明确标记「精度可能不完整」
- 不退化或拒绝分析，提供尽可能多的信息

#### 可视化输出
- Mermaid 图表 + 表格映射双格式输出
- 与 Phase 4/5 的星型图风格保持一致
- 表级血缘用 graph LR，字段级用表格

#### dbt 依赖识别
- 优先识别 `ref()` 和 `source()` 调用
- 作为血缘的主要来源，统一编码规则
- 输出中明确区分 dbt 依赖和原生表名

### 三场景统一体验

#### 交互模式
- 三个场景**均采用两段式交互**：
  - Stage 1：规格书/摘要（指标规格、规则清单、血缘概览）
  - Stage 2：完整产物（YAML 配置、dbt tests、详细血缘报告）
- 与 Phase 4/5 保持一致

#### 案例库规模
- 每场景 2 个案例（简单 + 中等复杂度）
- 共计 6 个案例，快速交付
- 案例覆盖典型业务场景（如订单指标、用户行为 DQ、多表血缘）

#### 输出格式
- 使用 `### File: {path}` 格式分割多文件输出
- 便于后续 Phase 8 工具化自动落盘
- 与 Phase 4/5 的输出契约保持一致

#### 上下文复用
- 复用 Phase 4 创建的精简版上下文（*-core.md）
- 新增治理相关上下文：
  - `governance/metrics-core.md`：指标分类、Semantic Layer 格式
  - `governance/dq-rules-core.md`：规则类型、阈值策略
- 控制新增上下文在 1k tokens 以内

### Claude's Discretion

- 指标 ID 生成规则（如 MET_001 vs metrics_order_total）
- 具体 dbt-expectations 函数选择
- 血缘图的布局方向（LR vs TB）
- 复杂表达式的简化展示策略

</decisions>

<specifics>
## Specific Ideas

- 指标定义参考 dbt Semantic Layer 2.0 官方文档格式
- DQ 规则输出应与 Phase 5 的检查清单规则 ID 对应（如 G01 → 主键唯一性测试）
- 血缘分析的 Mermaid 风格与 Phase 4 星型图保持一致（使用相同的节点样式）
- 三场景的输出模板结构参考 Phase 4/5 已建立的模式

</specifics>

<deferred>
## Deferred Ideas

无 — 讨论过程中未产生范围外建议。

</deferred>

---

*Phase: 06-governance-scenarios*
*Context gathered: 2026-02-01*

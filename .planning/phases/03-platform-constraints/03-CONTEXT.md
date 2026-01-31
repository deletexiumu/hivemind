# Phase 3: 平台约束库 - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

文档化 Hive 3.x + dbt-hive 平台的能力边界、约束与最佳实践，为后续代码生成（SQL、dbt 模板）提供可靠的技术决策依据。

**覆盖需求：**
- PLATFORM-01: Hive 平台约束文档（分区策略、存储格式、性能优化）
- PLATFORM-02: dbt-hive 能力边界文档（不支持 Snapshots/Ephemeral、分区列限制）
- PLATFORM-03: 增量策略文档（insert_overwrite、T+1 回刷模式）

</domain>

<decisions>
## Implementation Decisions

### 文档深度与受众
- **双受众设计**：人 + Claude 并重，数据工程师会查阅，Claude 提示系统也会消费
- **技术深度**：原理 + 实操——先解释为什么有这个约束，再给出规避方法
- **示例密度**：分类程度——简单约束精简示例，复杂约束丰富示例（正/反对比）
- **语言风格**：Claude 自行判断——根据约束重要性选择命令式或解释性风格

### 约束呈现方式
- **组织维度**：按风险等级组织（P0 必须遵守 / P1 强烈建议 / P2 可选优化）
- **呈现格式**：统一模板——每个约束包含：名称、原因、规避方案、示例
- **反面教材**：正/反对比——错误写法 vs 正确写法并排，帮助识别问题
- **查找索引**：首页汇总表——文档开头有约束清单表，方便快速定位

### Hive 版本边界
- **目标版本**：只写 Hive 3.x，以实际环境为准，不考虑其他版本
- **ACID 策略**：主要非 ACID 表——大多数表是外部表或管理非 ACID 表
- **存储格式**：ORC 为主——默认使用 ORC 格式

### dbt-hive 限制处理
- **替代方案深度**：简要指引——"用 insert_overwrite + 有效期字段替代"，详见 SCD 文档
- **版本兼容**：简要表格——列出 dbt-core 与 dbt-hive 的兼容版本对照
- **已知缺陷**：全部收录——收录所有已知的 quirks，帮助用户避坑
- **MERGE 限制**：Claude 判断是否值得展开说明

### Claude's Discretion
- 语言风格的具体选择（命令式 vs 解释性）
- MERGE 语句限制的详细程度
- 某些约束是否需要额外背景说明

</decisions>

<specifics>
## Specific Ideas

- 约束按风险等级组织是关键——P0 约束如果违反会导致数据错误或执行失败
- 统一模板确保一致性：名称 → 原因 → 规避方案 → 示例
- 首页汇总表便于快速查阅，类似 Phase 2 方法论文档的索引设计
- 正/反对比示例帮助读者快速识别"我是不是写错了"

</specifics>

<deferred>
## Deferred Ideas

None — 讨论聚焦于平台约束文档的呈现方式，未涉及范围外内容

</deferred>

---

*Phase: 03-platform-constraints*
*Context gathered: 2026-01-31*

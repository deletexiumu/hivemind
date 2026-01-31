# Phase 2: 方法论库 - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

建立 Kimball 维度建模的中文方法论知识库，为后续设计和评审提示提供理论支撑。交付物是**参考文档**，不是场景提示本身或工具代码。

覆盖：
- METHOD-01: Kimball 维度建模概念文档
- METHOD-02: 事实表类型指南
- METHOD-03: SCD 策略指南（无 Snapshots 方案）
- METHOD-04: 分层体系规范

</domain>

<decisions>
## Implementation Decisions

### 文档深度与受众
- 双重受众：既作为 Claude 的 context 输入，也方便人类阅读
- 原理 + 实操结合：解释「为什么」+ 给出「怎么做」
- 工作手册风格：简洁、指令性、直接给结论
- 每篇文档 1500-2500 字（中等长度）

### 文档结构
- 每篇文档开头 TL;DR 摘要（一段话总结核心要点）
- 使用 Mermaid 图表呈现决策树/选型地图
- 包含误区/反模式部分（常见错误 + 为什么错）
- 文档末尾附 Markdown 复选框检查清单
- 文档间交叉引用（SCD 指南链接到维度表设计等）
- 文档底部带版本号和更新日期
- 术语链接到 Phase 1 的 glossary/terms.md

### 文档组织
- 需要一个方法论索引页（总览链接所有文档）
- 参考文献简要提及（《数据仓库工具箱》等关键参考）

### 案例风格与领域
- 混合多行业：电商 + 金融 + 零售，根据概念选合适的
- 每个方法论概念 2-3 个案例
- 骨架示例：关键字段 + SQL 片段，说明模式但非完整可运行代码
- 英文标识符 + 中文注释：`order_amount (-- 订单金额)`

### SCD 无 Snapshots 方案
- Type 2 实现模式：insert_overwrite + 有效期字段
- 有效期字段命名：`effective_start` / `effective_end`
- 包含 `is_current` 标志字段（1 = 当前生效版本）
- 不需要 version_num 版本号字段

### 术语与引用规范
- 中文为主 + 首次出现标英文：维度表 (Dimension) 首次标注，之后只用中文
- 改写为本项目表述，不直接引用 Kimball 原文
- 术语与 terms.md 重复时：Claude 根据概念复杂度决定是链接还是自包含

### Claude's Discretion
- 具体使用哪些 Mermaid 图表类型（flowchart、graph 等）
- 决策树的分支深度
- 案例选用哪个具体行业
- 术语重复时是链接还是自包含解释

</decisions>

<specifics>
## Specific Ideas

- SCD Type 2 标准字段组合：`effective_start` + `effective_end` + `is_current`
- 检查清单用 `- [ ]` Markdown 复选框格式，方便复制使用
- 误区部分格式：❌ 错误做法 → ✓ 正确做法 → 原因说明

</specifics>

<deferred>
## Deferred Ideas

None — 讨论保持在 Phase 2 范围内

</deferred>

---

*Phase: 02-methodology*
*Context gathered: 2026-01-31*

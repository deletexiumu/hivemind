# PROJECT STATE: HiveMind 数仓助手

**项目名称：** HiveMind 数仓助手（Hive + dbt 中文提示系统）
**最后更新：** 2026-02-01
**当前里程碑：** Phase 6 Complete

---

## 项目参考信息

**核心价值主张：**
用一套可组合的中文提示包，把 Hive + dbt 数仓的六类高频任务标准化为可复用、可追溯、带质量门禁的输出。

**六大核心场景：**
1. 评审已有模型 (REVIEW) — 问题识别 + 修复建议
2. 设计新模型 (DESIGN) — 星型设计 + dbt 模板
3. 生成导数 SQL (SQLGEN) — 口径规范 SQL + 性能优化
4. 指标口径定义 (METRICS) — 指标规范化 + Semantic Layer
5. 生成 DQ 规则 (DQRULES) — dbt tests 自动生成
6. 数据血缘分析 (LINEAGE) — 表/字段级追踪 + 影响评估

**技术栈（已验证）：**
- 平台：Hive 4.x + dbt-hive 1.10.0
- 建模方法论：Kimball 维度建模
- 架构模式：可组装提示包 + 模块化上下文
- 分层体系：ODS/DWD/DWS/ADS (中国数仓标准)

**关键约束：**
- 代码标识符英文，输出中文
- 离线 T+1 场景，无实时支持
- dbt-hive 不支持 Snapshots，需用 SCD Type 2 手动实现
- 单个提示 <2000 tokens，确保 Claude 上下文容纳

---

## 当前位置

**Phase:** 7 of 8 (SQL 生成 + 血缘) - In Progress
**Plan:** 3 of 4 complete
**Status:** Phase 7 In Progress
**Last activity:** 2026-02-01 - Completed 07-04-PLAN.md (血缘增强案例)

**Progress:** █████████░ 95% (21/22 plans)

**已完成：**
- [✓] 48 个 v1 需求分析
- [✓] 研究总结消费（技术栈、功能复杂度、架构设计、风险识别）
- [✓] 8 个阶段划分（遵循研究建议）
- [✓] 每阶段的目标、需求映射、交付物、成功标准定义
- [✓] ROADMAP.md 完成
- [✓] 依赖关系与风险矩阵确认
- [✓] 预计交付周期（20-24 周）
- [✓] **01-01: 目录结构 + 术语表（89 条）**
- [✓] **01-02: 命名规范 + 提示规范 + Token 预算**
- [✓] **02-01: 方法论索引页 + Kimball 维度建模文档（METHOD-01）**
- [✓] **02-02: 事实表类型指南（METHOD-02）+ SCD 策略指南（METHOD-03）**
- [✓] **02-03: 分层体系规范（METHOD-04）**
- [✓] **03-01: 平台约束索引页 + Hive 约束文档（PLATFORM-01）**
- [✓] **03-02: dbt-hive 限制文档（PLATFORM-02）+ 增量策略文档（PLATFORM-03）**
- [✓] **04-01: 7 个精简版上下文文件（*-core.md）**
- [✓] **04-02: 场景提示 prompt.md + 输出模板（两段式交互）**
- [✓] **04-03: 3 个案例（电商订单/用户行为/财务收入）**
- [✓] **05-01: 问题分级（P0-P3）+ 检查清单（33 条规则）**
- [✓] **05-02: 主提示文件 prompt.md + 输出模板 + 修复建议模板**
- [✓] **05-03: 3 个评审案例（good-model/naming-issues/multiple-issues）**
- [✓] **06-01: 治理上下文基础（metrics-core.md + dq-rules-core.md）**
- [✓] **06-02: 指标定义场景（prompt.md + output-template.md + 2 案例）**
- [✓] **06-03: DQ 规则生成场景（prompt.md + output-template.md + 2 案例）**
- [✓] **06-04: 血缘分析场景（prompt.md + output-template.md + 2 案例）**
- [✓] **07-01: SQL 生成核心提示系统（prompt.md + output-template.md + time-expressions.md）**
- [✓] **07-02: 血缘分析增强（JOIN 关联识别 + 边级置信度 + 变更影响评估模板）**
- [✓] **07-04: 血缘增强案例（join-relationship.md + impact-assessment.md）**

**待执行：**
- [ ] 07-03: SQL 生成案例库
- [ ] Phase 8 工具化（3 个计划）

---

## 核心决策记录

| 决策 | 选择 | 理由 | 状态 |
|------|------|------|------|
| 分层体系 | ODS/DWD/DWS/ADS | 中国数仓标准 + dbt 社区实践一致 | ✓ 确认 |
| 建模方法论 | Kimball 维度建模 | 国内主流、与分层体系匹配 | ✓ 确认 |
| 工具链 | dbt + Hive | 官方支持、能力边界清晰 | ✓ 确认 |
| 提示架构 | 模块化 <2000 token | 避免 Mega-Prompt，便于维护扩展 | ✓ 确认 |
| 阶段划分 | 8 个阶段（基础→方法论→平台→4 个场景→工具化） | 遵循研究建议，依赖关系清晰 | ✓ 确认 |
| SCD 实现（无 Snapshots） | Type 2 手动实现（insert_overwrite + 有效期） | dbt-hive 不支持 Snapshots，需替代方案 | ✓ 已验证 |
| term_id 格式 | `<domain>_<slug>` snake_case | 稳定引用、无编码问题、领域分组 | ✓ 01-01 确认 |
| 术语权威原则 | Kimball 优先（方法论）、DataWorks 优先（平台） | 避免同名异义术语混淆 | ✓ 01-01 确认 |
| .gitignore 策略 | `.claude/*` + `!.claude/data-warehouse/` | 项目资产需版本控制 | ✓ 01-01 确认 |
| 表名格式 | `{layer}_{type?}_{domain}_{entity}_{suffix?}` | 分层清晰、语义完整 | ✓ 01-02 确认 |
| 字段命名 | snake_case + 类型后缀（_id/_amt/_cnt/_date） | 类型一目了然 | ✓ 01-02 确认 |
| Token 估算 | 保守 1:1（1 token ≈ 1 中文字符） | 避免运行时超限 | ✓ 01-02 确认 |
| 文件命名 | kebab-case（文档）vs snake_case（模型） | 解耦文件与数仓对象 | ✓ 01-02 确认 |
| 星型模型优先 | Hive 场景星型 > 雪花 | 分布式 JOIN 成本高，减少连接 | ✓ 02-01 确认 |
| 文档双受众 | [Analyst]/[Engineer] 同页双轨 | 避免概念与实现漂移 | ✓ 02-01 确认 |
| 维度表落层 | DWD 层，dim_ 前缀 | 与事实表并列，支持一致性维度 | ✓ 02-03 确认 |
| 维度表跨层引用 | 允许多层引用 | 一致性维度设计需求 | ✓ 02-03 确认 |
| 回刷窗口约束 | ODS 7天/DWD-DWS 30天/ADS 90天 | 平衡数据完整性与运维成本 | ✓ 02-03 确认 |
| SCD2 区间语义 | 右开区间 [start, end) | 避免边界日期重复命中 | ✓ 02-02 确认 |
| SCD2 当前记录 | effective_end = 9999-12-31 | NULL 比较复杂，固定值更易处理 | ✓ 02-02 确认 |
| 迟到维处理 | Unknown 成员占位 (sk=-1) | 保证事实表外键完整性 | ✓ 02-02 确认 |
| 大小维表策略 | 小表全量重建，大表拆分 | 性能与维护成本平衡 | ✓ 02-02 确认 |
| dbt-hive 限制模板 | ID + 原因 + 后果 + 规避方案 + 示例 | 统一格式便于查阅 | ✓ 03-02 确认 |
| lookback 分层配置 | ODS 7天/DWD-DWS 30天/ADS 90天 | 平衡迟到数据覆盖与性能 | ✓ 03-02 确认 |
| 分区内去重 | row_number + ORDER BY updated_at DESC | 取最新版本，简单可靠 | ✓ 03-02 确认 |
| 精简版上下文 tokens | 单文件 600-1000，7 文件合计 <6000 | 控制运行时注入预算 | ✓ 04-01 确认 |
| 精简版格式 | frontmatter + 表格/决策树/检查清单 + Source 标注 | 统一格式便于自动化 | ✓ 04-01 确认 |
| 两段式交互 | Stage 1 规格书 + Stage 2 完整产物 | 减少返工，先确认再生成代码 | ✓ 04-02 确认 |
| 必填最小集 | 业务事件 + 粒度，指标需求为推荐 | 少追问多推断，提高效率 | ✓ 04-02 确认 |
| 输出交付契约 | `### File: {path}` 格式 | 便于后续工具化自动落盘 | ✓ 04-02 确认 |
| 案例结构统一 | 输入 -> Stage 1 -> Stage 2 -> 要点 | 一致性便于参考学习 | ✓ 04-03 确认 |
| 周期快照落层 | DWS（不是 DWD） | 汇总层非原子粒度 | ✓ 04-03 确认 |
| P0 门禁机制 | P0>0 则不通过，与 quality_score 解耦 | 严重问题阻断上线 | ✓ 05-01 确认 |
| 质量分计算 | P1(-10)/P2(-3)/P3(-1)，初始 100 分 | 可量化可比较 | ✓ 05-01 确认 |
| 三态结论 | 不通过/通过/有条件通过 | 清晰决策边界 | ✓ 05-01 确认 |
| 检查项 ID 格式 | {维度前缀}{序号}，如 N01/L01/G01 | 便于引用和追踪 | ✓ 05-01 确认 |
| 评审两段式交互 | Stage 1 问题概览 + Stage 2 详细修复 | 减少返工，聚焦关键问题 | ✓ 05-02 确认 |
| 智能范围评审 | 根据输入内容确定可评审维度 | 信息不足时仍可部分评审 | ✓ 05-02 确认 |
| 修复建议分档 | S/M/L/XL 四档详细度规则 | 确保输出一致性和可操作性 | ✓ 05-02 确认 |
| 案例质量等级覆盖 | 高/中/低三级（通过/有条件通过/不通过） | 覆盖完整评审结论范围 | ✓ 05-03 确认 |
| 案例规则 ID 引用 | 每个问题关联 review-checklist.md 规则 ID | 确保案例与检查清单一致性 | ✓ 05-03 确认 |
| 指标三分法与 MetricFlow 映射 | 原子→simple，派生→derived/ratio，复合→derived 嵌套 | 与 dbt Semantic Layer 2.0 官方格式对齐 | ✓ 06-01 确认 |
| 字段类型驱动 DQ 规则 | _id→unique，_amt→范围检测，_status→accepted_values | 遵循 naming.md 命名规范 | ✓ 06-01 确认 |
| 分层阈值量化 | ODS 5%/10%，DWD-DWS 1%/5%，ADS 0%/1% | 遵循 06-CONTEXT.md 用户决策 | ✓ 06-01 确认 |
| Stage 1 必问项（指标） | grain、时间字段、可切维度 | Codex 共识，确保 semantic_model 完整性 | ✓ 06-02 确认 |
| 派生指标依赖声明 | type_params.metrics + meta.depends_on | 前者 MetricFlow 必需，后者支持血缘分析工具 | ✓ 06-02 确认 |
| 过滤条件位置（指标） | metric 层 filter 而非 measure | 保持 measure 通用性，业务过滤在指标层 | ✓ 06-02 确认 |
| 8 类必问项（DQ 规则） | 目标/字段/分区/窗口/SCD2/阈值/新鲜度/Hive 方言 | 覆盖 DQ 规则生成所有关键信息 | ✓ 06-03 确认 |
| SCD2 有效行过滤 | where: "is_current = 1" | 历史行不参与自然键唯一性检测 | ✓ 06-03 确认 |
| Hive 分区过滤语法 | date_sub(current_date, N) | 统一控制扫描范围 | ✓ 06-03 确认 |
| 两段式血缘交互 | Stage 1 表级概览 + Stage 2 字段级详细 | 表级快速概览，字段级按需展开 | ✓ 06-04 确认 |
| 血缘精度等级 | A/B/C/D 四级（高/中/低/需人工） | 平衡自动化与准确性，D 级需人工确认 | ✓ 06-04 确认 |
| dbt 血缘优先解析 | ref()/source() > 原生表名 | dbt 项目中 ref/source 更可靠 | ✓ 06-04 确认 |
| 静态解析优先 | AST 解析 > LLM 推断 | 静态解析确定性高 | ✓ 06-04 确认 |
| 8 类必问项（SQL 生成） | 取数目标/数据源/分区/时间/过滤/SCD2/聚合/成本 | 覆盖 SQL 生成所有关键信息 | ✓ 07-01 确认 |
| Validator P0/P1/P2 分级（SQL） | P0 阻断（分区/笛卡尔积）、P1 警告（JOIN/SCD2）、P2 提示（性能） | 与评审场景一致的分级机制 | ✓ 07-01 确认 |
| 动态时间表达优先 | DATE_SUB/TRUNC/ADD_MONTHS > 硬编码日期 | 确保 SQL 可重复执行 | ✓ 07-01 确认 |
| 分区谓词模板 | 裸字段比较常量，禁止对分区列做函数 | 保证分区裁剪生效 | ✓ 07-01 确认 |
| 边级置信度 | A/B/C/D 下沉到每条边 + 证据/位置 | 避免全局置信度掩盖局部不确定性 | ✓ 07-02 确认 |
| 路径置信度传播 | min(路径上所有边) | 保守策略，任一不确定边降低整体可信度 | ✓ 07-02 确认 |
| 三段式交互（血缘） | Stage 1/2/3（表级/字段级/影响评估） | 表级快速概览，字段级按需展开，影响评估独立模式 | ✓ 07-02 确认 |
| 影响类型分类 | Breaking/语义变更/仅新增 | 与影响等级（高/中/低）正交，更精确的变更分类 | ✓ 07-02 确认 |

---

## 阶段状态总览

| Phase | 目标 | 需求数 | 状态 | 完成% |
|-------|------|--------|------|--------|
| **1** | 基础设施 | 4 | **Complete** | 100% |
| **2** | 方法论库 | 4 | **Complete** | 100% |
| **3** | 平台约束 | 3 | **Complete** | 100% |
| **4** | 设计场景 | 6 | **Complete** | 100% |
| **5** | 评审场景 | 8 | **Complete** | 100% |
| **6** | 治理场景 | 13 | **Complete** | 100% |
| **7** | SQL 生成 + 血缘 | 12 | **In Progress** | 67% |
| **8** | 工具化 | 3 | Pending | 0% |
| **整体** | **全系统 v1** | **48** | In Progress | **91%** |

---

## 关键文件与版本

| 文件 | 版本 | 最后更新 | 状态 |
|------|------|---------|------|
| .planning/ROADMAP.md | 1.0 | 2026-01-30 | 完成 |
| .planning/REQUIREMENTS.md | 1.0 | 2026-01-30 | 已更新（需求映射确认） |
| .planning/PROJECT.md | 1.0 | 2026-01-30 | 确认 |
| .planning/research/SUMMARY.md | 1.0 | 2026-01-30 | 已消费 |
| .planning/STATE.md | 1.3 | 2026-02-01 | 当前文档 |
| .planning/phases/01-infrastructure/01-01-SUMMARY.md | 1.0 | 2026-01-31 | 完成 |
| .planning/phases/01-infrastructure/01-02-SUMMARY.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/glossary/terms.md | 1.0 | 2026-01-31 | 完成 |
| .claude/data-warehouse/docs/naming.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/docs/prompting.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/docs/token-budget.md | 1.0 | 2026-01-31 | **新增** |
| .planning/phases/02-methodology/02-01-SUMMARY.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/methodology/index.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/methodology/dimensional-modeling.md | 1.0 | 2026-01-31 | **新增** |
| .planning/phases/02-methodology/02-02-SUMMARY.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/methodology/fact-table-types.md | 1.0 | 2026-01-31 | **新增** |
| .planning/phases/02-methodology/02-03-SUMMARY.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/layers/layering-system.md | 1.0 | 2026-01-31 | 完成 |
| .claude/data-warehouse/context/methodology/scd-strategies.md | 1.0 | 2026-01-31 | **新增** |
| .planning/phases/03-platform-constraints/03-02-SUMMARY.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/platform/index.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/platform/dbt-hive-limitations.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/platform/incremental-strategies.md | 1.0 | 2026-01-31 | **新增** |
| .planning/phases/03-platform-constraints/03-01-SUMMARY.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/platform/hive-constraints.md | 1.0 | 2026-01-31 | **新增** |
| .planning/phases/03-platform-constraints/03-VERIFICATION.md | 1.0 | 2026-01-31 | **新增** |
| .planning/phases/04-design-new-model/04-01-SUMMARY.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/methodology/dimensional-modeling-core.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/methodology/fact-table-types-core.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/methodology/scd-strategies-core.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/layers/layering-system-core.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/platform/hive-constraints-core.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/context/platform/dbt-hive-limitations-core.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/docs/naming-core.md | 1.0 | 2026-01-31 | **新增** |
| .planning/phases/04-design-new-model/04-02-SUMMARY.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/prompts/scenarios/design-new-model/prompt.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/prompts/scenarios/design-new-model/output-template.md | 1.0 | 2026-01-31 | **新增** |
| .planning/phases/04-design-new-model/04-03-SUMMARY.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/prompts/scenarios/design-new-model/examples/e-commerce-order.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/prompts/scenarios/design-new-model/examples/user-behavior-pv.md | 1.0 | 2026-01-31 | **新增** |
| .claude/data-warehouse/prompts/scenarios/design-new-model/examples/finance-revenue.md | 1.0 | 2026-01-31 | **新增** |
| .planning/phases/05-review-existing-model/05-01-SUMMARY.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/review-existing-model/issue-classification.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/review-existing-model/review-checklist.md | 1.0 | 2026-02-01 | **新增** |
| .planning/phases/05-review-existing-model/05-02-SUMMARY.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/review-existing-model/prompt.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/review-existing-model/output-template.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/review-existing-model/fix-suggestions.md | 1.0 | 2026-02-01 | **新增** |
| .planning/phases/05-review-existing-model/05-03-SUMMARY.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/review-existing-model/examples/good-model.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/review-existing-model/examples/naming-issues.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/review-existing-model/examples/multiple-issues.md | 1.0 | 2026-02-01 | **新增** |
| .planning/phases/06-governance-scenarios/06-01-SUMMARY.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/context/governance/metrics-core.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/context/governance/dq-rules-core.md | 1.0 | 2026-02-01 | **新增** |
| .planning/phases/06-governance-scenarios/06-02-SUMMARY.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/define-metrics/prompt.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/define-metrics/output-template.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/define-metrics/examples/atomic-metric.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/define-metrics/examples/derived-metric.md | 1.0 | 2026-02-01 | **新增** |
| .planning/phases/06-governance-scenarios/06-03-SUMMARY.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/generate-dq-rules/prompt.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/generate-dq-rules/output-template.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/generate-dq-rules/examples/fact-table-dq.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/generate-dq-rules/examples/dim-table-dq.md | 1.0 | 2026-02-01 | **新增** |
| .planning/phases/06-governance-scenarios/06-04-SUMMARY.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/analyze-lineage/prompt.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/analyze-lineage/output-template.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/analyze-lineage/examples/table-level.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/analyze-lineage/examples/column-level.md | 1.0 | 2026-02-01 | **新增** |
| .planning/phases/07-sql-generation-lineage/07-01-SUMMARY.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/generate-sql/prompt.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/generate-sql/output-template.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/generate-sql/time-expressions.md | 1.0 | 2026-02-01 | **新增** |
| .planning/phases/07-sql-generation-lineage/07-02-SUMMARY.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/analyze-lineage/prompt.md | 1.1.0 | 2026-02-01 | **更新** |
| .claude/data-warehouse/prompts/scenarios/analyze-lineage/output-template.md | 1.1.0 | 2026-02-01 | **更新** |
| .claude/data-warehouse/prompts/scenarios/analyze-lineage/impact-analysis-template.md | 1.0 | 2026-02-01 | **新增** |
| .planning/phases/07-sql-generation-lineage/07-04-SUMMARY.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/analyze-lineage/examples/join-relationship.md | 1.0 | 2026-02-01 | **新增** |
| .claude/data-warehouse/prompts/scenarios/analyze-lineage/examples/impact-assessment.md | 1.0 | 2026-02-01 | **新增** |

---

## 待决策项

| 项目 | 描述 | 预期决策时间 | 依赖阶段 |
|------|------|-----------|----------|
| Hive Metastore 中文支持 | 字段注释是否完整保留中文？ | Phase 2 实施时验证 | Phase 2-3 |
| 术语接受度 | 用户对"贴源层"vs"ODS"等术语的实际偏好？ | Phase 1 完成后调查 | Phase 1 |
| 字段级血缘精度 | 复杂 SQL 中的血缘追踪精度限制如何标记？ | Phase 6 实施时确认 | Phase 6-7 |
| Semantic Layer 适配 | dbt Semantic Layer 与国内指标平台的对接方案？ | Phase 6 指标实现时研究 | Phase 6 |

---

## 累积背景信息

### 技术发现

**dbt-hive 明确限制（影响设计）：**
- 不支持 `snapshots`（无原生 SCD Type 2）
  - 影响：维度表 SCD Type 2 需手动实现
  - 方案：使用 `insert_overwrite` + 有效期字段（dw_valid_from/dw_valid_to）
  - Phase 2 在 SCD 指南中详细说明

- 不支持 `ephemeral` 物化
  - 影响：无原生临时 CTE 支持
  - 方案：用 CTE 替代或创建临时表
  - Phase 3 在平台约束中说明

- ACID 表分区列不支持 MERGE 更新
  - 影响：增量更新策略受限
  - 方案：依赖 `insert_overwrite` 分区回刷
  - Phase 3 在增量策略中说明

**Hive 性能特点（影响 SQL 生成）：**
- 大表 JOIN 小表时需做顺序优化（小表先发送）
- 分区裁剪强制（必须在 WHERE 中包含分区条件）
- 窗口函数和聚合性能差异大（聚合优于窗口函数）
- Phase 3 平台约束、Phase 7 SQL 生成需融入这些原则

**中文本地化要点：**
- 所有文档与提示输出中文
- 代码标识符保持英文（避免编码问题）
- 术语表建立统一映射（如"维度表" vs "Dimension"）
- Phase 1 术语表是基础

### 架构设计确认

**模块化提示架构核心（避免 Mega-Prompt 反模式）：**
- 每个提示 <2000 tokens
- 上下文（规范、方法论、平台约束）与提示逻辑分离
- 运行时组装：场景提示 + 必要上下文 = 完整组装提示（<4000 tokens）
- Phase 8 工具化提供组装工具

**目录结构（已在 Phase 1 定义）：**
```
.claude/data-warehouse/
├── prompts/
│   ├── system/                    # 角色定义
│   └── scenarios/                 # 6 个场景各一目录
│       ├── design-new-model/
│       ├── review-existing-model/
│       ├── generate-sql/
│       ├── define-metrics/
│       ├── generate-dq-rules/
│       └── analyze-lineage/
│
└── context/                       # 可组装上下文库
    ├── methodology/               # Kimball、事实表、维度、SCD
    ├── layers/                    # ODS/DWD/DWS/ADS 分层规范
    ├── governance/                # 命名、指标、DQ、血缘标准
    ├── platform/                  # Hive、dbt-hive 约束
    └── glossary/                  # 术语对照表
```

### 风险识别与预防

**P0 风险（必须立即预防）：**
1. Mega-Prompt 复杂化
   - 预防：Phase 1 定义 <2000 token 规范，全程遵循

2. dbt-hive 分区错误
   - 预防：Phase 3 明确分区限制，Phase 4-7 提示中强制分区裁剪检查

3. 无 Snapshots 导致 SCD Type 2 实现缺陷
   - 预防：Phase 2 提供完整的替代实现方案，Phase 4 验证

**P1 风险（需在 Phase 1-2 缓解）：**
1. 中文术语翻译不一致 → Phase 1 术语表 + 一致性检查
2. Claude 4.x 行为差异 → Phase 1 规范化提示格式，Phase 3 验证

**P2-P3 风险（Phase 内逐步缓解）：**
- SCD 处理不当、Hive 查询性能、提示测试缺失、dbt 项目结构混乱
- 逐阶段通过详细文档、案例、检查清单预防

---

## 会话连续性要点

**Last session:** 2026-02-01T05:15:21Z
**Stopped at:** Completed 07-04-PLAN.md (血缘增强案例) - Phase 7 In Progress
**Resume file:** None

**如果重启对话，这些是最关键的上下文：**

1. 用户已明确指定 8 个阶段（Phase 1-8）的顺序和内容，遵循研究总结建议
2. 48 个 v1 需求已完整映射到 8 个阶段（无遗漏）
3. ROADMAP.md 已完成，定义了每个阶段的：
   - 目标、覆盖需求、关键交付物
   - 成功标准、风险预防、依赖关系
4. **Phase 1 已完成**：
   - 01-01: 目录结构 + 89 条术语表
   - 01-02: 命名规范 + 提示规范 + Token 预算
5. **Phase 2 已完成**：
   - 02-01: 方法论索引页 + Kimball 维度建模文档（METHOD-01）✓
   - 02-02: 事实表类型指南（METHOD-02）+ SCD 策略指南（METHOD-03）✓
   - 02-03: 分层体系规范（METHOD-04）✓
6. **Phase 3 已完成**：
   - 03-01: 平台约束索引页 + Hive 平台约束文档（PLATFORM-01）✓
   - 03-02: dbt-hive 限制文档 + 增量策略文档（PLATFORM-02/03）✓
7. **Phase 4 已完成**：
   - 04-01: 7 个精简版上下文文件（*-core.md）✓
   - 04-02: 场景提示 prompt.md + 输出模板（两段式交互）✓
   - 04-03: 3 个案例（电商订单/用户行为/财务收入）✓
8. **Phase 5 已完成**：
   - 05-01: 问题分级（P0-P3）+ 检查清单（33 条规则）✓
   - 05-02: 主提示文件 prompt.md + 输出模板 + 修复建议模板 ✓
   - 05-03: 3 个评审案例（good-model/naming-issues/multiple-issues）✓
9. **Phase 6 已完成**：
   - 06-01: 治理上下文基础（metrics-core.md + dq-rules-core.md）✓
   - 06-02: 指标定义场景（prompt.md + output-template.md + 2 案例）✓
   - 06-03: DQ 规则场景（prompt.md + output-template.md + 2 案例）✓
   - 06-04: 血缘分析场景（prompt.md + output-template.md + 2 案例）✓
10. **Phase 7 进行中**：
    - 07-01: SQL 生成核心提示系统（prompt.md + output-template.md + time-expressions.md）✓
    - 07-02: 血缘分析增强（JOIN 关联识别 + 边级置信度 + 变更影响评估模板）✓
    - 07-03: SQL 生成案例库（待执行）
    - 07-04: 血缘增强案例（join-relationship.md + impact-assessment.md）✓
11. 关键决策已确认：Kimball + ODS/DWD/DWS/ADS + 模块化提示 + dbt-hive 约束 + 命名规范 + Token 限制 + 星型模型优先 + 双受众文档 + 维度表落层 DWD + 回刷窗口约束 + SCD2 右开区间 + lookback 分层配置 + P0 门禁机制 + 质量分计算 + 指标三分法 + 字段类型驱动 DQ 规则 + 分层阈值量化 + Stage 1 必问项（grain/时间/维度） + 派生指标依赖声明 + 过滤条件位置 + 8 类必问项（DQ 规则） + SCD2 有效行过滤 + Hive 分区过滤语法 + 两段式血缘交互 + 血缘精度等级 A-D + dbt 血缘优先解析 + 静态解析优先 + 8 类必问项（SQL 生成 A-H） + Validator P0/P1/P2 分级 + 动态时间表达优先 + 分区谓词模板 + 边级置信度 + 路径置信度传播 + 三段式交互（血缘）+ 影响类型分类

---

## 待办事项（宏观）

- [x] **Phase 1 规划与执行** — 建立基础设施（目录、术语表、命名规范、提示规范）
- [x] **Phase 2 方法论库编写** — Kimball 文档、事实表、维度、SCD、分层
- [x] **Phase 3 平台约束库编写** — Hive、dbt-hive、增量策略文档
- [x] **Phase 4 设计新模型实现** — 提示、模板、案例、评审
- [x] **Phase 5 评审已有模型实现** — 提示、检查清单、修复建议、案例
- [x] **Phase 6 治理场景实现** — 指标、DQ、基础血缘、评审
- [ ] **Phase 7 SQL 生成 + 血缘增强** — SQL 生成、血缘追踪、影响评估、评审
- [ ] **Phase 8 工具化** — CLI 工具、规格校验、集成框架、完整文档
- [ ] **v1 系统评审与发布** — 验收所有 48 个需求，发布初版

---

## 备注

**创建背景：**
此 STATE.md 在 Roadmap 创建后生成，记录项目初始状态和背景信息，为后续阶段规划和执行提供参考。

**更新频率：**
- 每完成一个 Phase 后更新阶段状态和百分比
- 发现新决策或风险时及时补充
- 每个 Phase 结束时添加会话总结和遗留事项

---

*项目状态文档 — v1*
*创建日期：2026-01-30*
*状态维护者：gsd-roadmapper (Claude)*

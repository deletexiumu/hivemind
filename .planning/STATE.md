# PROJECT STATE: HiveMind 数仓助手

**项目名称：** HiveMind 数仓助手（Hive + dbt 中文提示系统）
**最后更新：** 2026-01-31
**当前里程碑：** Phase 4 In Progress

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

**Phase:** 4 of 8 (设计场景) - In Progress
**Plan:** 2 of 3 complete
**Status:** Phase 4 In Progress
**Last activity:** 2026-01-31 - Completed 04-02-PLAN.md (场景提示 + 输出模板)

**Progress:** ██████░░░░ 63% (10/16 plans)

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

**待执行：**
- [ ] 04-03: 输入模板 + 案例 + 质量门禁
- [ ] Phase 5-8 递进执行

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

---

## 阶段状态总览

| Phase | 目标 | 需求数 | 状态 | 完成% |
|-------|------|--------|------|--------|
| **1** | 基础设施 | 4 | **Complete** | 100% |
| **2** | 方法论库 | 4 | **Complete** | 100% |
| **3** | 平台约束 | 3 | **Complete** | 100% |
| **4** | 设计场景 | 6 | **In Progress** | 67% |
| **5** | 评审场景 | 8 | Pending | 0% |
| **6** | 治理场景 | 13 | Pending | 0% |
| **7** | SQL 生成 + 血缘 | 12 | Pending | 0% |
| **8** | 工具化 | 3 | Pending | 0% |
| **整体** | **全系统 v1** | **48** | In Progress | **63%** |

---

## 关键文件与版本

| 文件 | 版本 | 最后更新 | 状态 |
|------|------|---------|------|
| .planning/ROADMAP.md | 1.0 | 2026-01-30 | 完成 |
| .planning/REQUIREMENTS.md | 1.0 | 2026-01-30 | 已更新（需求映射确认） |
| .planning/PROJECT.md | 1.0 | 2026-01-30 | 确认 |
| .planning/research/SUMMARY.md | 1.0 | 2026-01-30 | 已消费 |
| .planning/STATE.md | 1.2 | 2026-01-31 | 当前文档 |
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

**Last session:** 2026-01-31T11:05:59Z
**Stopped at:** Completed 04-02-PLAN.md (场景提示 + 输出模板)
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
7. **Phase 4 进行中**：
   - 04-01: 7 个精简版上下文文件（*-core.md）✓
   - 04-02: 场景提示 prompt.md + 输出模板（两段式交互）✓
   - 04-03: 输入模板 + 案例 + 质量门禁（待执行）
8. **下一步动作**：继续 Phase 4（04-03 输入模板 + 案例）
8. 关键决策已确认：Kimball + ODS/DWD/DWS/ADS + 模块化提示 + dbt-hive 约束 + 命名规范 + Token 限制 + 星型模型优先 + 双受众文档 + 维度表落层 DWD + 回刷窗口约束 + SCD2 右开区间 + lookback 分层配置

---

## 待办事项（宏观）

- [x] **Phase 1 规划与执行** — 建立基础设施（目录、术语表、命名规范、提示规范）
- [x] **Phase 2 方法论库编写** — Kimball 文档、事实表、维度、SCD、分层
- [x] **Phase 3 平台约束库编写** — Hive、dbt-hive、增量策略文档
- [ ] **Phase 4 设计新模型实现** — 提示、模板、案例、评审
- [ ] **Phase 5 评审已有模型实现** — 提示、检查清单、修复建议、评审
- [ ] **Phase 6 治理场景实现** — 指标、DQ、基础血缘、评审
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

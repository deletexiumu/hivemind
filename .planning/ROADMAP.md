# ROADMAP: Hive + dbt 数仓提示系统

**项目名称：** HiveMind 数仓助手（Hive + dbt 中文提示系统）
**版本：** v1
**创建日期：** 2026-01-30
**深度配置：** Standard (8 阶段)
**覆盖范围：** 48/48 v1 需求 100% 映射 ✓

---

## 项目概览

本路线图将数仓提示系统的 48 个 v1 需求分解为 8 个递进式交付阶段，遵循"基础设施 → 方法论 → 平台约束 → 场景实现 → 工具化"的自然演进顺序。每个阶段实现一组完整、可验证的能力，为后续阶段提供基础。

**核心价值：** 通过可组合的中文提示包，将 Hive + dbt 数仓的六类高频任务标准化为可复用、可追溯、带质量门禁的输出。

**交付方式：** 递进式交付，每个阶段完成后，用户获得可独立使用的功能模块。

---

## 阶段总览

| 阶段 | 目标 | 覆盖需求 | 关键交付物 | 估算规模 |
|------|------|---------|-----------|---------|
| **1** | 基础设施 | 4 (INFRA) | 目录结构、术语表、命名规范 | 小 |
| **2** | 方法论库 | 4 (METHOD) | Kimball 文档、事实表、维度、SCD | 中 |
| **3** | 平台约束 | 3 (PLATFORM) | Hive 规范、dbt-hive 限制、增量策略 | 中 |
| **4** | 场景2实现 | 6 (DESIGN) | 新模型设计提示、模板、成功标准 | 大 |
| **5** | 场景1实现 | 8 (REVIEW) | 模型评审提示、检查清单、修复建议 | 大 |
| **6** | 治理场景 | 13 (METRICS+DQRULES) | 指标定义、DQ规则生成、基础血缘 | 大 |
| **7** | 场景3实现 | 12 (SQLGEN+LINEAGE) | SQL 生成、血缘分析、字段追踪 | 大 |
| **8** | 工具化 | 3 (TOOLS) | 提示包组装、规格校验、集成框架 | 中 |

**总计：** 8 个阶段，48 个需求，约 20-24 周交付周期（Standard 深度）

---

## 详细阶段规划

### Phase 1: 基础设施

**目标：** 建立项目的基础骨架、统一术语系统、确立命名规范，为后续方法论和提示系统奠定基础。

**覆盖需求：**
- INFRA-01: 建立 `.claude/data-warehouse/` 目录结构
- INFRA-02: 编写中英术语对照表
- INFRA-03: 编写命名规范文档
- INFRA-04: 建立提示 token 限制规范

**关键交付物：**
1. 标准化目录结构
   - `.claude/data-warehouse/prompts/system/`
   - `.claude/data-warehouse/prompts/scenarios/`
   - `.claude/data-warehouse/context/{methodology,layers,governance,platform,glossary}/`

2. 中英术语对照表 (`glossary/zh-en-mapping.md`)
   - 维度建模核心术语（维度表、事实表、星型、雪花）
   - 分层体系术语（ODS、DWD、DWS、ADS）
   - 指标治理术语（度量、维度、粒度）
   - SCD 术语映射

3. 命名规范文档 (`governance/naming-conventions.md`)
   - 表名规范（前缀：`stg_`, `int_`, `dim_`, `dwd_`, `dws_`, `ads_`）
   - 字段名规范（下划线分隔、英文大小写约定）
   - 指标名规范（业务领域 + 指标类型）
   - 文件/目录命名约定

4. 提示规范文档 (`governance/prompt-standards.md`)
   - 单文件 token 限制：< 2000 tokens
   - 输入/输出模板结构
   - 提示版本管理规则

**成功标准：**
1. 目录结构完全建立，符合模块化设计原则
2. 术语表覆盖 Kimball、分层、指标、SCD 四大核心领域，共 80+ 条术语对照
3. 命名规范文档清晰易懂，包含 20+ 实例（正例/反例）
4. 提示 token 规范定稿，团队理解并能独立执行

**风险预防（对应 PITFALLS）：**
- P0: Mega-Prompt 复杂化 → 在规范中强制 <2000 token 限制
- P1: 中文表面翻译 → 建立术语表一致性检查
- P1: Claude 4.x 行为差异 → 在规范中标记出对新版本的适配点

**依赖关系：** 无上游依赖（基础阶段）
**后续赋能：** Phase 2-8 所有阶段依赖此基础设施

---

### Phase 2: 方法论库

**目标：** 建立 Kimball 维度建模的方法论知识库，为模型设计和评审提供理论基础。

**覆盖需求：**
- METHOD-01: Kimball 维度建模概念文档（事实表、维度表、星型/雪花）
- METHOD-02: 事实表类型指南（事务事实、周期快照、累积快照）
- METHOD-03: SCD 策略指南（Type 1/2/3 选型与实现，无 Snapshots 方案）
- METHOD-04: 分层体系规范（ODS/DWD/DWS/ADS 定义与跨层规则）

**关键交付物：**
1. Kimball 维度建模概念文档 (`methodology/kimball-dimensional-modeling.md`)
   - 维度表定义与设计原则
   - 事实表定义与设计原则
   - 星型模型 vs 雪花模型对比
   - 粒度声明与一致性维度的核心地位
   - 8 个经典案例（零售、电商、金融）

2. 事实表类型指南 (`methodology/fact-table-types.md`)
   - 事务事实表（Transaction Facts）设计与示例
   - 周期快照事实表（Periodic Snapshot Facts）设计与示例
   - 累积快照事实表（Cumulative Snapshot Facts）设计与示例
   - 无量度事实表（Factless Facts）设计与示例
   - 各类型的适用场景与选择矩阵

3. 维度表设计指南 (`methodology/dimension-table-design.md`)
   - 维度属性设计（缓慢变化、快速变化）
   - 自然键、代理键、代理键序列号
   - 维度属性粒度设计
   - 维度表标准字段（有效期、版本号等）

4. SCD 策略指南 (`methodology/scd-strategies.md`)
   - SCD Type 1（覆盖）原理与 dbt 实现（insert_overwrite）
   - SCD Type 2（历史追踪）原理与 dbt 实现方案（因 dbt-hive 无 Snapshots 支持）
   - SCD Type 3（前/当前值并存）原理与实现场景
   - SCD 选型矩阵与决策流程
   - 无 Snapshots 的 SCD Type 2 替代方案详解

5. 分层体系规范 (`layers/ods-dwd-dws-ads-spec.md`)
   - ODS（操作数据层）定义、数据源、命名、示例
   - DWD（数据仓库细节层）定义、转换规则、命名、示例
   - DWS（数据仓库汇总层）定义、聚合规则、命名、示例
   - ADS（应用数据层）定义、应用场景、命名、示例
   - 层间依赖规则与禁止跨层引用清单

**成功标准：**
1. Kimball 文档覆盖 4 个核心概念，包含 15+ 实际案例
2. 事实表指南清晰定义 4 种类型，每种配 2+ 实例
3. SCD 策略文档提供 Type 1/2/3 的完整 dbt 实现代码（特别是 Type 2 的 dbt-hive 替代方案）
4. 分层规范明确定义 4 层的功能与边界，提供跨层规则检查清单
5. 所有文档共包含 25+ 可直接复用的代码示例

**风险预防：**
- P0: dbt-hive 分区错误 → 在 SCD Type 2 实现中明确标记"无 Snapshots 支持"
- 无基础规范难以验证设计质量 → Phase 2 完成后，Phase 4 可设计评分标准

**依赖关系：** 依赖 Phase 1（术语表）
**后续赋能：** Phase 4 (设计) 和 Phase 5 (评审) 的理论基础

---

### Phase 3: 平台约束库

**目标：** 文档化 Hive + dbt-hive 平台的能力边界、约束与最佳实践，为后续代码生成提供可靠的技术决策依据。

**覆盖需求：**
- PLATFORM-01: Hive 平台约束文档（分区策略、存储格式、性能优化）
- PLATFORM-02: dbt-hive 能力边界文档（不支持 Snapshots/Ephemeral、分区列限制）
- PLATFORM-03: 增量策略文档（insert_overwrite、T+1 回刷模式）

**关键交付物：**
1. Hive 平台约束文档 (`platform/hive/hive-constraints.md`)
   - 分区策略（动态分区、静态分区、分区列选择原则）
   - 存储格式选择（ORC for ACID、Parquet for 非事务）
   - 数据类型支持与限制
   - 性能优化原则（分区裁剪、列裁剪、JOIN 顺序）
   - 中文字符编码处理（Hive Metastore 字段注释）
   - 查询性能基准（小表阈值、大表处理建议）

2. dbt-hive 能力边界文档 (`platform/dbt-hive/dbt-hive-capabilities.md`)
   - 支持的物化策略（table、view、incremental）
   - **不支持功能清单：**
     - Snapshots（改用 SCD Type 2 手动实现）
     - Ephemeral（改用 CTE 或临时表）
     - 分区列的 MERGE 操作
   - 增量模式限制（merge vs insert_overwrite）
   - dbt 版本与 Hive 版本兼容性矩阵
   - 已知缺陷与规避方案

3. 增量策略文档 (`platform/hive/incremental-strategy.md`)
   - T+1 离线数仓增量模式原理
   - insert_overwrite 分区回刷机制
   - DQ 新鲜度检测（最近一分区的数据时间戳）
   - 增量字段选择（分区字段 vs 业务日期）
   - 全量重跑与增量跑的决策矩阵
   - 故障重试与数据一致性保证

4. Hive SQL 最佳实践 (`platform/hive/hive-sql-best-practices.md`)
   - 分区过滤强制规则（生成的 SQL 必须包含分区条件）
   - JOIN 优化顺序（小表 LEFT JOIN 大表）
   - 窗口函数与聚合性能权衡
   - 子查询与 CTE 优化
   - 避免的反模式（笛卡尔积、无分区过滤的全表扫描）

**成功标准：**
1. Hive 约束文档清晰列出 8+ 项约束与对应的设计建议
2. dbt-hive 能力边界文档明确标记"不支持"的 3 个关键功能，每项提供替代方案
3. 增量策略文档包含完整的 T+1 回刷流程图与代码示例
4. SQL 最佳实践文档包含 10+ 正/反例
5. 所有约束可直接转化为 Phase 5 评审提示的检查项

**风险预防：**
- P0: dbt-hive 分区错误 → 明确列出分区限制和规避方案
- Phase 4-7 代码生成时能避免不支持的操作

**依赖关系：** 依赖 Phase 1（基础设施）、Phase 2（方法论）
**后续赋能：** Phase 4 (设计)、Phase 5 (评审)、Phase 7 (SQL 生成) 的约束检查

---

### Phase 4: 场景 2 实现（设计新模型）

**目标：** 实现"设计新模型"场景的完整提示系统，包括星型模型设计、事实表定义、维度选择、dbt 模板生成，验证提示架构可行性。

**覆盖需求：**
- DESIGN-01: 用户输入业务事件/指标/粒度，系统输出星型模型设计
- DESIGN-02: 输出事实表定义（粒度声明、度量字段、DDL + schema.yml）
- DESIGN-03: 输出维度表定义（SCD 策略、自然键/代理键、DDL + schema.yml）
- DESIGN-04: 输出分层落点建议（DWD/DWS 分配及理由）
- DESIGN-05: 输出 dbt model 模板（可直接使用的骨架代码）
- DESIGN-06: 事实表必须包含标准字段（etl_date、is_deleted 等）

**关键交付物：**
1. 新模型设计提示 (`prompts/scenarios/design-new-model/prompt.md`)
   - 系统角色：数据建模师（协助用户进行 Kimball 维度建模）
   - 输入结构化说明（业务事件、指标需求、粒度、字段清单）
   - 输出步骤（星型设计 → 事实表定义 → 维度识别 → SCD 选型 → 分层映射）
   - 决策逻辑（何时使用周期快照 vs 事务事实、何时选择 SCD Type 2）
   - 包含 2-3 个完整案例（电商订单、流量、成本维度）

2. 输出模板 (`prompts/scenarios/design-new-model/output-template.md`)
   - 星型设计可视化（Mermaid 图表）
   - 事实表规格
     - 粒度声明（何时、何物、何值）
     - 度量字段清单（可加总性、半可加、不可加）
     - 维度引用清单
     - 标准字段（etl_date, is_deleted, dw_create_time, dw_modify_time）
     - DDL 模板（分区、存储格式）
     - schema.yml（dbt 配置）
   - 维度表规格（逐个维度）
     - 自然键定义
     - SCD 策略决策
     - 属性清单与缓慢/快速变化分类
     - 代理键处理
     - DDL 模板
     - schema.yml
   - 分层落点表（表名、分层、理由）
   - dbt 源模型与 ref 依赖关系

3. dbt 骨架代码生成 (`prompts/scenarios/design-new-model/dbt-template-generator.md`)
   - 事实表模板生成器
     - 基于粒度和度量字段生成 SQL 框架
     - 包含 INSERT_OVERWRITE（Hive 默认增量）
     - 包含标准字段填充
     - 包含分区字段声明（dbt 配置）
   - 维度表模板生成器
     - 基于 SCD 策略生成对应 SQL
     - SCD Type 1 template（CTAS）
     - SCD Type 2 template（insert_overwrite + 有效期）
     - SCD Type 3 template（当前/前值并存）
   - schema.yml 生成
     - 自动生成 description、tests（unique、not_null）
     - 标记主键和外键

4. 设计检查清单 (`prompts/scenarios/design-new-model/design-checklist.md`)
   - 粒度是否清晰且一致性维度完整
   - 度量字段的可加总性是否标记
   - SCD 策略选择是否有依据
   - 标准字段是否完整
   - 分层落点是否符合 ODS/DWD/DWS/ADS 规范
   - dbt 配置是否完整（description、tests、meta）

5. 成功标准文档 (`prompts/scenarios/design-new-model/success-criteria.md`)
   - 用户可读性：设计文档清晰，无歧义
   - 实施可行性：DDL 和 SQL 框架可直接用于 dbt 项目
   - 合规性：满足分层、命名、标准字段规范
   - 完整性：包含事实表、所有维度、dbt 配置

**成功标准：**
1. 提示系统能接受结构化输入（业务事件、粒度、字段），生成完整的星型设计
2. 输出包含 5 个核心部分：星型图、事实表定义、维度定义、分层映射、dbt 代码
3. 生成的 dbt 模板经过轻微调整可直接在 dbt 项目中运行
4. 在 3 个测试案例（电商订单、用户行为、成本分析）上通过人工评审
5. 提示 token 数 < 2000（符合 Phase 1 规范）

**风险预防：**
- 验证无 Snapshots 支持下的 SCD Type 2 实现方案可行性
- 测试模型设计在分层、命名、标准字段上的合规性

**依赖关系：** 依赖 Phase 1 (基础)、Phase 2 (方法论)、Phase 3 (平台约束)
**后续赋能：** Phase 5 (评审) 可复用分层、命名、标准字段的检查逻辑

---

### Phase 5: 场景 1 实现（评审已有模型）

**目标：** 实现"评审已有模型"场景的完整提示系统，包括代码审查、规范检查、问题分级、修复建议。

**覆盖需求：**
- REVIEW-01: 用户输入模型 SQL/dbt 配置/DDL，系统输出问题清单
- REVIEW-02: 问题清单包含严重级别（P0/P1/P2/P3）和位置定位
- REVIEW-03: 每个问题附带修复建议（代码片段 + 说明）
- REVIEW-04: 系统检查命名规范合规性
- REVIEW-05: 系统检查分层引用合规性（禁止跨层违规引用）
- REVIEW-06: 系统检查主键/粒度定义完整性
- REVIEW-07: 系统检查字段类型合理性和注释完整性
- REVIEW-08: 系统检查 dbt 配置完整性（description、tests）

**关键交付物：**
1. 模型评审提示 (`prompts/scenarios/review-existing-model/prompt.md`)
   - 系统角色：资深数据建模师评审官
   - 输入说明（SQL 代码、dbt 配置、DDL、schema 需求）
   - 评审维度（命名、分层、粒度、字段、dbt 配置、性能）
   - 输出结构（问题列表 + 修复建议）
   - 包含 2-3 个案例（好模型、常见问题模型）

2. 问题分级与定位 (`prompts/scenarios/review-existing-model/issue-classification.md`)
   - P0 严重（功能性错误，模型无法使用）
     - 粒度不清晰或不一致
     - 主键重复或缺失
     - 禁止的跨层引用
     - dbt 配置缺失（no description、no tests）
   - P1 高优先级（设计缺陷，影响数据质量）
     - 命名规范不符
     - 字段注释不完整
     - 某个维度的 SCD 策略不合理
     - 字段类型不合理（应该是 Date 而用了 String）
   - P2 中优先级（风险提示，后续维护负担）
     - 度量字段的可加总性未标记
     - 某些字段可能需要脱敏
     - 分区键选择可优化
   - P3 低优先级（代码风格、注释完善）
     - 命名过长或过短
     - 注释表述可更清晰

3. 检查清单模块 (`prompts/scenarios/review-existing-model/review-checklist.md`)
   - 命名规范检查（20+ 检查项）
     - 表名是否以正确前缀开头（stg_/dim_/dwd_/dws_/ads_）
     - 字段名是否下划线分隔、全小写
     - 是否避免保留字
   - 分层引用检查（10+ 检查项）
     - ODS 是否引用非源表数据
     - DWD 是否只引用 ODS 或同层表
     - DWS 是否仅引用 DWD
     - ADS 是否仅引用 DWS/维度表
   - 粒度与主键检查（8+ 检查项）
     - 粒度声明是否清晰
     - 主键是否与粒度一致
     - 是否有隐藏的粒度变化（如 JOIN 导致的扇形）
   - 字段类型与注释检查（15+ 检查项）
     - 时间字段是否用 Date/Timestamp
     - 金额字段是否用 Decimal
     - 所有字段是否有注释
     - 是否标记了业务含义
   - dbt 配置检查（8+ 检查项）
     - description 是否完整
     - 关键字段是否有 tests（unique、not_null、accepted_values）
     - 是否定义了外键关系
     - meta 标签是否标记了字段属性

4. 修复建议模板 (`prompts/scenarios/review-existing-model/fix-suggestions.md`)
   - 每个问题附带代码片段
   - 修复前后对比（markdown 代码块）
   - 修复说明（为什么要改）
   - 示例：
     ```
     [P1] 命名规范：表名前缀不符
     当前：fact_orders
     修复：dwd_fact_orders（假设 DWD 层）
     原因：按命名规范，细节层表应以 dwd_ 前缀开头
     ```

5. 输出模板 (`prompts/scenarios/review-existing-model/output-template.md`)
   - 评审总体得分（0-100，基于 P0/P1/P2/P3 权重）
   - 问题汇总表（优先级、类别、数量）
   - 问题详单（逐个问题 + 修复建议）
   - 重点推荐（需立即修复的前 3-5 项）
   - 后续建议（如何完善 schema 文档、测试框架）

**成功标准：**
1. 提示能准确识别 5 大类问题（命名、分层、粒度、字段、dbt 配置）
2. 问题分级准确，80% 的 P0 判断得到用户认可
3. 修复建议清晰可执行，用户能直接应用代码片段
4. 在 5 个测试用例（从"非常好"到"有多个问题"）上的评审结果可信度 > 85%
5. 提示 token < 2000

**风险预防：**
- 防止过度评审（提出过多细微问题），需聚焦于"影响数据质量和维护性"的问题
- 确保检查逻辑与 Phase 3 平台约束一致

**依赖关系：** 依赖 Phase 1-3（基础、方法论、平台约束），部分复用 Phase 4 的设计逻辑
**后续赋能：** Phase 6 (治理) 和 Phase 7 (SQL 生成) 的质量保证基础

---

### Phase 6: 治理场景（指标、DQ、血缘基础）

**目标：** 实现三个治理相关的场景：指标口径定义、DQ 规则生成、基础血缘分析，为数据治理和质量保证提供标准化工具。

**覆盖需求：**

**指标口径定义（METRICS-01 ~ METRICS-06）：**
- METRICS-01: 输入指标名称/业务描述，输出标准化指标定义
- METRICS-02: 输出包含指标唯一标识和分类（原子/派生/复合）
- METRICS-03: 输出包含计算公式标准化表达
- METRICS-04: 输出包含数据来源追溯（源表/字段）
- METRICS-05: 输出包含 dbt Semantic Layer 兼容格式（YAML）
- METRICS-06: 输出包含业务可读的口径说明文档

**DQ 规则生成（DQRULES-01 ~ DQRULES-07）：**
- DQRULES-01: 输入表/模型定义，输出 dbt tests 配置
- DQRULES-02: 自动生成主键唯一性检测（unique）
- DQRULES-03: 自动生成必填字段非空检测（not_null）
- DQRULES-04: 自动生成枚举值检测（accepted_values）
- DQRULES-05: 自动生成外键参照检测（relationships）
- DQRULES-06: 自动生成数据新鲜度检测
- DQRULES-07: 支持配置告警阈值（warn_if/error_if）

**基础血缘分析（LINEAGE-01 ~ LINEAGE-03）：**
- LINEAGE-01: 输入 SQL/dbt 模型，输出表级血缘关系
- LINEAGE-02: 输出字段级血缘映射表（源字段 -> 目标字段）
- LINEAGE-03: 识别 dbt ref() 依赖关系

**关键交付物：**

**1. 指标定义提示与模板 (`prompts/scenarios/define-metrics/`)**

- `prompt.md`: 指标定义助手
  - 系统角色：指标管理员
  - 输入说明（指标名、业务描述、计算逻辑草稿）
  - 输出步骤（指标分类 → 公式标准化 → 源表追踪 → Semantic Layer 生成）
  - 指标分类决策树（原子 vs 派生 vs 复合）

- `output-template.md`: 指标规范输出
  ```yaml
  指标ID: MET_001
  指标名称: 订单总额
  业务描述: 日期维度下的所有订单金额之和
  分类: 原子指标
  计算公式: SUM(order_amount)
  源表: dwd_fact_orders
  源字段:
    - order_amount (订单金额)
    - order_date (订单日期)
  维度: order_date
  新鲜度: T+1 08:00
  所有者: 数据团队
  版本: 1.0
  更新日期: 2026-01-30

  # dbt Semantic Layer YAML
  metrics:
    - name: order_total_amount
      description: "日期维度下的所有订单金额之和"
      type: sum
      sql: ${order_amount}
      time_grains: [day, week, month, quarter, year]
      dimensions: [order_date]
  ```

- `metrics-calculator.md`: 派生/复合指标计算生成器
  - 输入：原子指标组合、计算逻辑
  - 输出：标准公式、SQL 实现

**2. DQ 规则生成提示与模板 (`prompts/scenarios/generate-dq-rules/`)**

- `prompt.md`: DQ 规则生成助手
  - 系统角色：数据质量工程师
  - 输入说明（模型定义、字段清单、关键属性）
  - 自动检测规则（基于字段属性生成对应测试）
  - dbt-expectations 扩展支持

- `dbt-test-generator.md`: dbt tests 生成器
  ```yaml
  # 输入：事实表定义（粒度、主键、字段）
  # 输出：完整的 tests 配置

  models:
    - name: dwd_fact_orders
      columns:
        - name: order_id
          tests:
            - unique
            - not_null
        - name: order_amount
          tests:
            - not_null
            - dbt_expectations.expect_column_values_to_be_of_type:
                column_type: numeric
        - name: status
          tests:
            - accepted_values:
                values: ['pending', 'completed', 'cancelled']

        # 外键检测
        - name: customer_id
          tests:
            - relationships:
                to: ref('dim_customer')
                field: customer_id

  # 新鲜度检测
  freshness:
    warn_after: {count: 1, period: day}
    error_after: {count: 2, period: day}
  ```

- `output-template.md`: DQ 规则输出
  - 规则清单（逐项规则 + 代码）
  - 告警阈值配置
  - 监控仪表板建议

**3. 基础血缘分析提示 (`prompts/scenarios/analyze-lineage/`)**

- `prompt.md`: 血缘分析助手（表级 + 字段级）
  - 系统角色：数据架构师
  - 输入说明（SQL 代码或 dbt 模型列表）
  - 分析输出（表级血缘 + 字段级映射 + 依赖关系）

- `lineage-analyzer.md`: 血缘提取逻辑
  - 表级血缘识别（FROM/JOIN/INSERT/WITH）
  - dbt ref()/source() 识别
  - 字段映射（SELECT 字段 → 源字段追踪）

- `output-template.md`: 血缘输出格式
  ```markdown
  # 血缘分析报告

  ## 表级血缘

  dwd_fact_orders 依赖于：
  - ods_orders (source)
  - dim_customer (dbt ref)

  ## 字段级血缘

  | 目标字段 | 源表 | 源字段 | 转换逻辑 |
  |--------|------|--------|---------|
  | order_id | ods_orders | order_id | 直接映射 |
  | order_amount | ods_orders | amount | CAST to DECIMAL |
  | customer_name | dim_customer | name | JOIN 获取 |

  ## Mermaid 图表
  ```mermaid
  graph LR
    ODS_Orders["ods_orders"] --> DWD_Orders["dwd_fact_orders"]
    Dim_Customer["dim_customer"] --> DWD_Orders
  ```
  ```

**成功标准：**
1. 指标定义系统能生成完整的指标规范，包含计算公式、源表追踪、Semantic Layer YAML
2. DQ 规则生成能覆盖 5 大类检测（unique、not_null、accepted_values、relationships、freshness）
3. 血缘分析能准确识别表级和字段级依赖，包括 dbt ref() 关系
4. 所有三个场景的输出都包含可直接使用的代码/配置（YAML、dbt tests）
5. 在 3 个综合案例上通过评审（涉及 3+ 表的血缘、5+ 字段的映射）

**风险预防：**
- 防止血缘分析在复杂 SQL（窗口函数、递归 CTE）上失准，明确标记"表级血缘"为主
- 确保 DQ 规则与 Hive + dbt-hive 的能力匹配

**依赖关系：** 依赖 Phase 1-5（基础、方法论、平台、设计、评审）
**后续赋能：** Phase 7 (SQL 生成) 的血缘信息输入，Phase 8 (工具化) 的集成

---

### Phase 7: 场景 3 实现（SQL 生成 + 血缘增强）

**目标：** 实现"生成导数 SQL"场景的完整系统，包括 SQL 生成、口径说明、性能提示、增强血缘分析（支持变更影响评估）。

**覆盖需求：**

**SQL 生成（SQLGEN-01 ~ SQLGEN-06）：**
- SQLGEN-01: 输入取数口径/过滤/时间窗，输出 Hive SQL
- SQLGEN-02: 生成的 SQL 强制包含分区过滤条件
- SQLGEN-03: 生成的 SQL 附带中文注释说明逻辑
- SQLGEN-04: 输出包含口径说明文档（解释计算逻辑）
- SQLGEN-05: 输出包含性能提示（优化建议、预估影响）
- SQLGEN-06: 输出包含依赖说明（涉及的表和关键字段）

**血缘增强（LINEAGE-04 ~ LINEAGE-06）：**
- LINEAGE-04: 识别 JOIN 关联关系
- LINEAGE-05: 输出包含 Mermaid 格式血缘图
- LINEAGE-06: 支持变更影响评估（某字段变更影响的下游）

**关键交付物：**

**1. SQL 生成提示与模板 (`prompts/scenarios/generate-sql/`)**

- `prompt.md`: SQL 生成助手
  - 系统角色：高级 SQL 工程师
  - 输入说明（取数需求、业务过滤、时间窗、聚合维度）
  - 输出步骤（SQL 框架 → 分区裁剪 → 字段映射 → 聚合逻辑）
  - Hive SQL 最佳实践嵌入（JOIN 顺序、分区裁剪强制）

- `sql-generator.md`: SQL 生成逻辑
  ```
  输入结构：
  {
    "需求": "获取最近 30 天的订单总额（按城市聚合）",
    "数据源表": "dwd_fact_orders（事实表）、dim_city（维度表）",
    "过滤条件": "order_status = 'completed'",
    "时间窗": "最近 30 天",
    "聚合维度": "city_name"
  }

  输出：
  - SQL 代码（含分区裁剪、JOIN 优化、聚合逻辑）
  - 口径说明（计算步骤、假设、限制）
  - 性能提示（预估扫描数据量、优化建议）
  - 依赖说明（表、关键字段、外键关系）
  ```

- `output-template.md`: SQL 生成输出格式
  ```sql
  -- 生成的 Hive SQL
  SELECT
    c.city_name,
    SUM(o.order_amount) AS total_amount,
    COUNT(DISTINCT o.order_id) AS order_count
  FROM dwd_fact_orders o
  INNER JOIN dim_city c ON o.city_id = c.city_id
  WHERE
    o.order_date >= DATE_ADD(CURRENT_DATE, -30)  -- 分区裁剪强制
    AND o.order_status = 'completed'
  GROUP BY c.city_name
  ORDER BY total_amount DESC;

  -- 口径说明
  /**
  指标定义：最近 30 天的完成订单总额（按城市聚合）
  计算步骤：
  1. 从 dwd_fact_orders 取最近 30 天的订单数据
  2. 通过 city_id JOIN dim_city 获取城市名
  3. 过滤 status = 'completed' 的订单
  4. 按城市分组求和

  时间窗：[CURRENT_DATE-30, CURRENT_DATE]（T+1 08:00 后可用）
  源表：dwd_fact_orders、dim_city
  新鲜度：T+1

  注意：不包括已取消订单；订单金额已去重
  */

  -- 性能提示
  {
    "预估扫描行数": "100M 行（最近 30 天分区）",
    "JOIN 顺序": "小表 dim_city left join 大表 dwd_fact_orders（已优化）",
    "优化建议": [
      "如果需要更长时间窗，考虑按周预聚合",
      "如果需要实时性，需要采用增量更新而非全量重算"
    ]
  }
  ```

**2. 血缘增强 — 变更影响评估 (`prompts/scenarios/analyze-lineage/impact-analysis.md`)**

- 输入：某个字段的变更通知（如"dim_city 的 city_name 字段格式变更"）
- 输出：受影响的下游表/SQL（追踪所有依赖该字段的表）
- 格式：
  ```markdown
  # 变更影响评估

  变更：dim_city.city_name 从 VARCHAR(50) 更改为 VARCHAR(100)

  受影响的直接下游（一级）：
  - dwd_fact_orders（JOIN 该维度）
  - dws_order_by_city（聚合该维度）

  受影响的间接下游（二级）：
  - ads_city_report（引用 dws_order_by_city）

  风险评估：
  - 数据类型扩展，向后兼容
  - 无 SQL 语法错误风险
  - 可能影响报告展示宽度

  建议：字段定义更新，重新运行下游表
  ```

**3. 输出模板整合 (`prompts/scenarios/generate-sql/comprehensive-output.md`)**
   - SQL 代码（5 部分）
   - 口径说明
   - 性能分析
   - 依赖血缘
   - 影响评估（如适用）

**成功标准：**
1. SQL 生成系统能根据自然语言需求生成符合规范的 Hive SQL
2. 生成的所有 SQL 都强制包含分区过滤条件（CURRENT_DATE 或日期列）
3. 输出包含 5 个核心部分：SQL 代码、口径说明、性能提示、依赖说明、影响评估
4. 性能提示准确率 > 80%（结合 Phase 3 的性能优化指南）
5. 血缘追踪支持 3 层及以上的依赖链
6. 在 5 个综合案例（涉及 3+ 表、2+ 维度、复杂聚合）上验证

**风险预防：**
- 防止生成无分区过滤的 SQL（全表扫描），需强制检查
- 确保复杂 SQL（子查询、CTE、窗口函数）的血缘精度 (明确标记"精度限制")
- 性能建议需与 Hive 实际能力匹配

**依赖关系：** 依赖 Phase 1-6（全部前置能力）
**后续赋能：** Phase 8 (工具化) 的集成与编排

---

### Phase 8: 工具化

**目标：** 构建提示系统的集成框架，支持根据场景、角色、平台动态组装提示，建立规格校验机制，完成整个系统的工具化。

**覆盖需求：**
- TOOLS-01: 提示包可按场景 + 角色 + 平台动态组装
- TOOLS-02: 规格校验工具检查模板字段完整性
- TOOLS-03: 每个场景配套输入模板和输出模板

**关键交付物：**

**1. 提示包组装框架 (`TOOLS-01`)**

- `tools/prompt-assembler.js` (Node.js CLI)
  ```bash
  # 使用示例
  node prompt-assembler.js \
    --scenario design-new-model \
    --role modeler \
    --platform hive \
    --context-level full \
    --output-format markdown

  # 输出：
  # 1. 系统提示（角色定义、约束）
  # 2. 方法论 context（Phase 2 的相关文档）
  # 3. 平台约束 context（Phase 3 的相关文档）
  # 4. 场景主提示（Phase 4-7 的提示）
  # 5. 输出模板
  ```

- 组装逻辑
  - 根据场景选择主提示（`prompts/scenarios/{scenario}/prompt.md`）
  - 根据角色选择系统角色定义（`prompts/system/{role}.md`）
  - 根据平台注入约束 context（`context/platform/{platform}/...`)
  - 根据 context-level 调整方法论库深度（minimal/standard/full）
  - 组合输出为单个 Markdown 文档（token 数 < 4000，确保 Claude 上下文容纳）

- 组装配置文件 (`tools/assembler-config.yaml`)
  ```yaml
  scenarios:
    design-new-model:
      role: [modeler, architect]
      requires_context: [methodology, platform]
      max_tokens: 3500

    review-existing-model:
      role: [reviewer, architect]
      requires_context: [methodology, governance, platform]
      max_tokens: 3500

    # ... 其他 6 个场景

  platforms:
    hive:
      context_files:
        - context/platform/hive/hive-constraints.md
        - context/platform/hive/incremental-strategy.md
        - context/platform/dbt-hive/dbt-hive-capabilities.md
  ```

**2. 规格校验工具 (`TOOLS-02`)**

- `tools/schema-validator.js`
  - 验证输入模板是否包含所有必填字段
  - 验证输出是否符合预期结构
  - 生成合规性报告

- 验证规则 (schema definition)
  ```yaml
  # 输入模板校验
  design-new-model-input:
    required_fields:
      - business_events: "业务事件清单"
      - metrics: "指标需求"
      - grain: "粒度定义"
      - fields: "字段清单"
    field_rules:
      business_events:
        type: array
        min_items: 1
        items:
          type: object
          required: [name, description]
      grain:
        type: string
        min_length: 10

  # 输出模板校验
  design-new-model-output:
    required_sections:
      - fact_table_definition
      - dimension_definitions (count >= 1)
      - layer_mapping
      - dbt_template
    validation_rules:
      fact_table_definition:
        must_contain: [grain, measures, dimensions, standard_fields]
      dbt_template:
        ddl_format: valid_hive_sql
        schema_yml_format: valid_yaml
  ```

- 校验报告格式
  ```markdown
  # 规格校验报告

  场景：design-new-model
  输入文件：input.md
  输出文件：output.md

  ## 输入校验
  - [✓] business_events 已填写 (3 个事件)
  - [✓] grain 已填写
  - [✗] metrics 缺失 ← 必须补充

  ## 输出校验
  - [✓] fact_table_definition 完整
  - [✓] dimension_definitions 包含 4 个维度
  - [✓] dbt_template 可解析为有效 SQL
  - [△] schema.yml 中 description 部分字段缺失 ← 建议完善

  ## 合规性评分
  - 输入完整度：100%
  - 输出完整度：95%
  - 总体状态：PASS (可用)
  ```

**3. 场景模板库整合 (`TOOLS-03`)**

为每个场景（6 个）提供标准输入/输出模板：

- 输入模板 (`prompts/scenarios/{scenario}/input-template.md`)
  - 结构化字段定义（用户填空形式）
  - 示例输入（展示如何填写）
  - 常见错误提示

- 输出模板 (`prompts/scenarios/{scenario}/output-template.md`)
  - 标准输出结构（本阶段已在各场景中定义）
  - 质量标准（什么是"好输出"）
  - 验收清单

- 案例库 (`prompts/scenarios/{scenario}/examples/`)
  - 3-5 个完整的输入→输出案例
  - 覆盖"简单"、"中等"、"复杂"难度
  - 用于用户学习和质量参考

**例：设计新模型场景的完整模板**

```
.claude/data-warehouse/prompts/scenarios/design-new-model/
├── prompt.md                          # 核心提示
├── input-template.md                  # 用户填空输入模板
├── output-template.md                 # 标准输出结构
├── success-criteria.md                # 成功标准
├── dbt-template-generator.md          # dbt 代码生成逻辑
└── examples/
    ├── 01-simple-ecommerce-order/
    │   ├── input.md
    │   └── output.md
    ├── 02-medium-user-behavior/
    │   ├── input.md
    │   └── output.md
    └── 03-complex-cost-analysis/
        ├── input.md
        └── output.md
```

**4. 集成框架 (`tools/dw-dw-cli.js`)**

提供统一的 CLI 入口（HiveMind 框架扩展）：

```bash
# 全新设计
npm run gsd -- /gsd:design-model \
  --input ./my-new-model.md \
  --role modeler \
  --platform hive

# 评审模型
npm run gsd -- /gsd:review-model \
  --input ./my-existing-model.sql \
  --dbt-config ./models/my_model.yml

# 生成 SQL
npm run gsd -- /gsd:generate-sql \
  --requirement "最近 30 天订单额按城市聚合" \
  --source-tables dwd_fact_orders,dim_city

# 定义指标
npm run gsd -- /gsd:define-metric \
  --name "订单总额" \
  --description "..."

# 生成 DQ 规则
npm run gsd -- /gsd:generate-dq \
  --model dwd_fact_orders

# 分析血缘
npm run gsd -- /gsd:analyze-lineage \
  --model dwd_fact_orders

# 组装提示（高级用法）
npm run gsd -- /gsd:assemble-prompt \
  --scenario design-new-model \
  --role architect \
  --context-level full
```

**5. 配置与扩展文档 (`tools/README.md`)**
   - 工具使用指南
   - 自定义场景/角色的扩展说明
   - 集成 HiveMind orchestrator 的说明
   - 多平台支持扩展（未来加入 Snowflake、BigQuery）

**成功标准：**
1. 提示组装工具能根据场景、角色、平台生成完整的组装提示（token 数 < 4000）
2. 规格校验工具能检查输入/输出的 10+ 项规范要求，生成合规性报告
3. 所有 6 个场景都有完整的输入模板、输出模板、案例库
4. CLI 工具能集成到 HiveMind framework，支持 `/gsd:*` 命令系列
5. 扩展文档明确说明如何添加新场景或新平台支持

**风险预防：**
- 工具需与现有 HiveMind 架构兼容（使用相同的 Markdown/YAML 机制）
- 提示组装逻辑需确保 token 数可控（避免超过 Claude 上下文）

**依赖关系：** 依赖 Phase 1-7（所有前置能力完整）
**后续赋能：** 系统完成，可作为独立产品发布或集成到更大平台

---

## 交付时间线

基于 Standard 深度配置，估算交付周期：

| Phase | 工作量 | 时间 | 里程碑 |
|-------|--------|------|--------|
| 1 | 小 | 1-2 周 | 基础设施 Ready |
| 2 | 中 | 2-3 周 | 方法论库 Ready |
| 3 | 中 | 2-3 周 | 平台约束文档 Ready |
| 4 | 大 | 3-4 周 | 设计场景 MVP |
| 5 | 大 | 3-4 周 | 评审场景 MVP |
| 6 | 大 | 3-4 周 | 治理场景 MVP |
| 7 | 大 | 3-4 周 | SQL 生成 + 血缘 MVP |
| 8 | 中 | 2-3 周 | 工具化 Ready |
| **总计** | | **20-24 周** | **全系统 v1 完成** |

---

## 进度追踪表

| Phase | 目标 | 需求数 | 状态 | 完成度 |
|-------|------|--------|------|--------|
| 1 | 基础设施 | 4 | Pending | 0% |
| 2 | 方法论库 | 4 | Pending | 0% |
| 3 | 平台约束 | 3 | Pending | 0% |
| 4 | 设计场景 | 6 | Pending | 0% |
| 5 | 评审场景 | 8 | Pending | 0% |
| 6 | 治理场景 | 13 | Pending | 0% |
| 7 | SQL 生成 | 12 | Pending | 0% |
| 8 | 工具化 | 3 | Pending | 0% |
| **总计** | **全系统** | **48** | **Pending** | **0%** |

---

## 依赖关系图

```
Phase 1: 基础设施
    ↓
Phase 2: 方法论库 ←─────┐
    ↓                    │
Phase 3: 平台约束 ───┐   │
    ↓                │   │
Phase 4: 设计场景 ←─┴─┘   │
    ↓                      │
Phase 5: 评审场景 ←────────┘
    ↓
Phase 6: 治理场景（指标、DQ、血缘基础）
    ↓
Phase 7: SQL 生成 + 血缘增强
    ↓
Phase 8: 工具化
    ↓
✓ v1 系统完成
```

---

## 风险管理矩阵

| 风险 | 严重级别 | 预防策略 | 应对阶段 |
|------|---------|----------|----------|
| Mega-Prompt 复杂化 | P0 | 模块化 <2000 token 规范 | Phase 1 实施 + 全程遵循 |
| dbt-hive 分区错误 | P0 | Phase 3 明确分区限制与规避 | Phase 3-4 重点验证 |
| 中文术语翻译不一致 | P1 | Phase 1 术语表 + 全项目一致性检查 | Phase 1-2 |
| Claude 行为差异 | P1 | Phase 1 规范化提示格式 | Phase 1 + 3 |
| SCD 实现缺陷 | P1 | Phase 2 Type 1/2/3 详细指南 + 无 Snapshots 方案 | Phase 2-4 |
| 血缘解析失准 | P2 | Phase 6 明确表级为主，字段级为辅 | Phase 6-7 |
| 提示测试缺失 | P2 | Phase 4-7 每个场景配回归测试集 | 全程 |
| 字符编码问题 | P3 | UTF-8 强制 | 全程编码检查 |

---

## 成功指标

**v1 系统完成时的验收标准：**

1. **完整性：** 所有 48 个 v1 需求已实现，无遗漏
2. **可用性：** 每个场景都有可独立使用的 MVP（提示 + 模板 + 案例）
3. **质量：** 3+ 个综合案例通过人工评审，通过率 > 85%
4. **规范：** 所有文档与代码符合 Phase 1 定义的规范（命名、术语、token）
5. **可维护性：** 模块化架构，任何一个提示都能独立维护和升级
6. **可扩展性：** 支持添加新场景和新平台（framework 已就位）
7. **兼容性：** 与现有 HiveMind framework 无缝集成

---

## 下一步行动

1. **用户审核本路线图** → 确认阶段划分、依赖关系、估算周期
2. **启动 Phase 1** → 使用 `/gsd:plan-phase 1` 命令开始详细规划
3. **递进执行** → 逐阶段交付，每个 Phase 完成后更新 STATE.md 和进度表

---

**路线图创建日期：** 2026-01-30
**深度配置：** Standard (8 阶段)
**覆盖范围：** 48/48 v1 需求 100% ✓
**预计交付周期：** 20-24 周


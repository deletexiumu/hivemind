# Requirements: 数仓提示系统

**Defined:** 2026-01-30
**Core Value:** 用一套可组合的中文提示包，把 Hive+dbt 数仓的六类高频任务标准化为可复用、可追溯、带质量门禁的输出。

## v1 Requirements

### 基础设施 (INFRA)

- [ ] **INFRA-01**: 建立 `.claude/data-warehouse/` 目录结构（prompts/ + context/）
- [ ] **INFRA-02**: 编写中英术语对照表 `glossary/zh-en-mapping.md`，覆盖维度建模核心术语
- [ ] **INFRA-03**: 编写命名规范文档 `governance/naming-conventions.md`，定义表/字段/指标命名规则
- [ ] **INFRA-04**: 建立提示 token 限制规范（单文件 <2000 tokens）

### 方法论库 (METHOD)

- [ ] **METHOD-01**: 编写 Kimball 维度建模概念文档（事实表、维度表、星型/雪花模型）
- [ ] **METHOD-02**: 编写事实表类型指南（事务事实、周期快照、累积快照）
- [ ] **METHOD-03**: 编写 SCD 策略指南（Type 1/2/3 选型与实现，无 Snapshots 方案）
- [ ] **METHOD-04**: 编写分层体系规范（ODS/DWD/DWS/ADS 定义与跨层规则）

### 平台约束库 (PLATFORM)

- [ ] **PLATFORM-01**: 编写 Hive 平台约束文档（分区策略、存储格式、性能优化）
- [ ] **PLATFORM-02**: 编写 dbt-hive 能力边界文档（不支持 Snapshots/Ephemeral、分区列限制）
- [ ] **PLATFORM-03**: 编写增量策略文档（insert_overwrite、T+1 回刷模式）

### 场景1: 评审已有模型 (REVIEW)

- [ ] **REVIEW-01**: 用户可输入模型 SQL / dbt 配置 / DDL，系统输出问题清单
- [ ] **REVIEW-02**: 问题清单包含严重级别（P0/P1/P2/P3）和位置定位
- [ ] **REVIEW-03**: 每个问题附带修复建议（代码片段 + 说明）
- [ ] **REVIEW-04**: 系统检查命名规范合规性
- [ ] **REVIEW-05**: 系统检查分层引用合规性（禁止跨层违规引用）
- [ ] **REVIEW-06**: 系统检查主键/粒度定义完整性
- [ ] **REVIEW-07**: 系统检查字段类型合理性和注释完整性
- [ ] **REVIEW-08**: 系统检查 dbt 配置完整性（description、tests）

### 场景2: 设计新模型 (DESIGN)

- [ ] **DESIGN-01**: 用户可输入业务事件/指标/粒度描述，系统输出星型模型设计
- [ ] **DESIGN-02**: 输出包含事实表定义（粒度声明、度量字段、DDL + schema.yml）
- [ ] **DESIGN-03**: 输出包含维度表定义（SCD 策略、自然键/代理键、DDL + schema.yml）
- [ ] **DESIGN-04**: 输出包含分层落点建议（DWD/DWS 分配及理由）
- [ ] **DESIGN-05**: 输出包含 dbt model 模板（可直接使用的骨架代码）
- [ ] **DESIGN-06**: 事实表必须包含标准字段（etl_date、is_deleted 等）

### 场景3: 生成导数SQL (SQLGEN)

- [ ] **SQLGEN-01**: 用户可输入取数口径/过滤/时间窗，系统输出 Hive SQL
- [ ] **SQLGEN-02**: 生成的 SQL 强制包含分区过滤条件
- [ ] **SQLGEN-03**: 生成的 SQL 附带中文注释说明逻辑
- [ ] **SQLGEN-04**: 输出包含口径说明文档（解释计算逻辑）
- [ ] **SQLGEN-05**: 输出包含性能提示（优化建议、预估影响）
- [ ] **SQLGEN-06**: 输出包含依赖说明（涉及的表和关键字段）

### 场景4: 指标口径定义 (METRICS)

- [ ] **METRICS-01**: 用户可输入指标名称/业务描述，系统输出标准化指标定义
- [ ] **METRICS-02**: 输出包含指标唯一标识和分类（原子/派生/复合）
- [ ] **METRICS-03**: 输出包含计算公式标准化表达
- [ ] **METRICS-04**: 输出包含数据来源追溯（源表/字段）
- [ ] **METRICS-05**: 输出包含 dbt Semantic Layer 兼容格式（YAML）
- [ ] **METRICS-06**: 输出包含业务可读的口径说明文档

### 场景5: 生成DQ规则 (DQRULES)

- [ ] **DQRULES-01**: 用户可输入表/模型定义，系统输出 dbt tests 配置
- [ ] **DQRULES-02**: 自动生成主键唯一性检测（unique）
- [ ] **DQRULES-03**: 自动生成必填字段非空检测（not_null）
- [ ] **DQRULES-04**: 自动生成枚举值检测（accepted_values）
- [ ] **DQRULES-05**: 自动生成外键参照检测（relationships）
- [ ] **DQRULES-06**: 自动生成数据新鲜度检测
- [ ] **DQRULES-07**: 支持配置告警阈值（warn_if / error_if）

### 场景6: 血缘分析 (LINEAGE)

- [ ] **LINEAGE-01**: 用户可输入 SQL / dbt 模型，系统输出表级血缘关系
- [ ] **LINEAGE-02**: 系统输出字段级血缘映射表（源字段 -> 目标字段）
- [ ] **LINEAGE-03**: 系统识别 dbt ref() 依赖关系
- [ ] **LINEAGE-04**: 系统识别 JOIN 关联关系
- [ ] **LINEAGE-05**: 输出包含 Mermaid 格式血缘图
- [ ] **LINEAGE-06**: 支持变更影响评估（某字段变更影响的下游）

### 工具化 (TOOLS)

- [ ] **TOOLS-01**: 提示包可按场景 + 角色 + 平台动态组装
- [ ] **TOOLS-02**: 规格校验工具检查模板字段完整性
- [ ] **TOOLS-03**: 每个场景配套输入模板和输出模板

## v2 Requirements

### 高级评审能力

- **REVIEW-A01**: Kimball 建模合规评分（量化评估）
- **REVIEW-A02**: 性能反模式检测（笛卡尔积、大表 JOIN 顺序）
- **REVIEW-A03**: 业务语义一致性检查（对比数据字典）

### 高级设计能力

- **DESIGN-A01**: SCD 策略智能推荐（根据维度特征自动推荐）
- **DESIGN-A02**: 一致性维度复用建议（推荐已有维度表）
- **DESIGN-A03**: 增量策略自动设计

### 高级SQL生成

- **SQLGEN-A01**: 多方言适配（Hive/Spark SQL/Presto）
- **SQLGEN-A02**: 增量口径生成（T+1 增量汇总）
- **SQLGEN-A03**: SQL 复杂度评估与拆分建议

### 高级指标能力

- **METRICS-A01**: 指标一致性检测（与已有指标口径冲突检测）
- **METRICS-A02**: 指标依赖图生成

### 高级DQ能力

- **DQRULES-A01**: 业务规则智能提取（从字段名/注释推断）
- **DQRULES-A02**: dbt-expectations 高级检测（时序、分布、正则）
- **DQRULES-A03**: 跨表一致性检测

### 高级血缘能力

- **LINEAGE-A01**: 跨模型完整链路追溯
- **LINEAGE-A02**: 聚合/窗口函数精确血缘解析

## Out of Scope

| Feature | Reason |
|---------|--------|
| 实时数仓支持 | 本版本聚焦离线 T+1 场景，实时流处理架构差异大 |
| 可视化血缘图渲染 | 需要图形能力，超出提示系统范围，输出 Mermaid 格式供用户渲染 |
| SQL 实时执行 | 需要数据库连接，超出提示系统范围 |
| 多数据库方言并行支持 | 聚焦 Hive，未来可扩展 Snowflake/BigQuery |
| 自动代码修复 | 自动修复可能引入新问题，仅提供修复建议 |
| 指标平台直接对接 | 各企业指标平台差异大，输出标准格式供用户导入 |
| ML 异常检测 | 需要训练数据和模型，复杂度过高 |
| 代码标识符中文化 | 避免编码问题，保持技术兼容性 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| METHOD-01 | Phase 2 | Pending |
| METHOD-02 | Phase 2 | Pending |
| METHOD-03 | Phase 2 | Pending |
| METHOD-04 | Phase 2 | Pending |
| PLATFORM-01 | Phase 3 | Pending |
| PLATFORM-02 | Phase 3 | Pending |
| PLATFORM-03 | Phase 3 | Pending |
| DESIGN-01 | Phase 4 | Pending |
| DESIGN-02 | Phase 4 | Pending |
| DESIGN-03 | Phase 4 | Pending |
| DESIGN-04 | Phase 4 | Pending |
| DESIGN-05 | Phase 4 | Pending |
| DESIGN-06 | Phase 4 | Pending |
| REVIEW-01 | Phase 5 | Pending |
| REVIEW-02 | Phase 5 | Pending |
| REVIEW-03 | Phase 5 | Pending |
| REVIEW-04 | Phase 5 | Pending |
| REVIEW-05 | Phase 5 | Pending |
| REVIEW-06 | Phase 5 | Pending |
| REVIEW-07 | Phase 5 | Pending |
| REVIEW-08 | Phase 5 | Pending |
| METRICS-01 | Phase 6 | Pending |
| METRICS-02 | Phase 6 | Pending |
| METRICS-03 | Phase 6 | Pending |
| METRICS-04 | Phase 6 | Pending |
| METRICS-05 | Phase 6 | Pending |
| METRICS-06 | Phase 6 | Pending |
| DQRULES-01 | Phase 6 | Pending |
| DQRULES-02 | Phase 6 | Pending |
| DQRULES-03 | Phase 6 | Pending |
| DQRULES-04 | Phase 6 | Pending |
| DQRULES-05 | Phase 6 | Pending |
| DQRULES-06 | Phase 6 | Pending |
| DQRULES-07 | Phase 6 | Pending |
| SQLGEN-01 | Phase 7 | Pending |
| SQLGEN-02 | Phase 7 | Pending |
| SQLGEN-03 | Phase 7 | Pending |
| SQLGEN-04 | Phase 7 | Pending |
| SQLGEN-05 | Phase 7 | Pending |
| SQLGEN-06 | Phase 7 | Pending |
| LINEAGE-01 | Phase 7 | Pending |
| LINEAGE-02 | Phase 7 | Pending |
| LINEAGE-03 | Phase 7 | Pending |
| LINEAGE-04 | Phase 7 | Pending |
| LINEAGE-05 | Phase 7 | Pending |
| LINEAGE-06 | Phase 7 | Pending |
| TOOLS-01 | Phase 8 | Pending |
| TOOLS-02 | Phase 8 | Pending |
| TOOLS-03 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0 ✓

---

*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after roadmap synthesis*

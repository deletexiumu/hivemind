# 中英术语对照表

> 本文档定义 HiveMind 数仓助手的标准术语，所有提示和文档必须使用一致的术语表达。

## 术语权威原则

| 术语类型 | 权威来源 | 示例 |
|----------|----------|------|
| 方法论/建模语义 | **Kimball 优先** | fact, dimension, grain, SCD, 可加性, 总线矩阵 |
| 平台/产品对象 | **DataWorks 优先** | 节点、调度、资源、产品名词 |
| 项目自定义 | **项目规范** | ODS/DWD/DWS/ADS 分层、内部口径 |

---

## 如何引用术语

在其他文档中引用术语时，使用以下语法：

1. **行内引用**：`[术语中文](glossary/terms.md#term_id)`
   - 示例：`[事实表](glossary/terms.md#modeling_fact_table)`

2. **定义列表引用**（用于需要展示定义的场景）：
   - 引用 `modeling_grain` 了解粒度的含义

3. **批量引用**（用于文档头部声明依赖）：
   ```yaml
   术语依赖:
     - modeling_fact_table
     - modeling_dimension
     - layer_dwd
   ```

使用稳定的 `term_id` 确保即使中文名称调整，引用关系也不会断裂。

---

## 1. 维度建模核心术语

| term_id | 中文 | English | 定义 | 示例 | 同义词/别名 | 领域 | Owner | 状态 | 更新日期 |
|---------|------|---------|------|------|-------------|------|-------|------|----------|
| modeling_fact_table | 事实表 | Fact Table | 存储业务过程度量值的表，包含外键和数值型事实，粒度必须明确定义 | `dwd_fact_orders` | 事实 | modeling | data-platform | active | 2026-01-31 |
| modeling_dimension_table | 维度表 | Dimension Table | 存储业务实体描述性属性的表，为事实表提供分析上下文和筛选条件 | `dim_customer` | 维表\|维度 | modeling | data-platform | active | 2026-01-31 |
| modeling_star_schema | 星型模型 | Star Schema | 一个事实表连接多个维度表的结构，维度表直接关联事实表，无多级层次 | 订单事实表 + 时间/客户/产品维度表 | 星型架构 | modeling | data-platform | active | 2026-01-31 |
| modeling_snowflake_schema | 雪花模型 | Snowflake Schema | 维度表进一步规范化为多个相关表的结构，存在多级层次关系 | 产品维度拆分为产品 + 类目 + 品牌三个表 | 雪花架构 | modeling | data-platform | active | 2026-01-31 |
| modeling_grain | 粒度 | Grain | 事实表单行所代表的业务含义，是维度设计的首要决策 | "一行代表一个订单明细" | 颗粒度\|粒度级别 | modeling | data-platform | active | 2026-01-31 |
| modeling_measure | 度量 | Measure | 事实表中的数值型字段，通常可进行聚合计算（求和、平均等） | `order_amount`, `quantity` | 度量值\|指标值 | modeling | data-platform | active | 2026-01-31 |
| modeling_dimension_attribute | 维度属性 | Dimension Attribute | 维度表中描述实体特征的字段，用于筛选、分组和标签 | `customer_name`, `product_category` | 维度字段 | modeling | data-platform | active | 2026-01-31 |
| modeling_natural_key | 自然键 | Natural Key | 业务系统中原生的唯一标识符，来自源系统 | `order_no`, `customer_code` | 业务主键 | modeling | data-platform | active | 2026-01-31 |
| modeling_surrogate_key | 代理键 | Surrogate Key | 数仓系统生成的无业务含义的唯一标识符，通常为递增整数或 UUID | `dim_customer_sk`, `order_key` | 替代键\|人工键 | modeling | data-platform | active | 2026-01-31 |
| modeling_business_key | 业务键 | Business Key | 在业务上下文中唯一标识实体的键，可能由多个字段组成 | `(customer_id, source_system)` | 业务标识 | modeling | data-platform | active | 2026-01-31 |
| modeling_additive_fact | 可加事实 | Additive Fact | 可在所有维度上进行求和聚合的度量 | `sales_amount`, `quantity` | 完全可加 | modeling | data-platform | active | 2026-01-31 |
| modeling_semi_additive_fact | 半可加事实 | Semi-Additive Fact | 只能在部分维度上求和的度量，通常在时间维度上不可加 | `account_balance`, `inventory_level` | 部分可加 | modeling | data-platform | active | 2026-01-31 |
| modeling_non_additive_fact | 不可加事实 | Non-Additive Fact | 不能直接求和的度量，需要特殊聚合方式 | `unit_price`, `discount_rate` | 非可加 | modeling | data-platform | active | 2026-01-31 |
| modeling_transaction_fact | 事务事实表 | Transaction Fact Table | 记录单个业务事件的事实表，每行代表一个离散事务 | `dwd_fact_order_detail` | 事务型事实 | modeling | data-platform | active | 2026-01-31 |
| modeling_periodic_snapshot | 周期快照事实表 | Periodic Snapshot Fact Table | 按固定时间间隔记录状态的事实表，每行代表一个时间点的状态 | `dws_inventory_daily` | 定期快照 | modeling | data-platform | active | 2026-01-31 |
| modeling_accumulating_snapshot | 累积快照事实表 | Accumulating Snapshot Fact Table | 跟踪业务流程生命周期的事实表，随流程进展不断更新 | `dwd_fact_order_lifecycle` | 累积型快照 | modeling | data-platform | active | 2026-01-31 |
| modeling_factless_fact | 无事实事实表 | Factless Fact Table | 只记录事件发生但不包含度量的事实表，只有维度外键 | `fact_student_attendance` | 无度量事实表 | modeling | data-platform | active | 2026-01-31 |
| modeling_conformed_dimension | 一致性维度 | Conformed Dimension | 跨多个事实表共享且定义一致的维度，确保跨业务域分析一致性 | 公共时间维度 `dim_date`, 公共客户维度 | 共享维度 | modeling | data-platform | active | 2026-01-31 |
| modeling_role_playing_dimension | 角色扮演维度 | Role-Playing Dimension | 同一个物理维度表以不同角色多次关联同一事实表 | 时间维度同时作为下单日期和发货日期 | 多角色维度 | modeling | data-platform | active | 2026-01-31 |
| modeling_degenerate_dimension | 退化维度 | Degenerate Dimension | 存储在事实表中而非独立维度表的维度属性，通常是事务编号 | `order_no` 直接存在事实表中 | 退化维 | modeling | data-platform | active | 2026-01-31 |
| modeling_junk_dimension | 杂项维度 | Junk Dimension | 将多个低基数标志/指示符字段合并到一个维度表中 | 订单状态标志组合维度 | 垃圾维度\|标志维度 | modeling | data-platform | active | 2026-01-31 |
| modeling_bridge_table | 桥接表 | Bridge Table | 处理多对多关系的中间表，连接事实表和维度表 | `bridge_customer_account` | 桥表\|关联表 | modeling | data-platform | active | 2026-01-31 |
| modeling_bus_matrix | 总线矩阵 | Bus Matrix | 展示业务过程（行）与维度（列）关系的规划工具 | 行：订单、退款；列：时间、客户、产品 | 企业数据仓库总线矩阵 | modeling | data-platform | active | 2026-01-31 |
| modeling_dimension_hierarchy | 维度层级 | Dimension Hierarchy | 维度属性之间的层次关系，支持上卷和下钻分析 | 年 → 季 → 月 → 日 | 层次结构 | modeling | data-platform | active | 2026-01-31 |
| modeling_drill_down | 下钻 | Drill Down | 从汇总数据向更细粒度数据深入分析的操作 | 从月销售额下钻到日销售额 | 钻取 | modeling | data-platform | active | 2026-01-31 |
| modeling_drill_up | 上卷 | Drill Up / Roll Up | 从细粒度数据向汇总数据聚合分析的操作 | 从日销售额上卷到月销售额 | 汇总 | modeling | data-platform | active | 2026-01-31 |

---

## 2. 分层体系术语

| term_id | 中文 | English | 定义 | 示例 | 同义词/别名 | 领域 | Owner | 状态 | 更新日期 |
|---------|------|---------|------|------|-------------|------|-------|------|----------|
| layer_ods | 操作数据层 | ODS (Operational Data Store) | 原始数据落地层，保持源系统结构和数据不变，仅做基础清洗 | `ods_mysql_orders`, `ods_kafka_events` | 贴源层\|原始层 | layer | data-platform | active | 2026-01-31 |
| layer_dwd | 明细数据层 | DWD (Data Warehouse Detail) | 清洗后的明细事实层，进行数据标准化、去重、关联维度 | `dwd_fact_order_detail`, `dwd_fact_payment` | 明细层\|基础事实层 | layer | data-platform | active | 2026-01-31 |
| layer_dws | 汇总数据层 | DWS (Data Warehouse Summary) | 轻度汇总的主题宽表，按业务主题组织，支持多维分析 | `dws_order_daily`, `dws_customer_profile` | 汇总层\|主题层\|轻度汇总层 | layer | data-platform | active | 2026-01-31 |
| layer_ads | 应用数据层 | ADS (Application Data Service) | 面向应用的指标结果表，直接服务报表、API、数据产品 | `ads_gmv_report`, `ads_user_retention` | 应用层\|数据服务层\|数据集市层 | layer | data-platform | active | 2026-01-31 |
| layer_dim | 公共维度层 | DIM (Dimension Layer) | 存放公共维度表的层，跨业务域共享的一致性维度 | `dim_date`, `dim_customer`, `dim_product` | 维度层 | layer | data-platform | active | 2026-01-31 |
| layer_staging | 临时表 | Staging Table | 数据处理过程中的中间临时存储，通常在 ETL 完成后删除 | `stg_order_cleaned`, `stg_customer_dedup` | 暂存表\|过渡表 | layer | data-platform | active | 2026-01-31 |
| layer_intermediate | 中间表 | Intermediate Table | 复杂转换过程中的持久化中间结果，可复用 | `int_order_enriched`, `int_customer_merged` | 中间层 | layer | data-platform | active | 2026-01-31 |
| layer_data_domain | 数据域 | Data Domain | 按业务领域划分的数据组织单元，如交易域、用户域、商品域 | 交易域、用户域、商品域、物流域 | 业务域 | layer | data-platform | active | 2026-01-31 |
| layer_subject_area | 主题域 | Subject Area | 围绕特定分析主题组织的数据集合，面向业务分析需求 | 销售分析主题、库存分析主题 | 分析主题 | layer | data-platform | active | 2026-01-31 |
| layer_data_mart | 数据集市 | Data Mart | 面向特定部门或业务线的数据子集，从数仓提取 | 营销数据集市、财务数据集市 | 部门级数仓 | layer | data-platform | active | 2026-01-31 |
| layer_data_warehouse | 数据仓库 | Data Warehouse | 面向分析的、集成的、随时间变化的数据集合 | 企业级数据仓库 | 数仓\|DW | layer | data-platform | active | 2026-01-31 |
| layer_cross_layer_ref | 跨层引用 | Cross-Layer Reference | 非相邻层之间的数据引用，通常需要审慎使用 | ADS 直接引用 DWD（跳过 DWS） | 跳层引用 | layer | data-platform | active | 2026-01-31 |
| layer_dependency | 层间依赖 | Layer Dependency | 数据层之间的依赖关系，定义数据流向 | DWD 依赖 ODS，DWS 依赖 DWD | 分层依赖 | layer | data-platform | active | 2026-01-31 |
| layer_data_lake | 数据湖 | Data Lake | 存储原始格式数据的大规模存储系统，支持多种数据类型 | HDFS、S3 上的原始数据存储 | 湖仓 | layer | data-platform | active | 2026-01-31 |
| layer_lakehouse | 湖仓一体 | Lakehouse | 结合数据湖灵活性和数仓分析能力的架构 | Delta Lake、Apache Iceberg | 湖仓架构 | layer | data-platform | active | 2026-01-31 |

---

## 3. 指标治理术语

| term_id | 中文 | English | 定义 | 示例 | 同义词/别名 | 领域 | Owner | 状态 | 更新日期 |
|---------|------|---------|------|------|-------------|------|-------|------|----------|
| metric_indicator | 指标 | Metric / Indicator | 可量化的业务度量，有明确的计算口径和业务含义 | GMV、DAU、转化率 | 度量\|KPI | metric | data-platform | active | 2026-01-31 |
| metric_atomic | 原子指标 | Atomic Metric | 最基础、不可再拆分的指标，基于明确的业务过程和度量 | 支付金额、下单件数 | 基础指标 | metric | data-platform | active | 2026-01-31 |
| metric_derived | 派生指标 | Derived Metric | 在原子指标基础上加上维度限定、时间限定的指标 | 近7日GMV、北京地区支付金额 | 衍生指标 | metric | data-platform | active | 2026-01-31 |
| metric_composite | 复合指标 | Composite Metric | 多个原子指标通过计算公式组合而成的指标 | 客单价 = GMV / 订单数 | 组合指标 | metric | data-platform | active | 2026-01-31 |
| metric_dimension | 分析维度 | Dimension (Analysis) | 用于切分和分组指标的视角，如时间、地区、渠道 | 按日期、按城市、按品类 | 切片维度 | metric | data-platform | active | 2026-01-31 |
| metric_caliber | 口径 | Caliber / Definition | 指标的精确计算逻辑和业务规则定义 | "GMV = 已支付订单金额，不含运费" | 定义\|计算规则 | metric | data-platform | active | 2026-01-31 |
| metric_formula | 指标公式 | Metric Formula | 指标的数学计算表达式 | `GMV = SUM(order_amount) WHERE status = 'paid'` | 计算公式 | metric | data-platform | active | 2026-01-31 |
| metric_calculation_logic | 计算逻辑 | Calculation Logic | 指标从原始数据到最终结果的完整处理流程 | 先过滤无效订单，再关联汇率，最后求和 | 加工逻辑 | metric | data-platform | active | 2026-01-31 |
| metric_time_granularity | 时间粒度 | Time Granularity | 指标计算和展示的时间精度级别 | 日粒度、周粒度、月粒度 | 时间周期 | metric | data-platform | active | 2026-01-31 |
| metric_business_process | 业务过程 | Business Process | 企业运营中可度量的活动或事件 | 下单、支付、发货、退款 | 业务事件 | metric | data-platform | active | 2026-01-31 |
| metric_data_freshness | 数据新鲜度 | Data Freshness | 数据从产生到可用的延迟时间 | T+1（次日可用）、实时（秒级） | 时效性 | metric | data-platform | active | 2026-01-31 |
| metric_data_timeliness | 数据时效 | Data Timeliness | 数据更新的及时程度和频率要求 | 每日凌晨2点更新、每小时更新 | 更新频率 | metric | data-platform | active | 2026-01-31 |
| metric_category | 指标分类 | Metric Category | 按业务领域或用途对指标进行的分组 | 流量指标、转化指标、收入指标 | 指标类型 | metric | data-platform | active | 2026-01-31 |
| metric_tag | 指标标签 | Metric Tag | 用于灵活标记和检索指标的元数据 | #核心指标 #财务 #日报 | 标签 | metric | data-platform | active | 2026-01-31 |
| metric_data_owner | 数据所有者 | Data Owner | 对数据资产负有管理责任的业务负责人 | 销售数据 Owner：销售总监 | 数据责任人 | metric | data-platform | active | 2026-01-31 |
| metric_data_steward | 数据管家 | Data Steward | 负责数据质量、标准和治理的技术执行人 | 数据平台团队的数据治理工程师 | 数据治理员 | metric | data-platform | active | 2026-01-31 |
| metric_semantic_layer | 语义层 | Semantic Layer | 在物理数据模型之上定义业务语义的抽象层 | dbt Semantic Layer、LookML | 指标层\|度量层 | metric | data-platform | active | 2026-01-31 |
| metric_consistency | 指标一致性 | Metric Consistency | 同一指标在不同报表和系统中计算结果一致 | 不同报表的 GMV 口径统一 | 口径一致 | metric | data-platform | active | 2026-01-31 |
| metric_lineage | 指标血缘 | Metric Lineage | 指标从原始数据到最终展示的完整依赖链路 | GMV 依赖订单表、支付表、汇率表 | 指标溯源 | metric | data-platform | active | 2026-01-31 |
| metric_certification | 指标认证 | Metric Certification | 对指标定义和计算逻辑的官方确认和发布流程 | 财务认证的 GMV 指标 | 指标审核 | metric | data-platform | active | 2026-01-31 |

---

## 4. SCD/增量术语

| term_id | 中文 | English | 定义 | 示例 | 同义词/别名 | 领域 | Owner | 状态 | 更新日期 |
|---------|------|---------|------|------|-------------|------|-------|------|----------|
| scd_slowly_changing | 缓慢变化维度 | Slowly Changing Dimension (SCD) | 维度属性随时间缓慢变化的处理机制 | 客户地址变更、产品价格调整 | SCD | scd | data-platform | active | 2026-01-31 |
| scd_type1 | SCD Type 1 | SCD Type 1 (Overwrite) | 直接覆盖旧值，不保留历史，适合可纠错的属性 | 客户手机号更正 | 覆盖型 | scd | data-platform | active | 2026-01-31 |
| scd_type2 | SCD Type 2 | SCD Type 2 (History) | 保留完整历史版本，使用有效期字段标记版本 | 客户地址变更保留旧地址记录 | 历史追踪型 | scd | data-platform | active | 2026-01-31 |
| scd_type3 | SCD Type 3 | SCD Type 3 (Previous/Current) | 只保留当前值和前一个值，增加"前值"字段 | `current_address`, `previous_address` | 前值保留型 | scd | data-platform | active | 2026-01-31 |
| scd_valid_from | 有效期起始 | Valid From / dw_valid_from | SCD Type 2 中记录生效开始时间的字段 | `dw_valid_from = '2026-01-01'` | 生效日期\|开始日期 | scd | data-platform | active | 2026-01-31 |
| scd_valid_to | 有效期截止 | Valid To / dw_valid_to | SCD Type 2 中记录失效时间的字段，当前记录通常为 9999-12-31 | `dw_valid_to = '9999-12-31'` | 失效日期\|结束日期 | scd | data-platform | active | 2026-01-31 |
| scd_is_current | 当前标识 | Is Current / is_current | 标识记录是否为当前有效版本的布尔字段 | `is_current = 1` 表示当前有效 | 当前版本标志 | scd | data-platform | active | 2026-01-31 |
| scd_version_number | 版本号 | Version Number | 记录的版本序号，通常从 1 递增 | `version = 3` 表示第三个版本 | 版本序号 | scd | data-platform | active | 2026-01-31 |
| scd_incremental_load | 增量加载 | Incremental Load | 只处理自上次加载后新增或变更的数据 | 只加载昨日新增订单 | 增量更新\|增量同步 | scd | data-platform | active | 2026-01-31 |
| scd_full_load | 全量加载 | Full Load | 每次加载完整数据集，覆盖原有数据 | 每日全量同步维度表 | 全量更新\|全量刷新 | scd | data-platform | active | 2026-01-31 |
| scd_partition_overwrite | 分区回刷 | Partition Overwrite | 覆盖写入特定分区的数据，其他分区不受影响 | `INSERT OVERWRITE PARTITION (dt='2026-01-30')` | 分区覆盖 | scd | data-platform | active | 2026-01-31 |
| scd_insert_overwrite | INSERT OVERWRITE | INSERT OVERWRITE | Hive 中先删除后插入的原子操作，常用于分区数据更新 | `INSERT OVERWRITE TABLE t PARTITION(dt)` | 覆盖写入 | scd | data-platform | active | 2026-01-31 |
| scd_t_plus_1 | T+1 离线 | T+1 Offline | 数据在业务日次日才可用的处理模式 | T日订单数据 T+1 日凌晨入仓 | 次日可用\|离线批处理 | scd | data-platform | active | 2026-01-31 |
| scd_batch_processing | 批处理 | Batch Processing | 按固定周期批量处理数据的模式 | 每日凌晨 2 点跑批 | 批量处理\|定时调度 | scd | data-platform | active | 2026-01-31 |
| scd_etl_timestamp | ETL 时间戳 | ETL Timestamp | 记录数据加载或处理时间的字段 | `dw_insert_time`, `etl_time` | 加载时间 | scd | data-platform | active | 2026-01-31 |
| scd_create_time | 创建时间 | Create Time | 记录首次创建时间的字段 | `created_at`, `gmt_create` | 创建日期 | scd | data-platform | active | 2026-01-31 |
| scd_modify_time | 修改时间 | Modify Time | 记录最后修改时间的字段，用于增量抽取判断 | `updated_at`, `gmt_modified` | 更新时间\|变更时间 | scd | data-platform | active | 2026-01-31 |
| scd_data_snapshot | 数据快照 | Data Snapshot | 某一时间点的完整数据状态副本 | 每日 0 点的账户余额快照 | 快照 | scd | data-platform | active | 2026-01-31 |
| scd_history_table | 历史表 | History Table | 专门存储历史版本数据的表 | `dim_customer_history` | 历史版本表 | scd | data-platform | active | 2026-01-31 |
| scd_partition_key | 分区键 | Partition Key | 用于数据分区的字段，通常是日期 | `dt`, `partition_date` | 分区字段 | scd | data-platform | active | 2026-01-31 |
| scd_partition_pruning | 分区裁剪 | Partition Pruning | 查询时只扫描相关分区，提升性能的优化技术 | `WHERE dt = '2026-01-30'` 只扫描该分区 | 分区剪枝 | scd | data-platform | active | 2026-01-31 |
| scd_cdc | 变更数据捕获 | Change Data Capture (CDC) | 捕获源系统数据变更的技术，支持实时/准实时同步 | Debezium、Canal、Maxwell | CDC | scd | data-platform | active | 2026-01-31 |
| scd_merge | MERGE 语句 | MERGE Statement | 根据匹配条件执行插入、更新或删除的 SQL 语句 | `MERGE INTO target USING source ON ...` | UPSERT | scd | data-platform | active | 2026-01-31 |
| scd_delta_table | 增量表 | Delta Table | 只存储增量变更数据的表 | `ods_orders_delta` | 变更表 | scd | data-platform | active | 2026-01-31 |

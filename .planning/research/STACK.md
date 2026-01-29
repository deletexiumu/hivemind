# 技术栈研究：数仓提示系统

**项目：** Hive+dbt 数仓提示系统
**研究日期：** 2026-01-30
**研究维度：** Stack（技术栈）

---

## 执行摘要

本研究聚焦于构建 Hive+dbt 数仓提示系统所需的技术栈补充。基于官方文档、生态兼容性和用户反馈（Codex 讨论确认），推荐使用 **dbt-hive 1.10.0 + Apache Hive 3.x + ORC 格式 + 非事务表优先** 的核心组合，配合 dbt-utils 等官方 packages 支撑 Kimball 维度建模。

**关键发现：**
- dbt-hive adapter 由 Cloudera 维护，功能稳定但有明确边界（不支持 Snapshots、Ephemeral）
- **Hive 3.x 在生态兼容性上优于 4.x**（驱动、权限、治理、周边组件支持更成熟）
- **ORC 格式推荐**（压缩率高、与 Hive 生态耦合强、谓词下推/向量化支持好）
- **优先使用非事务表**（避免 Compaction 运维复杂度和 ACID 表性能开销）
- 中文数仓术语尚无官方标准，需在项目内建立术语表

---

## 推荐技术栈

### 核心框架

| 技术 | 版本 | 用途 | 为什么选它 | 置信度 |
|------|------|------|------------|--------|
| dbt-core | 1.10.* | 数据转换引擎 | dbt-hive 1.10.0 的依赖要求，Cloudera 官方支持 | HIGH |
| dbt-hive | 1.10.0 | Hive adapter | Cloudera 官方维护，2025-11-27 发布，与 dbt-core 1.10 对齐 | HIGH |
| Apache Hive | **3.x (推荐 3.1.3)** | 数仓引擎 | 生态兼容性最佳，企业发行版支持成熟 | HIGH |

**版本选择说明（Codex 讨论确认）：**

| 维度 | Hive 3.x | Hive 4.x |
|------|---------|---------|
| **生态兼容性** | ✓ 驱动/权限/治理组件支持成熟 | △ 部分组件尚未完全适配 |
| **企业发行版** | ✓ CDP/HDP/CDH 主流版本 | △ 需验证发行版支持矩阵 |
| **dbt-hive 适配** | ✓ 充分测试 | △ 需验证增量策略兼容性 |
| **ACID 能力** | ✓ 基本 ACID 支持 | ✓ 增强 ACID + Iceberg |
| **推荐场景** | 离线 T+1 数仓（本项目） | 需要强 ACID/Iceberg 的场景 |

**版本验证来源：**
- dbt-hive 1.10.0: [PyPI](https://pypi.org/project/dbt-hive/) + [GitHub cloudera/dbt-hive](https://github.com/cloudera/dbt-hive)
- Apache Hive 3.1.3: [Apache Hive 官网](https://hive.apache.org/)

### 运行环境

| 技术 | 版本 | 用途 | 为什么选它 | 置信度 |
|------|------|------|------------|--------|
| Python | >= 3.9 | dbt 运行时 | dbt-hive 的最低要求 | HIGH |
| impyla | >= 0.18 | Hive 连接驱动 | dbt-hive 依赖，支持 Binary/HTTP 两种传输 | HIGH |
| TEZ | (随 Hive 3.x/4.x) | 执行引擎 | Hive 常用执行引擎，ACID 事务要求 Tez/LLAP，MR 不支持 ACID | HIGH |

### 存储格式（Codex 讨论确认）

| 格式 | 用途 | 为什么选它 | 置信度 |
|------|------|------------|--------|
| **ORC（推荐）** | **默认格式** | 压缩率高、与 Hive 生态耦合强、谓词下推/向量化/列统计支持最佳 | HIGH |
| Parquet | 跨平台交互场景 | 当需要与 Trino/Presto/Spark 频繁交互时选用 | MEDIUM |

**ORC vs Parquet 决策指南：**

| 决策因素 | 选 ORC | 选 Parquet |
|---------|--------|-----------|
| **主查询引擎** | Hive/Tez 为主 | Trino/Presto/Spark 为主或混合 |
| **与 Hive 生态耦合** | 高（谓词下推、列统计最优） | 中 |
| **跨平台一致性** | 中 | 高 |
| **压缩率** | 高（ZLIB/Snappy 选择灵活） | 中高 |
| **本项目推荐** | ✓ 默认选择 | 特定跨平台场景使用 |

### 事务表策略（Codex 讨论确认）

**核心原则：尽量避免事务表，除非确有必要**

| 场景 | 推荐方案 | 说明 |
|------|---------|------|
| **离线 T+1 增量** | `INSERT OVERWRITE` 分区回刷 | 覆盖受影响分区，简单可靠 |
| **历史数据修正** | 变更明细表 + 最终快照表 | 把 upsert 变成可重放的 append |
| **必须 upsert/delete** | 事务表（ACID）| 仅在确需强一致写入时使用 |
| **频繁 upsert** | 考虑 Hudi/Iceberg | 专用表格式，与 Hive/Spark 协同 |

**事务表使用白名单（仅以下场景允许）：**
- 确实需要 upsert/delete 语义
- 近实时数据修正（T+0 场景）
- 能接受 Compaction 运维成本

**事务表风险提示：**
- Compaction 需要额外运维和资源
- 写入路径更复杂（锁机制）
- 性能开销高于非事务表
- ACID 表分区列不支持 MERGE 更新

### 补数/回刷/晚到数据策略（国内数仓最佳实践）

**核心场景：离线T+1数仓的数据修正**

| 场景 | 策略 | 实现方式 | 说明 |
|------|------|---------|------|
| **T+1常规加载** | 按日分区追加 | `INSERT OVERWRITE PARTITION(dt='${ds}')` | 每日凌晨加载前一天数据 |
| **晚到数据(1-3天)** | 滑动窗口回刷 | 回刷最近N天分区（默认7天） | 自动覆盖受影响分区 |
| **历史数据修正** | 指定分区回刷 | 手动指定回刷范围 | 需要审批+对账 |
| **全量重建** | 全表重刷 | 清空后重新加载 | 仅用于重大变更 |

**晚到数据处理规范：**

```sql
-- 标准增量模型配置（dbt）
{{ config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    -- 晚到数据：回刷最近7天
    lookback_days=7
) }}

SELECT
    order_id,
    pay_time,
    amount,
    -- 使用业务时间（非系统时间）作为分区
    date_format(pay_time, 'yyyy-MM-dd') as dt
FROM {{ source('ods', 'orders') }}
{% if is_incremental() %}
WHERE dt >= date_sub(current_date(), {{ var('lookback_days', 7) }})
{% endif %}
```

**回刷窗口规范：**

| 层级 | 默认回刷窗口 | 说明 |
|------|-------------|------|
| ODS | 当日 | 贴源层，通常只加载当日 |
| DWD | 7天 | 明细层，覆盖晚到数据 |
| DWS | 7-30天 | 汇总层，依赖上游回刷范围 |
| ADS | 按需 | 应用层，根据报表周期 |

**对账与验证：**

```sql
-- 回刷后对账检查
SELECT
    dt,
    COUNT(*) as row_count,
    SUM(amount) as total_amount
FROM dws_order_daily
WHERE dt >= date_sub(current_date(), 7)
GROUP BY dt
ORDER BY dt;

-- 与上游对比
-- 确保 DWS 汇总值 = DWD 明细聚合值
```

**跨天口径统一（支付/下单/发货）：**

| 时间字段 | 适用场景 | 说明 |
|---------|---------|------|
| `create_time` | 订单漏斗分析 | 订单创建时间 |
| `pay_time` | **GMV/收入报表（推荐）** | 财务口径，已确认收入 |
| `ship_time` | 履约分析 | 物流时效 |
| `complete_time` | 完成率分析 | 订单完结 |

**建议：** 在项目初期明确"默认时间口径"，写入 `knowledge/decisions/` 作为架构决策记录。

### SCD Type 2 拉链表实现模板（国内数仓最佳实践）

由于 dbt-hive 不支持 Snapshots，需手动实现 SCD Type 2。

**标准拉链表结构：**

```sql
CREATE TABLE dim_customer (
    -- 代理键（系统生成）
    customer_sk BIGINT,
    -- 自然键（业务键）
    customer_id STRING,
    -- 业务属性
    customer_name STRING,
    address STRING,
    city STRING,
    -- SCD 控制字段
    dw_valid_from DATE,      -- 生效日期
    dw_valid_to DATE,        -- 失效日期（9999-12-31 表示当前有效）
    is_current INT,          -- 是否当前有效（1=是，0=否）
    -- ETL 控制字段
    dw_insert_time TIMESTAMP,
    dw_update_time TIMESTAMP
)
PARTITIONED BY (dt STRING)
STORED AS ORC;
```

**dbt 模型实现（insert_overwrite 策略）：**

```sql
-- models/marts/dim/dim_customer.sql
{{ config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    file_format='orc'
) }}

WITH source_data AS (
    SELECT
        customer_id,
        customer_name,
        address,
        city,
        updated_at
    FROM {{ source('ods', 'customers') }}
    WHERE dt = '{{ var("ds") }}'
),

existing_records AS (
    SELECT * FROM {{ this }}
    WHERE is_current = 1
),

-- 识别变更记录
changes AS (
    SELECT
        s.customer_id,
        s.customer_name,
        s.address,
        s.city,
        s.updated_at,
        e.customer_sk,
        CASE
            WHEN e.customer_id IS NULL THEN 'INSERT'
            WHEN s.customer_name != e.customer_name
                 OR s.address != e.address
                 OR s.city != e.city THEN 'UPDATE'
            ELSE 'NO_CHANGE'
        END AS change_type
    FROM source_data s
    LEFT JOIN existing_records e ON s.customer_id = e.customer_id
),

-- 关闭旧记录
closed_records AS (
    SELECT
        e.customer_sk,
        e.customer_id,
        e.customer_name,
        e.address,
        e.city,
        e.dw_valid_from,
        date_sub(current_date(), 1) AS dw_valid_to,
        0 AS is_current,
        e.dw_insert_time,
        current_timestamp() AS dw_update_time,
        '{{ var("ds") }}' AS dt
    FROM existing_records e
    INNER JOIN changes c ON e.customer_id = c.customer_id
    WHERE c.change_type = 'UPDATE'
),

-- 新增/变更记录
new_records AS (
    SELECT
        {{ dbt_utils.generate_surrogate_key(['customer_id', 'current_date()']) }} AS customer_sk,
        customer_id,
        customer_name,
        address,
        city,
        current_date() AS dw_valid_from,
        date('9999-12-31') AS dw_valid_to,
        1 AS is_current,
        current_timestamp() AS dw_insert_time,
        current_timestamp() AS dw_update_time,
        '{{ var("ds") }}' AS dt
    FROM changes
    WHERE change_type IN ('INSERT', 'UPDATE')
),

-- 未变更记录保持原样
unchanged_records AS (
    SELECT
        e.customer_sk,
        e.customer_id,
        e.customer_name,
        e.address,
        e.city,
        e.dw_valid_from,
        e.dw_valid_to,
        e.is_current,
        e.dw_insert_time,
        e.dw_update_time,
        '{{ var("ds") }}' AS dt
    FROM existing_records e
    INNER JOIN changes c ON e.customer_id = c.customer_id
    WHERE c.change_type = 'NO_CHANGE'
)

SELECT * FROM closed_records
UNION ALL
SELECT * FROM new_records
UNION ALL
SELECT * FROM unchanged_records
```

**回填/重跑策略：**

| 操作 | 命令 | 说明 |
|------|------|------|
| 日常增量 | `dbt run --select dim_customer --vars '{"ds":"2026-01-30"}'` | 处理当日变更 |
| 历史回填 | 按日期循环执行，从最早日期开始 | 保证时间顺序 |
| 全量重建 | 清空表后从第一天开始回填 | 仅用于重大变更 |

**查询当前快照：**

```sql
SELECT * FROM dim_customer WHERE is_current = 1;
```

**查询历史时点快照：**

```sql
SELECT * FROM dim_customer
WHERE dw_valid_from <= '2026-01-15'
  AND dw_valid_to > '2026-01-15';
```

### dbt Packages（推荐）

| Package | 版本 | 用途 | 为什么选它 | 置信度 |
|---------|------|------|------------|--------|
| dbt-utils | 最新 | 核心工具函数 | surrogate_key 生成、数据透视、通用宏 | HIGH |
| dbt-expectations | 最新 | 数据质量测试 | 40+ 测试类型，Great Expectations 风格 | MEDIUM |
| dbt-project-evaluator | 最新 | 项目质量检查 | 检测与 dbt Labs 最佳实践的偏差 | MEDIUM |
| codegen | 最新 | 代码生成 | 自动生成 staging 模型脚手架 | MEDIUM |

**来源：** [dbt Hub](https://hub.getdbt.com/)

---

## dbt-hive 能力边界

### 支持的功能

| 功能 | 状态 | 说明 |
|------|------|------|
| Table 物化 | 支持 | 标准表和分区表 |
| View 物化 | 支持 | 完整支持 |
| Incremental (append) | 支持 | 默认策略，追加新记录 |
| Incremental (insert_overwrite) | 支持 | 带分区时更新变化记录 |
| Incremental (merge) | 部分支持 | 仅 ACID 表支持，但不能更新分区列 |
| Seeds | 支持 | CSV 数据加载 |
| Tests | 支持 | 数据质量测试 |
| Documentation | 支持 | 模型文档生成 |
| Partitioning | 支持 | 分区列必须是 SELECT 最后一列 |
| Clustering | 支持 | clustered_by 配置 |
| External Tables | 支持 | external=true 配置 |
| Iceberg Tables | 支持 | table_type="iceberg" 配置 |

### 不支持的功能

| 功能 | 状态 | 影响 | 替代方案 |
|------|------|------|----------|
| Snapshots | 不支持 | 无法使用 dbt 原生 SCD Type 2 | 手动实现 SCD 逻辑或使用 dbt-scd 宏 |
| Ephemeral 物化 | 不支持 | 无法使用临时 CTE 模型 | 使用 View 物化替代 |
| Merge 更新分区列 | 不支持 | ACID 表限制 | 重新设计分区策略，避免更新分区列 |

### 关键限制

1. **分区列顺序：** `partition_by` 指定的列必须是 SELECT 语句的最后一列，否则 Hive 报错
2. **Insert Overwrite 风险：** 不带分区的 insert_overwrite 会完全覆盖整表，可能导致数据丢失
3. **认证方式：** 支持 LDAP 和 Kerberos，Kerberos 需要 Unix 环境
4. **Iceberg v1 限制：** Iceberg v1 表不支持 Merge（非事务性）

**来源：** [dbt Hive Setup 文档](https://docs.getdbt.com/docs/core/connect-data-platform/hive-setup)、[dbt Hive Configs 文档](https://docs.getdbt.com/reference/resource-configs/hive-configs)

---

## Hive 配置要求

### ACID 事务配置

启用 ACID 事务需要以下配置（Hive 3.x/4.x）：

```sql
SET hive.support.concurrency=true;
SET hive.txn.manager=org.apache.hadoop.hive.ql.lockmgr.DbTxnManager;
SET hive.compactor.initiator.on=true;
SET hive.compactor.worker.threads=1;
```

### ACID 表创建要求

```sql
CREATE TABLE table_name (
    id INT,
    name STRING
)
CLUSTERED BY (id) INTO 2 BUCKETS
STORED AS ORC
TBLPROPERTIES (
    "transactional"="true",
    "compactor.mapreduce.map.memory.mb"="2048",
    "compactorthreshold.hive.compactor.delta.num.threshold"="4",
    "compactorthreshold.hive.compactor.delta.pct.threshold"="0.5"
);
```

**关键点：**
- 必须使用 ORC 格式
- 必须使用 CLUSTERED BY（分桶）
- 必须设置 transactional=true
- 必须使用 TEZ 执行引擎（MR 不支持 ACID）

### 推荐 Hive 版本（与项目定位一致）

| 版本 | 推荐程度 | 说明 |
|------|----------|------|
| **Hive 3.1.x** | **本项目推荐** | 生态兼容性最佳，企业发行版(CDP/HDP/CDH)支持成熟，dbt-hive充分测试 |
| Hive 3.0.x | 可接受 | 基本ACID支持，广泛部署 |
| Hive 4.x | 未来可选 | 需验证发行版支持矩阵和dbt-hive兼容性后再采用 |
| Hive 2.x | 不推荐 | ACID 功能不完整，升级前需要 Major Compaction |

**注意：** 本项目定位为离线T+1数仓，优先选择生态兼容性，故推荐Hive 3.x。如需Hive 4.x的增强ACID/Iceberg能力，需先完成兼容性验证。

**来源：** [Apache Hive 官网](https://hive.apache.org/)、[Hive Transactions 文档](https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions)

---

## 提示系统 Context 组织方式

### dbt 项目分层结构

基于 dbt Labs 官方最佳实践和中国数仓 ODS/DWD/DWS/ADS 分层体系的映射：

```
models/
├── staging/          # 对应 ODS 层
│   ├── source_a/
│   │   ├── stg_source_a__table1.sql
│   │   └── stg_source_a__table1.yml
│   └── source_b/
├── intermediate/     # 对应 DWD 层（部分）
│   ├── finance/
│   │   ├── int_orders_pivoted.sql
│   │   └── int_orders_pivoted.yml
│   └── marketing/
├── marts/            # 对应 DWD/DWS/ADS 层
│   ├── dim/          # 维度表
│   │   ├── dim_customer.sql
│   │   └── dim_product.sql
│   ├── dwd/          # 明细事实表
│   │   └── dwd_order_detail.sql
│   ├── dws/          # 汇总事实表
│   │   └── dws_order_daily.sql
│   └── ads/          # 应用层
│       └── ads_sales_report.sql
└── seeds/            # 静态数据
```

### dbt 与中国数仓分层映射

| dbt 层 | 中国数仓层 | 物化方式 | 说明 |
|--------|-----------|----------|------|
| staging | ODS | view | 1:1 映射源表，仅做清洗和标准化 |
| intermediate | DWD（部分） | view/table | 业务逻辑封装，中间转换 |
| marts/dim | DIM | table | 维度表，Kimball 一致性维度 |
| marts/dwd | DWD | incremental | 明细事实表，最细粒度 |
| marts/dws | DWS | incremental | 汇总事实表，轻度聚合 |
| marts/ads | ADS | table | 应用层，面向业务报表 |

### 命名规范

| 层 | 命名模式 | 示例 |
|----|----------|------|
| staging | `stg_[source]__[entity]s` | `stg_erp__orders` |
| intermediate | `int_[entity]s_[verb]s` | `int_orders_pivoted` |
| dimension | `dim_[entity]` | `dim_customer` |
| fact (DWD) | `dwd_[entity]_[grain]` | `dwd_order_line` |
| fact (DWS) | `dws_[entity]_[period]` | `dws_sales_daily` |
| application | `ads_[domain]_[purpose]` | `ads_finance_revenue` |

**来源：** [dbt 项目结构最佳实践](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview)、[阿里云数仓分层指南](https://www.alibabacloud.com/help/en/dataworks/user-guide/data-warehouse-layering)

---

## 中文术语标准

### 现状

**重要发现：** 数据仓库领域尚无官方中文术语标准。常见术语翻译来自：
- 《数据仓库工具箱》（Kimball 著作中文版）
- 阿里巴巴数据中台实践
- 各大云厂商文档

### 推荐术语对照表

| 英文术语 | 推荐中文 | 备选 | 说明 |
|----------|----------|------|------|
| Dimension | 维度 | - | 统一使用 |
| Fact | 事实 | - | 统一使用 |
| Measure | 度量/指标 | 度量值 | 数值型字段 |
| Grain | 粒度 | - | 事实表最细级别 |
| Surrogate Key | 代理键 | 替代键 | 系统生成的唯一标识 |
| Natural Key | 自然键 | 业务键 | 业务系统原有标识 |
| Slowly Changing Dimension | 缓慢变化维 | SCD | 可简写为 SCD |
| Conformed Dimension | 一致性维度 | 公共维度 | 跨事实表共享 |
| Degenerate Dimension | 退化维度 | - | 存储在事实表中的维度 |
| Star Schema | 星型模型 | 星型架构 | 事实表为中心 |
| Snowflake Schema | 雪花模型 | 雪花架构 | 维度表规范化 |
| ETL | ETL | 抽取-转换-加载 | 通常不翻译 |
| Incremental | 增量 | - | 增量加载 |
| Full Refresh | 全量刷新 | 全量重建 | - |

### 分层术语

| 英文/缩写 | 中文全称 | 说明 |
|-----------|----------|------|
| ODS | 操作数据存储/贴源层 | Operational Data Store |
| DWD | 数据明细层 | Data Warehouse Detail |
| DWS | 数据服务层/汇总层 | Data Warehouse Service/Summary |
| ADS | 数据应用层 | Application Data Service |
| DIM | 公共维度层 | Dimension |

### 项目内术语规范建议

在提示系统中，建议：
1. 创建 `glossary.md` 术语表文件
2. 在提示模板中统一使用推荐中文术语
3. 首次出现时标注英文原文：「维度（Dimension）」
4. 缩写（如 SCD、ETL）可直接使用，无需翻译

**置信度：** MEDIUM（基于行业惯例，非官方标准）

---

## 安装指南

### 基础安装

```bash
# 创建虚拟环境
python -m venv dbt-env
source dbt-env/bin/activate

# 安装 dbt-core 和 dbt-hive
pip install dbt-core dbt-hive

# 验证安装
dbt --version
```

### dbt 项目初始化

```bash
# 创建新项目
dbt init my_warehouse

# 配置 profiles.yml（示例）
```

### profiles.yml 配置示例

```yaml
my_warehouse:
  target: dev
  outputs:
    dev:
      type: hive
      host: your-hive-server.example.com
      port: 10000
      schema: dev_warehouse
      auth_type: ldap
      user: your_username
      password: "{{ env_var('DBT_HIVE_PASSWORD') }}"
      use_ssl: true
      use_http_transport: false  # 使用 Binary 传输
      usage_tracking: false
```

### packages.yml 配置

```yaml
packages:
  - package: dbt-labs/dbt_utils
    version: [">=1.0.0", "<2.0.0"]
  - package: calogica/dbt_expectations
    version: [">=0.10.0", "<0.11.0"]
  - package: dbt-labs/codegen
    version: [">=0.12.0", "<0.13.0"]
```

```bash
# 安装 packages
dbt deps
```

---

## 替代方案对比

| 维度 | dbt-hive | dbt-spark | 直接 HiveQL |
|------|----------|-----------|-------------|
| 适用场景 | Hive 原生环境 | Spark on Hive | 简单任务/遗留系统 |
| 版本化 | 支持（Git） | 支持（Git） | 手动管理 |
| 测试能力 | dbt tests | dbt tests | 需自建 |
| 文档生成 | 支持 | 支持 | 无 |
| 增量加载 | append/insert_overwrite | merge/append | 手动编写 |
| Snapshots | 不支持 | 支持 | 手动编写 |
| 维护方 | Cloudera | Databricks | Apache |
| 社区活跃度 | 中等 | 高 | 高 |

**推荐：** 如果目标平台是 Hive，使用 dbt-hive；如果是 Spark/Databricks，考虑 dbt-spark。

---

## 置信度总结

| 领域 | 置信度 | 原因 |
|------|--------|------|
| dbt-hive 版本 | HIGH | 官方 PyPI + GitHub 验证 |
| dbt-hive 功能边界 | HIGH | 官方文档明确说明 |
| Hive 版本推荐 | HIGH | Apache 官方发布 |
| ACID 配置要求 | HIGH | Apache 文档 + 多源验证 |
| dbt 项目结构 | HIGH | dbt Labs 官方最佳实践 |
| 分层映射 | MEDIUM | 行业惯例，非官方标准 |
| 中文术语 | MEDIUM | 无官方标准，基于行业惯例 |
| dbt packages 推荐 | MEDIUM | dbt Hub + 社区实践 |

---

## 开放问题

以下问题在后续阶段可能需要深入研究：

1. **Kerberos 集成：** 具体 kinit 配置步骤取决于企业环境
2. **性能调优：** 大规模数据下的 Compaction 策略需要实测
3. **CI/CD 集成：** dbt Cloud vs 自建 Airflow/Jenkins 的选择
4. **元数据管理：** Hive Metastore vs Unity Catalog vs 其他方案

---

## 来源

### 官方文档（HIGH 置信度）
- [dbt-hive GitHub](https://github.com/cloudera/dbt-hive)
- [dbt Hive Setup](https://docs.getdbt.com/docs/core/connect-data-platform/hive-setup)
- [dbt Hive Configs](https://docs.getdbt.com/reference/resource-configs/hive-configs)
- [Apache Hive 官网](https://hive.apache.org/)
- [Hive Transactions Wiki](https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions)
- [dbt 项目结构最佳实践](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview)
- [dbt Kimball 维度建模](https://docs.getdbt.com/blog/kimball-dimensional-model)
- [dbt Hub](https://hub.getdbt.com/)
- [PyPI dbt-hive](https://pypi.org/project/dbt-hive/)

### 行业实践（MEDIUM 置信度）
- [阿里云数仓分层指南](https://www.alibabacloud.com/help/en/dataworks/user-guide/data-warehouse-layering)
- [Apache Doris 数仓架构](https://doris.apache.org/blog/For-Entry-Level-Data-Engineers-How-to-Build-a-Simple-but-Solid-Data-Architecture/)
- [dbt Kimball 实践教程](https://github.com/Data-Engineer-Camp/dbt-dimensional-modelling)

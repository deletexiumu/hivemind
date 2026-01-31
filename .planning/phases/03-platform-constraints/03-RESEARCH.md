# Phase 03: 平台约束库 - Research

**Researched:** 2026-01-31
**Domain:** Hive 3.x 平台约束 + dbt-hive 能力边界 + T+1 增量策略
**Confidence:** HIGH

## Summary

本阶段研究了 Hive 3.x + dbt-hive 平台的能力边界、约束与最佳实践。研究覆盖三个核心领域：Hive 平台约束（分区策略、ORC 存储格式、ACID vs 非 ACID）、dbt-hive 适配器限制（不支持 Snapshots/Ephemeral、分区列必须在 SELECT 末尾）、以及增量策略（insert_overwrite、T+1 回刷模式）。

研究发现，dbt-hive 存在明确的功能限制：**不支持 Snapshots**（需用自定义增量模型实现 SCD Type 2）、**不支持 Ephemeral 物化**（用 View 替代）、**分区列必须作为 SELECT 最后一列**。Hive 3.x 非 ACID 模式下，MERGE 语句不可用，增量更新必须依赖 INSERT OVERWRITE 分区回刷。ORC 格式是首选存储格式，分区大小应保持 >= 1GB，避免小文件问题。

**Primary recommendation:** 按风险等级（P0/P1/P2）组织约束文档，P0 约束违反会导致数据错误或执行失败，每个约束使用统一模板（名称 → 原因 → 规避方案 → 正/反示例）。

## Standard Stack

本阶段是文档化工作，不涉及编程库。以下是约束文档涉及的技术栈：

### Core

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Hive | 3.x | 数仓查询引擎 | 用户环境确定，非 ACID 模式为主 |
| dbt-hive | 1.10.x | dbt Hive 适配器 | Cloudera 维护，dbt-core 1.10.x 兼容 |
| ORC | Hive 内置 | 列式存储格式 | Hive 官方推荐，支持谓词下推、Bloom Filter |
| dbt-core | 1.10.x | dbt 核心框架 | 与 dbt-hive 1.10.x 配套 |

### Supporting

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Snappy/Zlib | ORC 默认 | ORC 压缩算法 | Snappy 速度优先，Zlib 压缩率优先 |
| Tez | Hive 默认 | 执行引擎 | 所有 Hive 查询（非 MR） |

### Version Compatibility Matrix

| dbt-hive | dbt-core | Python | 备注 |
|----------|----------|--------|------|
| 1.10.x | 1.10.x | >= 3.9 | 当前版本 |
| 1.7.x | 1.7.x | >= 3.8 | 稳定版本 |
| 1.4.x | 1.4.x | >= 3.8 | Iceberg 支持引入 |

## Architecture Patterns

### Recommended Document Structure

平台约束文档采用按风险等级组织的结构：

```
context/platform/
├── index.md                      # 约束索引（汇总表 + 快速定位）
├── hive-constraints.md           # PLATFORM-01: Hive 平台约束
├── dbt-hive-limitations.md       # PLATFORM-02: dbt-hive 能力边界
└── incremental-strategies.md     # PLATFORM-03: 增量策略
```

### Pattern 1: 约束文档统一模板

**What:** 每个约束的标准呈现格式
**When to use:** 所有 P0/P1/P2 约束条目
**Template:**

```markdown
### [P0/P1/P2] 约束名称

**约束 ID:** HIVE-001 / DBT-HIVE-001 / INCR-001

**原因:** 为什么存在这个约束（技术原理）

**违反后果:** 会导致什么问题（数据错误/执行失败/性能下降）

**规避方案:**
1. 步骤 1
2. 步骤 2

**示例:**

❌ **错误写法:**
```sql
-- 示例代码
```

✓ **正确写法:**
```sql
-- 示例代码
```
```

### Pattern 2: 风险等级定义

**What:** 约束优先级分类
**When to use:** 所有约束文档条目

| 等级 | 含义 | 违反后果 | 示例 |
|------|------|---------|------|
| **P0** | 必须遵守 | 数据错误或执行失败 | dbt-hive 不支持 Snapshots |
| **P1** | 强烈建议 | 性能严重下降或维护困难 | 分区大小 < 1GB |
| **P2** | 可选优化 | 不影响正确性，但有改进空间 | Bloom Filter 配置 |

### Pattern 3: 首页汇总表格式

**What:** 约束索引页的快速查阅表
**When to use:** 每个约束文档首页
**Format:**

```markdown
## 约束速查表

| ID | 约束名称 | 等级 | 一句话说明 | 详情 |
|----|---------|------|-----------|------|
| HIVE-001 | 分区列不能 UPDATE | P0 | 非 ACID 表不支持 UPDATE | [详情](#hive-001) |
| DBT-HIVE-001 | 不支持 Snapshots | P0 | 用增量模型替代 | [详情](#dbt-hive-001) |
```

### Anti-Patterns to Avoid

- **仅列约束不解释原因:** 缺少"为什么"，用户难以理解和记忆
- **只有正确写法没有错误示例:** 用户无法识别自己是否犯错
- **约束描述过于抽象:** "注意分区设计"不如"分区大小应 >= 1GB"
- **多个约束混在一起:** 每个约束独立条目，便于查阅和引用

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SCD Type 2 历史追溯 | 手写复杂 MERGE 逻辑 | 自定义增量模型 + effective_start/end | dbt-hive 不支持 Snapshots，MERGE 需要 ACID 表 |
| 分区数据替换 | DELETE + INSERT | INSERT OVERWRITE PARTITION | 非 ACID 表不支持 DELETE |
| 临时表/CTE 替代 | 手动管理临时表 | View 物化 | dbt-hive 不支持 Ephemeral |
| 小文件合并 | 手写脚本 | ALTER TABLE CONCATENATE | Hive 原生支持 ORC 文件合并 |
| 分区裁剪优化 | 手动拆分 SQL | 标准分区 WHERE 条件 | Hive 自动分区裁剪 |

**Key insight:** Hive 非 ACID + dbt-hive 限制意味着很多"常规" dbt 操作无法直接使用，必须用分区回刷模式替代行级操作。

## Common Pitfalls

### Pitfall 1: dbt-hive 分区列位置错误

**What goes wrong:** 模型执行失败，Hive 报错 "partition column must be last"
**Why it happens:** Hive 要求动态分区列必须作为 SELECT 语句的最后一列，顺序必须与 PARTITION 子句一致
**How to avoid:**
- 将 `partition_by` 中指定的列放在 SELECT 末尾
- 多分区列时按 PARTITION 子句顺序排列
**Warning signs:** Hive 报错包含 "partition" 关键字

```sql
-- ❌ 错误：分区列 dt 不在末尾
SELECT id, dt, name FROM source

-- ✓ 正确：分区列 dt 在末尾
SELECT id, name, dt FROM source
```

### Pitfall 2: INSERT OVERWRITE 不带分区导致全表覆盖

**What goes wrong:** 全表数据被覆盖，只剩下本次插入的数据
**Why it happens:** INSERT OVERWRITE 不带 PARTITION 子句时覆盖整张表
**How to avoid:**
- 始终使用 `PARTITION (dt)` 子句
- dbt 模型配置 `partition_by` 参数
**Warning signs:** 查询历史数据返回空

```sql
-- ❌ 危险：覆盖全表
INSERT OVERWRITE TABLE target SELECT * FROM source

-- ✓ 安全：只覆盖指定分区
INSERT OVERWRITE TABLE target PARTITION (dt)
SELECT id, name, dt FROM source
```

### Pitfall 3: 尝试在非 ACID 表使用 MERGE

**What goes wrong:** 执行失败，Hive 报错 "MERGE requires ACID table"
**Why it happens:** MERGE 语句仅支持 ACID 事务表（ORC 格式 + transactional=true）
**How to avoid:**
- 使用 INSERT OVERWRITE 分区回刷替代 MERGE
- 如需行级更新，将表转为 ACID 表（权衡性能开销）
**Warning signs:** SQL 包含 MERGE 关键字 + 目标表是外部表或非 ACID 管理表

### Pitfall 4: 分区过多导致 NameNode 压力

**What goes wrong:** HDFS 元数据膨胀，查询变慢，NameNode 内存告警
**Why it happens:** 每个分区在 HDFS 是独立目录，过多分区（如按 user_id 分区）消耗 NameNode 内存
**How to avoid:**
- 分区列选择低基数字段（日期、地区）
- 避免按唯一 ID 分区
- 查询尽量不超过 1000 个分区
**Warning signs:** 查询日志显示扫描分区数过多，NameNode 内存使用率高

### Pitfall 5: ORC 小文件问题

**What goes wrong:** 查询性能下降，大量小文件（<128MB）
**Why it happens:** 频繁小批量写入、Reducer 数量过多
**How to avoid:**
- 定期执行 `ALTER TABLE ... CONCATENATE`
- 配置 `hive.merge.smallfiles.avgsize`
- 合理设置 Reducer 数量
**Warning signs:** 单分区文件数过多，平均文件大小远小于 HDFS 块大小

### Pitfall 6: dbt-hive 使用 Snapshots 物化

**What goes wrong:** dbt 执行报错，模型无法创建
**Why it happens:** dbt-hive 不支持 Snapshots 物化类型
**How to avoid:**
- 使用自定义增量模型实现 SCD Type 2
- 参考 Phase 02 SCD 策略文档的替代方案
**Warning signs:** dbt 项目配置包含 `materialized='snapshot'` 或 snapshots/ 目录

### Pitfall 7: dbt-hive 使用 Ephemeral 物化

**What goes wrong:** dbt 执行报错
**Why it happens:** dbt-hive 不支持 Ephemeral 物化（CTE 内联）
**How to avoid:**
- 使用 View 物化替代
- 将逻辑拆分为独立模型
**Warning signs:** dbt 模型配置 `materialized='ephemeral'`

## Code Examples

### Example 1: dbt-hive 增量模型配置（INSERT OVERWRITE）

```sql
-- Source: dbt-hive official docs
{{ config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],
    file_format='orc'
) }}

SELECT
    order_id,
    customer_id,
    order_amount,
    -- 分区列必须在最后
    dt
FROM {{ source('ods', 'orders') }}
{% if is_incremental() %}
WHERE dt = '{{ var("run_date") }}'
{% endif %}
```

### Example 2: 非 ACID 表的 T+1 增量更新模式

```sql
-- 场景：订单表按日期分区，每日回刷当天数据
-- Source: Hive DML Best Practices

-- Step 1: 配置动态分区
SET hive.exec.dynamic.partition.mode=nonstrict;
SET hive.exec.dynamic.partition=true;

-- Step 2: INSERT OVERWRITE 覆盖指定分区
INSERT OVERWRITE TABLE dwd_fact_order PARTITION (dt)
SELECT
    order_id,
    customer_id,
    order_amount,
    order_status,
    '{{ run_date }}' as dt  -- 分区列在末尾
FROM ods_order
WHERE dt = '{{ run_date }}';
```

### Example 3: SCD Type 2 无 Snapshots 实现（dbt-hive）

```sql
-- Source: Phase 02 SCD Strategies + dbt Community
{{ config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['is_current'],
    unique_key='customer_sk'
) }}

WITH source AS (
    SELECT * FROM {{ source('ods', 'customer') }}
    WHERE dt = '{{ var("run_date") }}'
),

existing AS (
    SELECT * FROM {{ this }}
    WHERE is_current = 1
),

-- 检测变更
changes AS (
    SELECT
        s.*,
        e.customer_sk AS existing_sk,
        CASE
            WHEN e.customer_id IS NULL THEN 'INSERT'
            WHEN s.customer_name != e.customer_name
                 OR s.customer_address != e.customer_address THEN 'UPDATE'
            ELSE 'UNCHANGED'
        END AS change_type
    FROM source s
    LEFT JOIN existing e ON s.customer_id = e.customer_id
),

-- 生成新版本记录
final AS (
    -- 保留未变更的当前记录
    SELECT * FROM existing
    WHERE customer_id NOT IN (
        SELECT customer_id FROM changes WHERE change_type = 'UPDATE'
    )

    UNION ALL

    -- 关闭变更记录的旧版本
    SELECT
        customer_sk,
        customer_id,
        customer_name,
        customer_address,
        effective_start,
        '{{ run_date }}' AS effective_end,
        0 AS is_current
    FROM existing
    WHERE customer_id IN (
        SELECT customer_id FROM changes WHERE change_type = 'UPDATE'
    )

    UNION ALL

    -- 插入新记录和新版本
    SELECT
        ROW_NUMBER() OVER () + COALESCE(MAX(customer_sk) OVER (), 0) AS customer_sk,
        customer_id,
        customer_name,
        customer_address,
        '{{ run_date }}' AS effective_start,
        '9999-12-31' AS effective_end,
        1 AS is_current
    FROM changes
    WHERE change_type IN ('INSERT', 'UPDATE')
)

SELECT * FROM final
```

### Example 4: ORC 小文件合并

```sql
-- Source: Hive ORC Documentation
-- 合并小文件，在 stripe 级别合并，无需解压
SET hive.merge.tezfiles=true;
SET hive.execution.engine=tez;
SET hive.merge.mapredfiles=true;
SET hive.merge.size.per.task=256000000;  -- 256MB

ALTER TABLE dwd_fact_order PARTITION (dt='2026-01-31') CONCATENATE;
```

### Example 5: 分区大小检查脚本

```sql
-- 检查分区文件大小分布
SELECT
    INPUT__FILE__NAME,
    COUNT(*) as record_count
FROM dwd_fact_order
WHERE dt = '2026-01-31'
GROUP BY INPUT__FILE__NAME
ORDER BY record_count DESC;

-- 检查分区数量
SHOW PARTITIONS dwd_fact_order;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| dbt Snapshots | 自定义增量模型 | dbt-hive 持续限制 | 必须用增量模型实现 SCD2 |
| MERGE 语句 | INSERT OVERWRITE | Hive 非 ACID 限制 | 行级更新需转为分区回刷 |
| Ephemeral 物化 | View 物化 | dbt-hive 不支持 | CTE 逻辑用 View 替代 |
| Text/Sequence 格式 | ORC 格式 | Hive 3.x 推荐 | ORC 成为 Hive 首选格式 |
| 静态分区 | 动态分区 | Hive 3.0+ 增强 | 自动推断分区规格 |

**Deprecated/outdated:**
- Hive 2.x ACID 限制（需要 bucketing）：Hive 3.x 已移除此限制
- MR 执行引擎：已被 Tez 替代，ACID 操作不支持 MR
- 手动 bucketing 设计：Hive 3.x ACID 表不再强制 bucketing

## Hive 3.x 约束速查

### 分区约束

| 约束 | 等级 | 说明 |
|------|------|------|
| 分区大小 >= 1GB | P1 | 小分区导致元数据膨胀和随机 IO |
| 查询分区数 <= 1000 | P1 | 过多分区影响性能 |
| 分区列低基数 | P1 | 高基数列（如 user_id）不适合分区 |
| 动态分区列在 SELECT 末尾 | P0 | Hive 语法要求 |

### ORC 约束

| 约束 | 等级 | 说明 |
|------|------|------|
| 避免小文件 (<128MB) | P1 | 影响查询性能，增加 NameNode 压力 |
| 定期合并小文件 | P1 | 使用 CONCATENATE 或配置自动合并 |
| Bloom Filter 用于点查 | P2 | 高频点查列可配置 Bloom Filter |

### ACID 约束

| 约束 | 等级 | 说明 |
|------|------|------|
| MERGE 仅支持 ACID 表 | P0 | 非 ACID 表用 INSERT OVERWRITE |
| UPDATE/DELETE 仅支持 ACID 表 | P0 | 非 ACID 表无法行级更新 |
| ACID 表不支持 INSERT OVERWRITE | P0 | ACID 表用 TRUNCATE + INSERT |
| ACID 表性能开销 | P1 | 高并发场景需评估 |

## dbt-hive 约束速查

| 约束 | 等级 | 说明 | 替代方案 |
|------|------|------|---------|
| 不支持 Snapshots | P0 | 物化类型限制 | 自定义增量模型 + SCD2 逻辑 |
| 不支持 Ephemeral | P0 | 物化类型限制 | 使用 View 物化 |
| 分区列必须在 SELECT 末尾 | P0 | Hive 语法要求 | 调整列顺序 |
| insert_overwrite 需配合分区 | P0 | 否则全表覆盖 | 始终指定 partition_by |
| Kerberos 仅支持 Unix | P1 | 平台限制 | Windows 使用 LDAP |
| ACID 表不支持分区列更新 | P0 | Hive 限制 | 重建分区 |

## Open Questions

### 1. ACID 表在特定场景的性能表现

**What we know:** Hive 3.x ACID 表性能改进明显，低并发场景可用
**What's unclear:** 具体工作负载下 ACID vs 非 ACID 的性能差异
**Recommendation:** 文档标注"根据实际环境评估"，不做绝对推荐

### 2. dbt-hive 未来版本的功能支持

**What we know:** Cloudera 活跃维护，跟进 dbt-core 版本
**What's unclear:** Snapshots/Ephemeral 是否会在未来版本支持
**Recommendation:** 文档标注当前版本限制，定期检查更新

### 3. Iceberg 表格式的完整约束

**What we know:** dbt-hive 1.4.0+ 支持 Iceberg，有独立的约束
**What's unclear:** Iceberg 与 ACID 表的约束差异细节
**Recommendation:** 本阶段聚焦 ORC 非 ACID，Iceberg 约束可作为补充章节

## Sources

### Primary (HIGH confidence)
- [dbt-hive Official Documentation](https://docs.getdbt.com/reference/resource-configs/hive-configs) - 增量策略、分区配置
- [dbt-hive GitHub Repository](https://github.com/cloudera/dbt-hive) - 功能支持矩阵、已知限制
- [Cloudera Hive Setup](https://docs.getdbt.com/docs/core/connect-data-platform/hive-setup) - 版本兼容、权限要求
- [Hive Language Manual DML](https://cwiki.apache.org/confluence/display/hive/languagemanual+dml) - INSERT OVERWRITE、MERGE 语法
- [Hive Transactions](https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions) - ACID 约束、MERGE 要求

### Secondary (MEDIUM confidence)
- [Cloudera HDP Performance Tuning](https://docs-archive.cloudera.com/HDPDocuments/HDP3/HDP-3.1.4/performance-tuning/content/hive_maximize_storage_resources_using_orc.html) - ORC 优化
- [Cloudera Partitioning Guide](https://docs-archive.cloudera.com/HDPDocuments/HDP3/HDP-3.0.0/performance-tuning/content/hive_improving_performance_using_partitions.html) - 分区最佳实践
- [SparkCodeHub Partition Best Practices](https://www.sparkcodehub.com/hive/partitions/partition-best-practices) - 分区设计指南
- [dbt Community SCD2 Discussion](https://discourse.getdbt.com/t/how-to-implement-scd-type-2-without-using-snapshot/4346) - 无 Snapshots 的 SCD2 实现

### Tertiary (LOW confidence)
- [Medium: Compaction in Hive](https://medium.com/datakaresolutions/compaction-in-hive-97a1d072400f) - 小文件合并实践
- [Medium: Partitioning vs Bucketing](https://medium.com/@mdburkee/explain-partitioning-and-bucketing-in-hive-how-does-it-affect-query-performance-cc34ee3bf71f) - 分区 vs 分桶选型

## Metadata

**Confidence breakdown:**
- dbt-hive 限制: HIGH - 基于官方 GitHub 和文档
- Hive 分区约束: HIGH - 基于 Cloudera 官方文档
- ORC 优化: MEDIUM - 部分来自社区最佳实践
- 增量策略: HIGH - 基于 dbt 官方文档
- ACID 约束: HIGH - 基于 Apache Hive 官方 Wiki

**Research date:** 2026-01-31
**Valid until:** 2026-03-31（60 天，平台约束相对稳定）

---

*Phase: 03-platform-constraints*
*Research completed: 2026-01-31*

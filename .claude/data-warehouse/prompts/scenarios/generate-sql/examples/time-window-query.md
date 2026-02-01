---
type: example
scenario: generate-sql
domain: e-commerce
complexity: complex
query_type: insert-overwrite
joins: 1
aggregations: true
scd2: false
time_window: rolling-30d
---

# 案例：时间窗口查询（用户订单趋势落表）

## 输入

```
帮我计算每个用户最近 30 天的订单趋势，按天聚合，需要落表到 ads.ads_user_order_trend。
需要支持每天回刷，保证幂等性。
```

---

## Stage 1 输出：取数需求理解确认

### 业务目标

- **取数目的：** 用户订单趋势分析（每日订单数、金额）
- **输出粒度：** 一行 = 一个用户 + 一天
- **输出形态：** INSERT OVERWRITE（落表）
- **目标表：** `ads.ads_user_order_trend`（分区表，按 dt）
- **幂等策略：** 每日覆盖写入当天分区，可重复执行

### 数据源

| 表名 | 类型 | 作用 | 关键字段 |
|------|------|------|----------|
| `dwd.dwd_fact_order_header` | 主表 | 订单事实表 | `customer_id`, `order_amt`, `order_time`, `dt` |
| `dwd.dim_date` | 维表 | 日期维度 | `date_key`, `full_date`, `day_of_week` |

### 分区与时间

- **分区字段（源表）：** `dt`（string 类型，格式 `yyyy-MM-dd`）
- **分区字段（目标表）：** `dt`（string 类型，格式 `yyyy-MM-dd`）
- **分区范围：** 最近 30 天（`DATE_SUB(CURRENT_DATE, 30)` ~ `DATE_SUB(CURRENT_DATE, 1)`）
- **时间字段（业务口径）：** `order_time`（订单创建时间）
- **时间表达：** 动态计算（滚动 30 天窗口）
- **分区覆盖策略：** 覆盖目标表最近 30 天分区

### 过滤条件

- **业务过滤：** `order_status IN ('completed', 'delivered')`（有效订单）
- **质量过滤：** `is_deleted = 0`
- **口径定义：** 有效订单 = 已完成或已发货

### SCD2 语义（如有维表）

- **不涉及：** 日期维表为 Type 0（静态），无 SCD 处理

### 计算逻辑

- **聚合方式：** `COUNT(*)` 订单数、`SUM(order_amt)` 订单金额、`AVG(order_amt)` 平均客单价
- **分组维度：** `customer_id`, `dt`
- **异常处理：** NULL 金额计为 0（`COALESCE(order_amt, 0)`）

---

请确认以上理解是否正确，或补充/修正信息后，回复"**生成**"获取完整 SQL。

---

## Stage 2 输出：完整产物

### 1. 生成的 SQL（带中文注释）

### File: queries/ads_user_order_trend_insert.sql

```sql
-- ===============================================
-- 查询名称：ads_user_order_trend_insert
-- 生成时间：{{ CURRENT_TIMESTAMP }}
-- 口径版本：v1.0
-- 执行方式：INSERT OVERWRITE（幂等，可重复执行）
-- ===============================================

-- 取数口径：
-- 1. 从订单主表读取最近 30 天有效订单
-- 2. 按用户 + 日期粒度聚合订单数和金额
-- 3. 关联日期维表获取日期属性
-- 4. INSERT OVERWRITE 覆盖目标表对应分区

-- 幂等性说明：
-- 每次执行覆盖 dt 分区，同一 dt 多次执行结果一致
-- 分区范围：最近 30 天（不含今天，T+1 场景）

INSERT OVERWRITE TABLE ads.ads_user_order_trend
PARTITION (dt)
SELECT
    -- 维度字段
    o.customer_id,                                     -- 用户 ID
    d.day_of_week,                                     -- 星期几（1-7）
    d.is_weekend,                                      -- 是否周末

    -- 度量字段
    COUNT(*) AS order_cnt,                             -- 订单数
    SUM(COALESCE(o.order_amt, 0)) AS total_order_amt,  -- 订单金额汇总
    AVG(COALESCE(o.order_amt, 0)) AS avg_order_amt,    -- 平均客单价

    -- 元数据
    CURRENT_TIMESTAMP AS etl_time,                     -- ETL 时间

    -- 分区字段（必须放最后）
    o.dt                                               -- 日期分区

FROM dwd.dwd_fact_order_header o

-- 关联日期维表
LEFT JOIN dwd.dim_date d
    ON o.dt = d.full_date

WHERE 1=1
    -- 分区过滤（最近 30 天，不含今天）
    AND o.dt >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, 30), 'yyyy-MM-dd')
    AND o.dt <  DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd')

    -- 业务过滤（有效订单）
    AND o.order_status IN ('completed', 'delivered')

    -- 质量过滤
    AND o.is_deleted = 0

GROUP BY
    o.customer_id,
    d.day_of_week,
    d.is_weekend,
    o.dt

-- 分布优化：按分区分发数据
DISTRIBUTE BY dt
;
```

---

### 2. 自检结果（Validator）

#### P0（阻断）

- [x] V-P0-01 分区过滤缺失：**通过** — 已包含 `o.dt >= ... AND o.dt < ...` 分区谓词
- [x] V-P0-02 分区谓词不可裁剪：**通过** — 使用 `DATE_FORMAT(DATE_SUB(...))` 生成常量比较
- [x] V-P0-03 分区类型不匹配：**通过** — dt 为 string 类型，谓词格式为 `yyyy-MM-dd`
- [x] V-P0-04 笛卡尔积风险：**通过** — 所有 JOIN 均有明确 ON 条件
- [x] V-P0-05 Hive 不支持：**通过** — `INSERT OVERWRITE PARTITION (dt)` 为 Hive 3.x 标准语法

#### P1（警告）

- [x] V-P1-01 JOIN 放大风险：**通过** — 日期维表 full_date 唯一，无放大
- [x] V-P1-02 SCD2 语义未锁定：**不涉及** — 日期维表为静态维度
- [x] V-P1-03 聚合一致性风险：**通过** — GROUP BY 包含所有非聚合字段
- [x] V-P1-04 时间口径不一致：**通过** — 分区 dt 与业务时间 order_time 日期一致

#### P2（提示）

- [x] V-P2-01 可运行性：**通过** — INSERT OVERWRITE 幂等可重复执行
- [ ] V-P2-02 性能建议：**提示** — 30 天分区跨度较大，建议监控执行时间

#### 修复建议（可复制片段）

```sql
-- 无 P0/P1 问题需修复

-- P2 性能优化：如仅需回刷部分日期，可缩小分区范围
-- 例如：仅回刷最近 7 天
AND o.dt >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, 7), 'yyyy-MM-dd')
AND o.dt <  DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd')
```

---

### 3. 口径说明

#### 1. 计算步骤

1. 从 `dwd.dwd_fact_order_header` 读取最近 30 天（动态滚动窗口）分区数据
2. 按 `order_status IN ('completed', 'delivered')` 筛选有效订单
3. 关联 `dwd.dim_date` 获取日期属性（星期、周末标识）
4. 按 `customer_id, dt` 粒度聚合订单数、金额
5. INSERT OVERWRITE 覆盖 `ads.ads_user_order_trend` 对应分区

#### 2. 数据源

| 表名 | 作用 | 关键字段 |
|------|------|----------|
| `dwd.dwd_fact_order_header` | 订单事实表 | `customer_id`, `order_amt`, `order_status`, `dt` |
| `dwd.dim_date` | 日期维度 | `full_date`, `day_of_week`, `is_weekend` |

#### 3. 假设和限制

- **数据新鲜度：** T+1 更新，最新分区为昨天
- **已排除的数据：** 非有效状态订单、is_deleted=1
- **SCD 处理：** 不涉及
- **边界情况：** 用户无订单的日期不出现在结果中
- **幂等性：** INSERT OVERWRITE 按 dt 分区覆盖，同一 dt 多次执行结果一致

#### 4. 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-02-01 | 初始版本 |

---

### 4. 性能提示

#### 风险识别

| 风险项 | 严重度 | 说明 |
|--------|--------|------|
| 分区跨度 | 中-高 | 扫描 30 天分区，数据量较大 |
| JOIN 放大 | 低 | 日期维表小表广播 |
| 聚合成本 | 中 | 按用户+日期聚合，粒度细 |

#### 优化建议

1. **缩小回刷窗口（日常增量场景）**
   ```sql
   -- 日常增量：仅刷昨天
   AND o.dt = DATE_FORMAT(DATE_SUB(CURRENT_DATE, 1), 'yyyy-MM-dd')
   ```

2. **使用 DISTRIBUTE BY 优化写入**
   ```sql
   -- 已包含：确保同一分区数据发往同一 reducer
   DISTRIBUTE BY dt
   ```

3. **分批回刷（首次全量场景）**
   ```sql
   -- 如需回刷更长历史，分批执行避免 OOM
   -- 批次 1: dt >= '2026-01-01' AND dt < '2026-01-11'
   -- 批次 2: dt >= '2026-01-11' AND dt < '2026-01-21'
   -- ...
   ```

#### 资源估算

- **预估扫描数据量：** 30 天订单数据 + 日期维表（小表）
- **预估执行时间：** 分钟级 ~ 10 分钟（取决于日订单量）
- **建议执行队列：** etl / batch

---

### 5. 依赖说明

#### 表依赖

| 表名 | 层级 | 更新频率 | 分区策略 |
|------|------|----------|----------|
| `dwd.dwd_fact_order_header` | DWD | T+1 | dt (yyyy-MM-dd) |
| `dwd.dim_date` | DWD | 静态 | 无分区（预生成全量） |
| `ads.ads_user_order_trend` | ADS | T+1 | dt (yyyy-MM-dd) |

#### 字段依赖

| 输出字段 | 来源表 | 来源字段 | 转换逻辑 |
|----------|--------|----------|----------|
| `customer_id` | `dwd_fact_order_header` | `customer_id` | 直接输出 |
| `day_of_week` | `dim_date` | `day_of_week` | 直接输出 |
| `is_weekend` | `dim_date` | `is_weekend` | 直接输出 |
| `order_cnt` | `dwd_fact_order_header` | `*` | COUNT |
| `total_order_amt` | `dwd_fact_order_header` | `order_amt` | SUM(COALESCE) |
| `avg_order_amt` | `dwd_fact_order_header` | `order_amt` | AVG(COALESCE) |
| `dt` | `dwd_fact_order_header` | `dt` | 直接输出（分区字段） |

#### 外键关系

| 事实表字段 | 维表 | 维表字段 | JOIN 类型 |
|------------|------|----------|-----------|
| `dt` | `dim_date` | `full_date` | LEFT JOIN |

---

### File: models/ads/ads_user_order_trend.yml

```yaml
version: 2

models:
  - name: ads_user_order_trend
    description: 用户订单趋势表 - 粒度：用户 + 日期
    meta:
      layer: ads
      grain: "用户 + 日期 = 一行"
      update_strategy: insert_overwrite
      partition_by: dt

    columns:
      - name: customer_id
        description: 用户 ID
        tests: [not_null]

      - name: dt
        description: 日期分区（yyyy-MM-dd）
        tests: [not_null]

      - name: order_cnt
        description: 订单数
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0

      - name: total_order_amt
        description: 订单金额汇总
        meta: { additivity: additive }

      - name: avg_order_amt
        description: 平均客单价
        meta: { additivity: non_additive }

    tests:
      - unique:
          column_name: "customer_id || '|' || dt"
```

---

## 案例要点

**关键决策点：**
- INSERT OVERWRITE + PARTITION (dt) 实现幂等性覆盖写入
- 双重时间过滤：分区 dt 控制扫描范围 + 业务 order_status 控制数据质量
- 滚动窗口使用 `DATE_SUB(CURRENT_DATE, 30)` 动态计算

**适用场景：**
- 用户/商品/渠道趋势分析
- T+1 定时任务落表
- 需要回刷历史的增量场景

**注意事项：**
- INSERT OVERWRITE 按分区覆盖，确保同一 dt 幂等
- 分区字段必须放在 SELECT 最后
- DISTRIBUTE BY dt 优化分区写入性能
- 30 天窗口较大，首次执行注意资源消耗
- 日常增量可缩小分区范围提升效率

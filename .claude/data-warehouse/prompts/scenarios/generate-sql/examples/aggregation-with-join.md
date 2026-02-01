---
type: example
scenario: generate-sql
domain: e-commerce
complexity: medium
query_type: select
joins: 2
aggregations: true
scd2: true
---

# 案例：聚合 + JOIN（VIP 用户消费统计）

## 输入

```
帮我统计上月 VIP 用户的消费金额，按城市聚合。
需要用户的当前会员等级和所在城市信息。
```

---

## Stage 1 输出：取数需求理解确认

### 业务目标

- **取数目的：** 分析上月 VIP 用户消费分布（按城市维度）
- **输出粒度：** 一行 = 一个城市
- **输出形态：** SELECT（分析查询）

### 数据源

| 表名 | 类型 | 作用 | 关键字段 |
|------|------|------|----------|
| `dwd.dwd_fact_order_header` | 主表 | 订单事实表 | `order_amt`, `customer_id`, `dt` |
| `dwd.dim_customer` | 维表 | 客户维度（SCD2） | `customer_id`, `customer_level`, `is_current` |
| `dwd.dim_city` | 维表 | 城市维度 | `city_id`, `city_name` |

### 分区与时间

- **分区字段：** `dt`（string 类型，格式 `yyyy-MM-dd`）
- **分区范围：** 上月整月（`ADD_MONTHS(TRUNC(CURRENT_DATE, 'MM'), -1)` ~ `TRUNC(CURRENT_DATE, 'MM')`）
- **时间字段（业务口径）：** `order_time`（订单创建时间）
- **时间表达：** 动态计算（上月整月）

### 过滤条件

- **业务过滤：** `order_status = 'completed'`（仅统计已完成订单）
- **质量过滤：** `is_deleted = 0`
- **口径定义：** VIP 用户 = `customer_level = 'VIP'`

### SCD2 语义（如有维表）

- **取数语义：** `is_current = 1`（取当前会员等级）
- **对齐字段：** 不涉及历史口径，使用当前快照
- **JOIN key 唯一性：** dim_customer 在 `is_current = 1` 条件下 customer_id 唯一

### 计算逻辑

- **聚合方式：** `SUM(order_amt)`（消费金额汇总）、`COUNT(DISTINCT customer_id)`（VIP 用户数）
- **分组维度：** `city_name`
- **异常处理：** NULL 金额排除（`order_amt IS NOT NULL`）

---

请确认以上理解是否正确，或补充/修正信息后，回复"**生成**"获取完整 SQL。

---

## Stage 2 输出：完整产物

### 1. 生成的 SQL（带中文注释）

### File: queries/vip_consumption_by_city_last_month.sql

```sql
-- ===============================================
-- 查询名称：vip_consumption_by_city_last_month
-- 生成时间：{{ CURRENT_TIMESTAMP }}
-- 口径版本：v1.0
-- ===============================================

-- 取数口径：
-- 1. 从订单主表读取上月整月已完成订单
-- 2. 关联客户维表获取会员等级（is_current=1 当前口径）
-- 3. 关联城市维表获取城市名称
-- 4. 筛选 VIP 用户（customer_level = 'VIP'）
-- 5. 按城市维度聚合消费金额

SELECT
    -- 维度字段
    c.city_name,                                       -- 城市名称

    -- 度量字段
    COUNT(DISTINCT cust.customer_id) AS vip_user_cnt,  -- VIP 用户数
    SUM(o.order_amt) AS total_order_amt,               -- 消费金额汇总
    AVG(o.order_amt) AS avg_order_amt                  -- 平均订单金额

FROM dwd.dwd_fact_order_header o

-- 关联客户维表（SCD2，取当前记录）
LEFT JOIN dwd.dim_customer cust
    ON o.customer_id = cust.customer_id
    AND cust.is_current = 1                            -- SCD2 语义锁定：当前口径

-- 关联城市维表
LEFT JOIN dwd.dim_city c
    ON cust.city_id = c.city_id

WHERE 1=1
    -- 分区过滤（上月整月，动态计算）
    AND o.dt >= DATE_FORMAT(ADD_MONTHS(TRUNC(CURRENT_DATE, 'MM'), -1), 'yyyy-MM-dd')
    AND o.dt <  DATE_FORMAT(TRUNC(CURRENT_DATE, 'MM'), 'yyyy-MM-dd')

    -- 业务过滤
    AND o.order_status = 'completed'

    -- 质量过滤
    AND o.is_deleted = 0
    AND o.order_amt IS NOT NULL

    -- VIP 过滤
    AND cust.customer_level = 'VIP'

GROUP BY
    c.city_name

ORDER BY
    total_order_amt DESC
;
```

---

### 2. 自检结果（Validator）

#### P0（阻断）

- [x] V-P0-01 分区过滤缺失：**通过** — 已包含 `o.dt >= ... AND o.dt < ...` 分区谓词
- [x] V-P0-02 分区谓词不可裁剪：**通过** — 使用 `ADD_MONTHS(TRUNC(...))` 生成常量，分区裁剪有效
- [x] V-P0-03 分区类型不匹配：**通过** — dt 为 string 类型，谓词格式为 `yyyy-MM-dd`
- [x] V-P0-04 笛卡尔积风险：**通过** — 所有 JOIN 均有明确 ON 条件
- [x] V-P0-05 Hive 不支持：**通过** — `ADD_MONTHS`, `TRUNC`, `DATE_FORMAT` 均为 Hive 3.x 标准函数

#### P1（警告）

- [x] V-P1-01 JOIN 放大风险：**通过** — LEFT JOIN 维表，维表 key 唯一，无放大风险
- [x] V-P1-02 SCD2 语义未锁定：**通过** — 已明确 `is_current = 1` 条件
- [x] V-P1-03 聚合一致性风险：**通过** — `city_name` 在 GROUP BY 中，聚合一致
- [x] V-P1-04 时间口径不一致：**通过** — 分区时间覆盖业务时间范围

#### P2（提示）

- [x] V-P2-01 可运行性：**通过** — 聚合查询，返回行数有限
- [x] V-P2-02 性能建议：**提示** — 建议先过滤再 JOIN（见优化建议）

#### 修复建议（可复制片段）

```sql
-- 无 P0/P1 问题需修复

-- P2 性能优化：先过滤事实表再 JOIN 维表
WITH filtered_orders AS (
    SELECT customer_id, order_amt
    FROM dwd.dwd_fact_order_header
    WHERE dt >= DATE_FORMAT(ADD_MONTHS(TRUNC(CURRENT_DATE, 'MM'), -1), 'yyyy-MM-dd')
      AND dt <  DATE_FORMAT(TRUNC(CURRENT_DATE, 'MM'), 'yyyy-MM-dd')
      AND order_status = 'completed'
      AND is_deleted = 0
      AND order_amt IS NOT NULL
)
SELECT ...
FROM filtered_orders o
LEFT JOIN dwd.dim_customer cust ON ...
```

---

### 3. 口径说明

#### 1. 计算步骤

1. 从 `dwd.dwd_fact_order_header` 读取上月整月（动态计算）分区数据
2. 按 `order_status = 'completed'` 筛选已完成订单
3. 关联 `dwd.dim_customer`（SCD2 `is_current = 1` 当前口径）获取会员等级和城市
4. 关联 `dwd.dim_city` 获取城市名称
5. 按 `customer_level = 'VIP'` 筛选 VIP 用户
6. 按 `city_name` 粒度聚合消费金额

#### 2. 数据源

| 表名 | 作用 | 关键字段 |
|------|------|----------|
| `dwd.dwd_fact_order_header` | 订单事实表 | `order_amt`, `customer_id`, `dt` |
| `dwd.dim_customer` | 客户维度（SCD2） | `customer_id`, `customer_level`, `city_id`, `is_current` |
| `dwd.dim_city` | 城市维度 | `city_id`, `city_name` |

#### 3. 假设和限制

- **数据新鲜度：** T+1 更新，最新分区为昨天
- **已排除的数据：** 非 completed 状态订单、is_deleted=1、NULL 金额
- **SCD 处理：** 使用 `is_current = 1` 取客户当前状态（非历史快照）
- **边界情况：** VIP 用户无订单的城市不出现在结果中

#### 4. 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-02-01 | 初始版本 |

---

### 4. 性能提示

#### 风险识别

| 风险项 | 严重度 | 说明 |
|--------|--------|------|
| 分区跨度 | 中 | 扫描上月整月（约 28-31 天分区） |
| JOIN 放大 | 低 | 维表 key 唯一，无放大 |
| 聚合成本 | 中 | COUNT DISTINCT 需去重计算 |

#### 优化建议

1. **先过滤再 JOIN（减少 JOIN 数据量）**
   ```sql
   -- 优化前：全表 JOIN 后过滤
   FROM dwd.dwd_fact_order_header o
   LEFT JOIN dwd.dim_customer cust ON ...
   WHERE o.dt >= ... AND cust.customer_level = 'VIP'

   -- 优化后：用 CTE 先过滤事实表
   WITH filtered_orders AS (
       SELECT customer_id, order_amt
       FROM dwd.dwd_fact_order_header
       WHERE dt >= ... AND order_status = 'completed'
   )
   SELECT ... FROM filtered_orders o LEFT JOIN ...
   ```

2. **如果 VIP 用户占比低，可用 INNER JOIN 提前过滤**
   ```sql
   -- 用 INNER JOIN 替代 LEFT JOIN + WHERE
   INNER JOIN dwd.dim_customer cust
       ON o.customer_id = cust.customer_id
       AND cust.is_current = 1
       AND cust.customer_level = 'VIP'
   ```

#### 资源估算

- **预估扫描数据量：** 约 1 个月订单数据 + 客户维表全量
- **预估执行时间：** 分钟级（取决于订单量和 VIP 占比）
- **建议执行队列：** default / etl

---

### 5. 依赖说明

#### 表依赖

| 表名 | 层级 | 更新频率 | 分区策略 |
|------|------|----------|----------|
| `dwd.dwd_fact_order_header` | DWD | T+1 | dt (yyyy-MM-dd) |
| `dwd.dim_customer` | DWD | T+1 | dt (yyyy-MM-dd) |
| `dwd.dim_city` | DWD | 低频 | 无分区（全量表） |

#### 字段依赖

| 输出字段 | 来源表 | 来源字段 | 转换逻辑 |
|----------|--------|----------|----------|
| `city_name` | `dim_city` | `city_name` | 直接输出 |
| `vip_user_cnt` | `dim_customer` | `customer_id` | COUNT DISTINCT |
| `total_order_amt` | `dwd_fact_order_header` | `order_amt` | SUM |
| `avg_order_amt` | `dwd_fact_order_header` | `order_amt` | AVG |

#### 外键关系

| 事实表字段 | 维表 | 维表字段 | JOIN 类型 |
|------------|------|----------|-----------|
| `customer_id` | `dim_customer` | `customer_id` | LEFT JOIN |
| `city_id` (from dim_customer) | `dim_city` | `city_id` | LEFT JOIN |

---

## 案例要点

**关键决策点：**
- SCD2 维表 JOIN 必须锁定 `is_current = 1`（当前口径）或 as-of 历史口径
- 多表 JOIN 时分区过滤必须在事实表上，且放在 WHERE 子句前部
- 上月整月使用 `ADD_MONTHS(TRUNC(...), -1)` 动态计算

**适用场景：**
- 按维度聚合统计
- 多表关联分析
- 涉及 SCD2 维表的报表查询

**注意事项：**
- `is_current = 1` 确保客户维度唯一性，避免 JOIN 放大
- 动态时间表达确保 SQL 可重复执行（每月自动滚动）
- VIP 过滤放在 WHERE 而非 JOIN ON 中，保持 LEFT JOIN 语义清晰

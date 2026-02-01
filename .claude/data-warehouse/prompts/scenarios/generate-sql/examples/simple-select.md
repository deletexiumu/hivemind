---
type: example
scenario: generate-sql
domain: e-commerce
complexity: simple
query_type: select
joins: 0
aggregations: false
scd2: false
---

# 案例：简单取数（订单明细查询）

## 输入

```
帮我取最近 7 天的订单明细，包括订单号、客户 ID、订单金额、订单状态。
只要已完成的订单。
```

---

## Stage 1 输出：取数需求理解确认

### 业务目标

- **取数目的：** 查看最近 7 天已完成订单明细（排查/报表）
- **输出粒度：** 一行 = 一个订单
- **输出形态：** SELECT（即席查询）

### 数据源

| 表名 | 类型 | 作用 | 关键字段 |
|------|------|------|----------|
| `dwd.dwd_fact_order_header` | 主表 | 订单主表 | `order_no`, `customer_id`, `order_amt`, `order_status`, `dt` |

### 分区与时间

- **分区字段：** `dt`（string 类型，格式 `yyyy-MM-dd`）
- **分区范围：** 最近 7 天（不含今天）
- **时间字段（业务口径）：** `order_time`（订单创建时间，与分区 dt 一致）
- **时间表达：** 动态计算（`DATE_SUB(CURRENT_DATE, 7)` ~ `CURRENT_DATE`）

### 过滤条件

- **业务过滤：** `order_status = 'completed'`
- **质量过滤：** `is_deleted = 0`（排除已删除）
- **口径定义：** 已完成订单 = `order_status = 'completed'`

### SCD2 语义（如有维表）

- **不涉及：** 本查询无维表 JOIN

### 计算逻辑

- **聚合方式：** 无聚合（明细查询）
- **分组维度：** 无
- **异常处理：** 无

---

请确认以上理解是否正确，或补充/修正信息后，回复"**生成**"获取完整 SQL。

---

## Stage 2 输出：完整产物

### 1. 生成的 SQL（带中文注释）

### File: queries/order_detail_last_7d.sql

```sql
-- ===============================================
-- 查询名称：order_detail_last_7d
-- 生成时间：{{ CURRENT_TIMESTAMP }}
-- 口径版本：v1.0
-- ===============================================

-- 取数口径：
-- 1. 从订单主表 dwd_fact_order_header 读取最近 7 天数据
-- 2. 筛选 order_status = 'completed' 的已完成订单
-- 3. 排除 is_deleted = 1 的删除标记数据
-- 4. 输出订单号、客户 ID、订单金额、订单状态

SELECT
    -- 维度字段
    order_no,                      -- 订单号
    customer_id,                   -- 客户 ID
    order_status,                  -- 订单状态

    -- 度量字段
    order_amt                      -- 订单金额

FROM dwd.dwd_fact_order_header

WHERE 1=1
    -- 分区过滤（动态计算，可重复执行）
    AND dt >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, 7), 'yyyy-MM-dd')
    AND dt <  DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd')

    -- 业务过滤
    AND order_status = 'completed'

    -- 质量过滤
    AND is_deleted = 0

ORDER BY
    order_no
;
```

---

### 2. 自检结果（Validator）

#### P0（阻断）

- [x] V-P0-01 分区过滤缺失：**通过** — 已包含 `dt >= ... AND dt < ...` 分区谓词
- [x] V-P0-02 分区谓词不可裁剪：**通过** — 使用 `DATE_FORMAT(DATE_SUB(...))` 生成常量比较，分区裁剪有效
- [x] V-P0-03 分区类型不匹配：**通过** — dt 为 string 类型，谓词格式为 `yyyy-MM-dd`，类型一致
- [x] V-P0-04 笛卡尔积风险：**通过** — 单表查询，无 JOIN
- [x] V-P0-05 Hive 不支持：**通过** — 所有函数均为 Hive 3.x 标准函数

#### P1（警告）

- [x] V-P1-01 JOIN 放大风险：**不涉及** — 单表查询
- [x] V-P1-02 SCD2 语义未锁定：**不涉及** — 无维表 JOIN
- [x] V-P1-03 聚合一致性风险：**不涉及** — 无聚合操作
- [x] V-P1-04 时间口径不一致：**通过** — 分区时间与业务时间一致

#### P2（提示）

- [ ] V-P2-01 可运行性：**提示** — 明细查询建议添加 LIMIT 控制返回行数
- [x] V-P2-02 性能建议：**通过** — 7 天分区跨度合理

#### 修复建议（可复制片段）

```sql
-- 建议添加 LIMIT 控制返回行数（预览场景）
LIMIT 1000
```

---

### 3. 口径说明

#### 1. 计算步骤

1. 从 `dwd.dwd_fact_order_header` 读取最近 7 天（`DATE_SUB(CURRENT_DATE, 7)` 至 `CURRENT_DATE`）分区数据
2. 按 `order_status = 'completed'` 筛选已完成订单
3. 按 `is_deleted = 0` 排除已删除数据
4. 输出订单号、客户 ID、订单金额、订单状态字段

#### 2. 数据源

| 表名 | 作用 | 关键字段 |
|------|------|----------|
| `dwd.dwd_fact_order_header` | 订单主表 | `order_no`, `customer_id`, `order_amt`, `order_status`, `dt` |

#### 3. 假设和限制

- **数据新鲜度：** T+1 更新，最新分区为昨天
- **已排除的数据：** 非 completed 状态订单、is_deleted=1 标记
- **SCD 处理：** 不涉及
- **边界情况：** 空结果时返回空集

#### 4. 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-02-01 | 初始版本 |

---

### 4. 性能提示

#### 风险识别

| 风险项 | 严重度 | 说明 |
|--------|--------|------|
| 分区跨度 | 低 | 扫描 7 天分区，范围合理 |
| JOIN 放大 | 不涉及 | 单表查询 |
| 聚合成本 | 不涉及 | 无聚合操作 |

#### 优化建议

1. **添加 LIMIT 控制返回行数**
   ```sql
   -- 预览场景建议
   LIMIT 1000
   ```

2. **添加索引字段筛选（如适用）**
   ```sql
   -- 如需按客户筛选，添加条件可减少扫描
   AND customer_id = 'xxx'
   ```

#### 资源估算

- **预估扫描数据量：** 7 天订单数据（取决于日订单量）
- **预估执行时间：** 秒级（小数据量）/ 分钟级（百万级订单）
- **建议执行队列：** default

---

### 5. 依赖说明

#### 表依赖

| 表名 | 层级 | 更新频率 | 分区策略 |
|------|------|----------|----------|
| `dwd.dwd_fact_order_header` | DWD | T+1 | dt (yyyy-MM-dd) |

#### 字段依赖

| 输出字段 | 来源表 | 来源字段 | 转换逻辑 |
|----------|--------|----------|----------|
| `order_no` | `dwd_fact_order_header` | `order_no` | 直接输出 |
| `customer_id` | `dwd_fact_order_header` | `customer_id` | 直接输出 |
| `order_amt` | `dwd_fact_order_header` | `order_amt` | 直接输出 |
| `order_status` | `dwd_fact_order_header` | `order_status` | 直接输出 |

#### 外键关系

| 事实表字段 | 维表 | 维表字段 | JOIN 类型 |
|------------|------|----------|-----------|
| — | — | — | 无 JOIN |

---

## 案例要点

**关键决策点：**
- 单表查询无需 JOIN，直接从 DWD 层事实表取数
- 分区过滤使用动态时间表达 `DATE_FORMAT(DATE_SUB(...), 'yyyy-MM-dd')`
- 业务过滤与质量过滤分开声明，口径清晰

**适用场景：**
- 简单明细查询
- 即席数据排查
- 报表基础数据导出

**注意事项：**
- 明细查询建议添加 LIMIT 避免返回过多数据
- 分区谓词必须"裸字段比较常量"，不能对 dt 做函数
- 动态时间表达确保 SQL 可重复执行

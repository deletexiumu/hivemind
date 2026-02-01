---
type: input-template
scenario: generate-sql
version: 1.0.0
---

# 生成 SQL - 输入模板

## 字段定义

| 字段名 | 说明 | 类型 | 必填/推荐/可选 |
|--------|------|------|----------------|
| `requirement` | 取数需求描述（业务目标、输出内容） | string | **必填** |
| `source_tables` | 数据源表清单（主表、关联表） | array | **必填** |
| `time_window` | 时间窗口（日期范围、动态/固定） | object | 推荐 |
| `filters` | 过滤条件（业务过滤、质量过滤） | object | 可选 |
| `aggregations` | 聚合维度（GROUP BY 字段） | array | 可选 |
| `scd2_handling` | SCD2 维度处理方式（is_current / as-of） | string | 可选 |

---

## YAML 模板

复制以下模板并填写：

```yaml
# === 必填信息 ===
requirement: ""        # [必填] 取数需求描述
source_tables:         # [必填] 数据源表清单
  - table: ""          # 表名（如 dwd.dwd_fact_orders）
    alias: ""          # 别名（可选）
    role: ""           # 角色：main（主表）/ dim（维表）/ detail（明细表）

# === 推荐信息 ===
time_window:           # [推荐] 时间窗口
  partition_col: "dt"  # 分区列名
  partition_type: ""   # 类型：string (yyyy-MM-dd) / int (yyyyMMdd)
  range: ""            # 范围：last_7_days / last_30_days / custom
  start_date: ""       # 固定开始日期（custom 时填写）
  end_date: ""         # 固定结束日期（custom 时填写）
  dynamic: true        # 是否使用动态时间表达

# === 可选信息 ===
filters:               # [可选] 过滤条件
  business: []         # 业务过滤，如 ["status = 'completed'"]
  quality: []          # 质量过滤，如 ["is_deleted = 0"]

aggregations:          # [可选] 聚合维度（GROUP BY）
  dimensions: []       # 分组字段，如 ["customer_id", "order_date"]
  measures: []         # 聚合字段，如 ["SUM(amount) AS total_amount"]

scd2_handling: ""      # [可选] SCD2 语义：is_current / as_of
as_of_field: ""        # [可选] as_of 对齐字段（scd2_handling=as_of 时必填）
```

---

## 示例输入

### 示例 1：简单明细查询

```yaml
requirement: 取最近 7 天的订单明细，包括订单号、客户 ID、订单金额、订单状态。只要已完成的订单。

source_tables:
  - table: dwd.dwd_fact_order_header
    role: main

time_window:
  partition_col: dt
  partition_type: string
  range: last_7_days
  dynamic: true

filters:
  business:
    - "order_status = 'completed'"
  quality:
    - "is_deleted = 0"
```

### 示例 2：带 JOIN 的聚合查询

```yaml
requirement: 统计最近 30 天每个客户的订单总金额和订单数量

source_tables:
  - table: dwd.dwd_fact_order_header
    alias: o
    role: main
  - table: dwd.dim_customer
    alias: c
    role: dim

time_window:
  partition_col: dt
  partition_type: string
  range: last_30_days
  dynamic: true

aggregations:
  dimensions:
    - c.customer_id
    - c.customer_name
  measures:
    - "SUM(o.order_amt) AS total_amount"
    - "COUNT(DISTINCT o.order_no) AS order_count"

scd2_handling: is_current
```

### 示例 3：最小输入

```yaml
requirement: 取最近一周的用户登录明细

source_tables:
  - table: dwd.dwd_log_user_login
```

> **说明：** 系统会根据需求推断时间窗口、分区列等信息，并在 Stage 1 确认。

---

## 常见错误提示

| 错误类型 | 错误示例 | 正确示例 |
|----------|----------|----------|
| 分区信息缺失 | 仅写 `source_tables` 无分区说明 | 在 `time_window` 中声明分区列和类型 |
| SCD2 语义不明确 | JOIN 维表但未说明取当前版本还是历史版本 | 声明 `scd2_handling: is_current` |
| 时间表达硬编码 | `WHERE dt = '2024-01-01'` | 使用 `dynamic: true` 生成动态表达 |

---

## 性能提示

1. **必须提供分区信息** — 未声明分区的大表查询会触发 P0 警告
2. **SCD2 维表 JOIN 必须锁定语义** — 否则结果不可预测
3. **明细查询建议加 LIMIT** — 预览场景避免返回过多数据
4. **时间范围控制** — 跨月查询需在 Stage 1 确认成本

---

## 输入后的交互流程

1. **Stage 1（需求确认）：** 系统解析需求，输出业务目标、数据源、时间范围、过滤条件确认
2. **Stage 2（完整产物）：** 用户确认后，系统生成 SQL + Validator 自检 + 口径说明 + 性能提示

回复"确认"或"生成"可触发 Stage 2 输出完整 SQL。

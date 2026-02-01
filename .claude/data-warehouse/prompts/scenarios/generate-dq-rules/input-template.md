---
type: input-template
scenario: generate-dq-rules
version: 1.0.0
---

# 生成 DQ 规则 - 输入模板

## 字段定义

| 字段名 | 说明 | 类型 | 必填/推荐/可选 |
|--------|------|------|----------------|
| `model_name` | 目标模型名称 | string | **必填** |
| `columns` | 字段清单（含类型和角色标注） | array | **必填** |
| `layer` | 模型所在分层（ODS/DWD/DWS/ADS） | string | 推荐 |
| `partition_col` | 分区列信息 | object | 推荐 |
| `scd2_fields` | SCD2 相关字段（仅维表/历史表） | object | 可选 |
| `thresholds` | 阈值配置（覆盖默认分层阈值） | object | 可选 |
| `freshness` | 新鲜度要求（仅 source 适用） | object | 可选 |

---

## YAML 模板

复制以下模板并填写：

```yaml
# === 必填信息 ===
model_name: ""         # [必填] 目标模型名称，如 "dwd_fact_order_detail"

columns:               # [必填] 字段清单
  - name: ""           # 字段名
    type: ""           # 数据类型，如 BIGINT, STRING, DECIMAL(18,2)
    role: ""           # 角色：pk/bk/fk/measure/status/partition/soft_delete（可选）
    desc: ""           # 字段描述（可选）

# === 推荐信息 ===
layer: ""              # [推荐] 分层：ODS / DWD / DWS / ADS
materialization: ""    # [推荐] 物化方式：table / incremental / view

partition_col:         # [推荐] 分区列信息
  name: ""             # 分区列名，如 "dt"
  type: ""             # 类型：string / date / int
  format: ""           # 格式，如 "yyyy-MM-dd" 或 "yyyyMMdd"

test_window: 7         # [推荐] 测试范围（最近 N 天）

# === 可选信息 ===
scd2_fields:           # [可选] SCD2 相关字段（维表/历史表）
  is_current: ""       # 当前有效行标志，如 "is_current"
  valid_from: ""       # 有效开始日期，如 "dw_valid_from"
  valid_to: ""         # 有效结束日期，如 "dw_valid_to"

thresholds:            # [可选] 自定义阈值（覆盖分层默认值）
  mostly: 99           # 比例阈值（%）
  warn_pct: 1          # 警告阈值（%）
  error_pct: 5         # 错误阈值（%）

freshness:             # [可选] 新鲜度检测（仅 source）
  field: ""            # 新鲜度判断字段，如 "load_dt"
  warn_after: ""       # 警告阈值，如 "12 hours"
  error_after: ""      # 错误阈值，如 "24 hours"
```

---

## 示例输入

### 示例 1：事实表完整输入

```yaml
model_name: dwd_fact_order_detail
layer: DWD
materialization: incremental

columns:
  - name: order_detail_sk
    type: BIGINT
    role: pk
    desc: 代理键
  - name: order_no
    type: STRING
    role: bk
    desc: 订单号
  - name: order_item_id
    type: STRING
    role: bk
    desc: 订单行 ID
  - name: customer_key
    type: BIGINT
    role: fk
    desc: 客户维度外键
  - name: product_key
    type: BIGINT
    role: fk
    desc: 产品维度外键
  - name: line_amount
    type: DECIMAL(18,2)
    role: measure
    desc: 行金额
  - name: quantity
    type: INT
    role: measure
    desc: 数量
  - name: order_status
    type: STRING
    role: status
    desc: 订单状态
  - name: is_deleted
    type: INT
    role: soft_delete
    desc: 删除标志
  - name: dt
    type: STRING
    role: partition
    desc: 日期分区

partition_col:
  name: dt
  type: string
  format: "yyyy-MM-dd"

test_window: 7
```

### 示例 2：维度表（SCD2）

```yaml
model_name: dim_customer
layer: DWD
materialization: incremental

columns:
  - name: customer_sk
    type: BIGINT
    role: pk
    desc: 代理键
  - name: customer_id
    type: BIGINT
    role: bk
    desc: 业务主键
  - name: customer_name
    type: STRING
    desc: 客户名称
  - name: customer_level
    type: STRING
    role: status
    desc: 客户等级
  - name: is_current
    type: TINYINT
    role: soft_delete
    desc: 当前有效标志
  - name: dw_valid_from
    type: DATE
    desc: 有效开始日期
  - name: dw_valid_to
    type: DATE
    desc: 有效结束日期
  - name: dt
    type: STRING
    role: partition

scd2_fields:
  is_current: is_current
  valid_from: dw_valid_from
  valid_to: dw_valid_to

test_window: 7
```

### 示例 3：最小输入

```yaml
model_name: dwd_fact_order_detail
layer: DWD

columns:
  - name: order_detail_sk
    type: BIGINT
  - name: order_no
    type: STRING
  - name: line_amount
    type: DECIMAL(18,2)
  - name: dt
    type: STRING
```

> **说明：** 系统会根据字段后缀自动推断规则（如 `_sk` → unique + not_null），并在 Stage 1 展示推断规则清单供确认。

---

## 常见错误提示

| 错误类型 | 错误示例 | 正确示例 |
|----------|----------|----------|
| 字段类型缺失 | 仅提供字段名 | 同时提供 `name` 和 `type` |
| 分区信息不完整 | 仅写 `partition_col: dt` | 包含 `name`, `type`, `format` |
| SCD2 表未声明过滤条件 | 维表唯一性检测含历史行 | 声明 `scd2_fields.is_current` |

---

## 字段类型驱动规则

系统根据字段后缀自动推断 DQ 规则：

| 后缀模式 | 推荐规则 | 优先级 |
|----------|----------|--------|
| `_id`, `_sk`, `_key` | `unique` + `not_null` | P0 |
| `_amt`, `_amount` | `not_null` + 范围 `>= 0` | P1 |
| `_cnt`, `_count` | `not_null` + 范围 `>= 0` | P1 |
| `_status`, `_type` | `accepted_values` | P1 |
| `_date`, `_time` | `not_null` + 格式检查 | P1 |
| `is_`, `has_` | `accepted_values: [0, 1]` | P2 |
| `*_key` (FK) | `relationships` | P2 |

---

## 输入后的交互流程

1. **Stage 1（规则预览）：** 系统输出推断规则清单、分层阈值、待确认问题
2. **Stage 2（完整配置）：** 用户确认后，系统生成完整的 dbt tests YAML 配置

回复"生成配置"或"确认"可触发 Stage 2 输出 dbt tests YAML。

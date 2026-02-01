---
type: scenario-example
scenario: generate-dq-rules
example: fact-table-dq
complexity: medium
layer: DWD
business_domain: order
---

# 事实表 DQ 规则案例：订单明细表

## 用户输入

```yaml
表名：dwd_fact_order_detail
分层：DWD
物化：incremental
分区列：dt (STRING, 格式 YYYY-MM-DD)
测试范围：最近 7 天

字段清单：
- order_detail_sk (BIGINT) - 代理键
- order_no (STRING) - 订单号
- order_item_id (STRING) - 订单行 ID
- customer_key (BIGINT) - 客户维度外键
- product_key (BIGINT) - 产品维度外键
- line_amount (DECIMAL(18,2)) - 行金额
- quantity (INT) - 数量
- order_status (STRING) - 订单状态
- is_deleted (INT) - 删除标志
- dt (STRING) - 日期分区
```

---

## Stage 1 输出：规则清单预览

### 目标信息

| 属性 | 值 |
|------|-----|
| **目标类型** | model |
| **表/模型名** | dwd_fact_order_detail |
| **分层** | DWD |
| **物化方式** | incremental |
| **分区列** | dt (STRING) |

### 推断规则清单

| # | 字段 | 规则类型 | 依据 | 阈值 | 优先级 |
|---|------|----------|------|------|--------|
| 1 | order_detail_sk | unique + not_null | _sk 后缀（代理键） | 0 容忍 | P0 |
| 2 | order_no | not_null | 业务主键组成 | 0 容忍 | P0 |
| 3 | order_item_id | not_null | 业务主键组成 | 0 容忍 | P0 |
| 4 | (order_no, order_item_id, dt) | unique_combination | 组合唯一性 | 0 容忍 | P0 |
| 5 | customer_key | not_null + relationships | _key 后缀（外键） | 0 容忍 | P1 |
| 6 | product_key | not_null + relationships | _key 后缀（外键） | 0 容忍 | P1 |
| 7 | line_amount | not_null + 范围 >= 0 | _amount 后缀 | 0 容忍 | P1 |
| 8 | quantity | not_null + 范围 >= 0 | 数量字段 | 0 容忍 | P1 |
| 9 | order_status | not_null + accepted_values | _status 后缀 | mostly 99% | P1 |
| 10 | is_deleted | accepted_values [0, 1] | is_ 前缀 | 0 容忍 | P2 |
| 11 | dt | not_null | 分区列 | 0 容忍 | P0 |

### 分层阈值（DWD 适用）

| 类型 | 实现方式 | 值 |
|------|----------|-----|
| 严格规则 | dbt 原生 | 0 容忍 |
| 比例规则 | mostly | 99% |
| 行数规则 | warn_if/error_if | warn 1% / error 5% |

### 待确认问题

1. **order_status** 的枚举值列表是什么？（如：待支付/已支付/已取消/已完成）
2. **customer_key** 外键关联的维度表名？（推测：dim_customer）
3. **product_key** 外键关联的维度表名？（推测：dim_product）
4. 是否需要检测 **line_amount** 的最大值上限？

---

回复"**生成配置**"获取完整的 dbt tests YAML。

---

## Stage 2 输出：dbt tests YAML

用户确认：order_status 枚举值为 ['PENDING', 'PAID', 'CANCELLED', 'COMPLETED']

### File: models/dwd/dwd_fact_order_detail.yml

```yaml
version: 2

models:
  - name: dwd_fact_order_detail
    description: "订单明细事实表，记录每笔订单的商品行信息"
    meta:
      layer: DWD
      owner: data_team
      grain: order_item

    # 表级测试
    tests:
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns:
            - order_no
            - order_item_id
            - dt
          config:
            where: "dt >= date_sub(current_date, 7)"

    columns:
      # 代理键
      - name: order_detail_sk
        description: "订单明细代理键"
        tests:
          - unique:
              config:
                where: "dt >= date_sub(current_date, 7)"
          - not_null

      # 业务键
      - name: order_no
        description: "订单号"
        tests:
          - not_null

      - name: order_item_id
        description: "订单行 ID"
        tests:
          - not_null

      # 外键
      - name: customer_key
        description: "客户维度外键"
        tests:
          - not_null
          - relationships:
              to: ref('dim_customer')
              field: customer_sk
              config:
                where: "dt >= date_sub(current_date, 7)"

      - name: product_key
        description: "产品维度外键"
        tests:
          - not_null
          - relationships:
              to: ref('dim_product')
              field: product_sk
              config:
                where: "dt >= date_sub(current_date, 7)"

      # 金额字段
      - name: line_amount
        description: "订单行金额"
        tests:
          - not_null
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              config:
                severity: warn

      # 数量字段
      - name: quantity
        description: "商品数量"
        tests:
          - not_null
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              config:
                severity: warn

      # 状态字段
      - name: order_status
        description: "订单状态"
        tests:
          - not_null
          - accepted_values:
              values: ['PENDING', 'PAID', 'CANCELLED', 'COMPLETED']
              config:
                severity: warn
                warn_if: ">0"
                error_if: ">={{ (1/100) * var('total_rows', 10000) }}"

      # 删除标志
      - name: is_deleted
        description: "软删除标志 (0=正常, 1=已删除)"
        tests:
          - accepted_values:
              values: [0, 1]

      # 分区列
      - name: dt
        description: "日期分区列"
        tests:
          - not_null
```

---

## 案例要点

1. **组合唯一性** — 事实表的业务主键通常是多字段组合（order_no + order_item_id + dt）
2. **分区过滤** — 所有 unique 和 relationships 测试都添加了 `where` 条件，限制扫描最近 7 天
3. **外键检测** — 使用 `relationships` 测试确保外键完整性
4. **阈值分级** — 主键规则 0 容忍，状态字段使用 mostly/warn_if 容忍小比例异常
5. **dbt-expectations** — 金额和数量字段使用 `expect_column_values_to_be_between` 做范围检测

---

*Token budget: ~600 tokens*

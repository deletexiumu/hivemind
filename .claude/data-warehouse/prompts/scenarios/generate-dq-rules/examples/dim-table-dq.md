---
type: scenario-example
scenario: generate-dq-rules
example: dim-table-dq
complexity: medium
layer: DWD
business_domain: customer
scd_type: 2
---

# 维度表 DQ 规则案例：客户维度表（SCD2）

## 用户输入

```yaml
表名：dim_customer
分层：DWD
物化：table
是 SCD2：是
有效行条件：is_current = 1

字段清单：
- customer_sk (BIGINT) - 代理键
- customer_id (STRING) - 自然键（业务主键）
- customer_name (STRING) - 客户名称
- customer_level (STRING) - 客户等级
- customer_phone (STRING) - 客户手机号
- is_current (INT) - 当前有效标志
- dw_valid_from (DATE) - 生效日期
- dw_valid_to (DATE) - 失效日期
```

---

## Stage 1 输出：规则清单预览

### 目标信息

| 属性 | 值 |
|------|-----|
| **目标类型** | model |
| **表/模型名** | dim_customer |
| **分层** | DWD |
| **物化方式** | table |
| **SCD 类型** | Type 2 |
| **有效行过滤** | is_current = 1 |

### 推断规则清单

| # | 字段 | 规则类型 | 依据 | 阈值 | 优先级 |
|---|------|----------|------|------|--------|
| 1 | customer_sk | unique + not_null | _sk 后缀（代理键） | 0 容忍（全量） | P0 |
| 2 | customer_id | unique + not_null | _id 后缀（自然键） | 0 容忍（当前有效行） | P0 |
| 3 | customer_name | not_null | 核心属性 | 0 容忍 | P1 |
| 4 | customer_level | accepted_values | _level 后缀 | mostly 99% | P1 |
| 5 | customer_phone | 格式检测 | _phone 后缀 | mostly 95% | P2 |
| 6 | is_current | accepted_values [0, 1] | SCD2 有效标志 | 0 容忍 | P0 |
| 7 | dw_valid_from | not_null | SCD2 生效日期 | 0 容忍 | P0 |
| 8 | dw_valid_to | not_null | SCD2 失效日期 | 0 容忍 | P0 |

### SCD2 专属规则

| # | 规则 | 说明 |
|---|------|------|
| 9 | 自然键 + 有效行唯一 | 每个 customer_id 只能有一条 is_current = 1 的记录 |
| 10 | 历史连续性 | 同一 customer_id 的历史版本日期区间不能重叠 |
| 11 | 当前行失效日期 | is_current = 1 时，dw_valid_to 应为 9999-12-31 |

### 有效行过滤

- **测试范围**：`WHERE is_current = 1`
- **原因**：SCD2 历史行不参与自然键唯一性检测

### 待确认问题

1. **customer_level** 的枚举值列表是什么？（如：普通/银卡/金卡/钻石）
2. **customer_phone** 是否需要手机号格式检测？（11 位数字）
3. 是否需要检测 **dw_valid_from ≤ dw_valid_to**？

---

回复"**生成配置**"获取完整的 dbt tests YAML。

---

## Stage 2 输出：dbt tests YAML

用户确认：customer_level 枚举值为 ['NORMAL', 'SILVER', 'GOLD', 'DIAMOND']

### File: models/dwd/dim_customer.yml

```yaml
version: 2

models:
  - name: dim_customer
    description: "客户维度表（SCD Type 2），记录客户属性及历史变更"
    meta:
      layer: DWD
      owner: data_team
      scd_type: 2
      natural_key: customer_id

    # 表级测试
    tests:
      # 自然键在当前有效行中唯一
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns:
            - customer_id
          config:
            where: "is_current = 1"

    columns:
      # 代理键（全量唯一）
      - name: customer_sk
        description: "客户代理键（全版本唯一）"
        tests:
          - unique
          - not_null

      # 自然键（当前有效行唯一）
      - name: customer_id
        description: "客户业务 ID（自然键）"
        tests:
          - not_null
          - unique:
              config:
                where: "is_current = 1"

      # 核心属性
      - name: customer_name
        description: "客户名称"
        tests:
          - not_null

      - name: customer_level
        description: "客户等级"
        tests:
          - not_null
          - accepted_values:
              values: ['NORMAL', 'SILVER', 'GOLD', 'DIAMOND']
              config:
                severity: warn
                warn_if: ">0"
                error_if: ">{{ (1/100) * var('total_rows', 10000) }}"

      - name: customer_phone
        description: "客户手机号"
        tests:
          - dbt_expectations.expect_column_values_to_match_regex:
              regex: "^1[3-9][0-9]{9}$"
              config:
                severity: warn
                where: "is_current = 1 AND customer_phone IS NOT NULL"

      # SCD2 元数据
      - name: is_current
        description: "当前有效标志 (1=当前有效, 0=历史版本)"
        tests:
          - not_null
          - accepted_values:
              values: [0, 1]

      - name: dw_valid_from
        description: "版本生效日期"
        tests:
          - not_null

      - name: dw_valid_to
        description: "版本失效日期"
        tests:
          - not_null
          # 当前行失效日期应为 9999-12-31
          - dbt_expectations.expect_column_values_to_be_in_set:
              value_set: ['9999-12-31']
              config:
                where: "is_current = 1"
                severity: error
```

---

## 案例要点

1. **SCD2 双重唯一性** — 代理键全量唯一，自然键仅在当前有效行唯一
2. **有效行过滤** — 所有业务规则测试添加 `where: "is_current = 1"` 条件
3. **历史行排除** — 手机号格式检测仅针对当前有效行
4. **SCD2 元数据完整性** — is_current、dw_valid_from、dw_valid_to 必须非空
5. **边界值检测** — 当前行的 dw_valid_to 应为固定值 9999-12-31

---

*Token budget: ~600 tokens*

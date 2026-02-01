---
type: scenario-support
scenario: generate-dq-rules
document: output-template
version: 1.0.0
token_budget: 700
---

# DQ 规则输出模板

## Stage 1 输出模板：规则清单预览

```markdown
# DQ 规则清单

## 目标信息

| 属性 | 值 |
|------|-----|
| **目标类型** | {source/model} |
| **表/模型名** | {table_name} |
| **分层** | {ODS/DWD/DWS/ADS} |
| **物化方式** | {table/view/incremental} |
| **分区列** | {partition_column} |

## 推断规则清单

| # | 字段 | 规则类型 | 依据 | 阈值 | 优先级 |
|---|------|----------|------|------|--------|
| 1 | order_sk | unique + not_null | _sk 后缀 | 0 容忍 | P0 |
| 2 | order_amount | not_null + 范围 | _amount 后缀 | 0 容忍 | P1 |
| 3 | order_status | accepted_values | _status 后缀 | mostly 99% | P1 |
| ... | ... | ... | ... | ... | ... |

## 分层阈值

| 类型 | 实现方式 | 值 |
|------|----------|-----|
| 严格规则 | dbt 原生 | 0 容忍 |
| 比例规则 | mostly | {layer_threshold}% |
| 行数规则 | warn_if/error_if | warn {N} / error {M} |

## 新鲜度检测

| 属性 | 值 |
|------|-----|
| **依据字段** | {freshness_field} |
| **warn_after** | {warn_value} |
| **error_after** | {error_value} |

{若为 SCD2/维表}
## 有效行过滤

- 测试范围：`WHERE {is_current_condition}`
- 原因：SCD2 历史行不参与唯一性检测

## 待确认问题

{列出需要用户确认的问题}

---

回复"**生成配置**"获取完整的 dbt tests YAML。
```

---

## Stage 2 输出模板：dbt tests YAML

```markdown
# dbt Tests 配置

## 依赖说明

- dbt version: 1.7+
- 可选：dbt-expectations 0.10.x（复杂规则）

### File: models/{layer}/{table_name}.yml

\`\`\`yaml
version: 2

models:
  - name: {table_name}
    description: "{description}"
    meta:
      layer: {layer}
      owner: {owner}

    # 表级测试（组合唯一性等）
    tests:
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns: [{pk_columns}]
          config:
            where: "dt >= date_sub(current_date, {N})"

    columns:
      # 主键/代理键
      - name: {pk_column}
        description: "{pk_description}"
        tests:
          - unique:
              config:
                where: "{partition_filter}"
          - not_null

      # 金额字段
      - name: {amount_column}
        tests:
          - not_null
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              max_value: {max_value}
              config:
                severity: warn

      # 状态字段
      - name: {status_column}
        tests:
          - not_null
          - accepted_values:
              values: [{status_values}]
              config:
                severity: warn
                warn_if: ">0"
                error_if: ">{error_threshold}"

      # 外键字段
      - name: {fk_column}
        tests:
          - not_null
          - relationships:
              to: ref('{dim_table}')
              field: {dim_pk}
              config:
                where: "{partition_filter}"
\`\`\`
```

### Source 专用模板

```markdown
### File: models/sources/{source_name}.yml

\`\`\`yaml
version: 2

sources:
  - name: {source_name}
    freshness:
      warn_after: {count: {warn_count}, period: day}
      error_after: {count: {error_count}, period: day}
    loaded_at_field: {freshness_field}

    tables:
      - name: {table_name}
        columns:
          - name: {pk_column}
            tests:
              - unique
              - not_null
\`\`\`
```

---

## Hive 方言注意事项

| 场景 | Hive 方言 | 说明 |
|------|-----------|------|
| 日期过滤（STRING） | `dt >= date_sub(current_date, N)` | dt 为 STRING 时自动转换 |
| 日期过滤（DATE） | `dt >= date_sub(current_date(), N)` | 注意函数括号 |
| 正则匹配 | `regexp_like(col, 'pattern')` 或 `col rlike 'pattern'` | 两种写法均可 |
| 空值处理 | `COALESCE(col, default)` | Hive 标准函数 |

---

## 分层阈值默认值参考

| 分层 | warn_if | error_if | mostly |
|------|---------|----------|--------|
| ODS | 5% | 10% | 0.90 |
| DWD/DWS | 1% | 5% | 0.99 |
| ADS | 0% | 1% | 0.999 |

---

*Token budget: ~700 tokens*

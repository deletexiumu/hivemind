---
type: scenario-support
scenario: define-metrics
document: output-template
version: 1.0.0
token_budget: 700
---

# 指标定义输出模板

用于 Stage 1 规格书和 Stage 2 Semantic Layer YAML 的详细格式。

---

## Stage 1 输出模板：指标规格书

```markdown
# 指标规格书

## 基本信息

| 属性 | 值 |
|------|-----|
| **指标名称** | {metric_name} |
| **指标 ID** | {metric_id}（格式：`{domain}_{name}`，如 `order_total_amount`） |
| **分类** | {原子/派生/复合} |
| **业务描述** | {description} |

## 计算定义

| 属性 | 值 |
|------|-----|
| **计算公式** | `{formula}` |
| **聚合方式** | {SUM/COUNT/AVG/COUNT_DISTINCT/MIN/MAX} |
| **粒度** | {grain_description}（如：每订单/每日/每用户） |
| **时间维度** | {time_dimension}（用于 agg_time_dimension） |
| **可切维度** | {dimensions_list}（如：渠道、地区、客户类型） |

## 数据来源

| 属性 | 值 |
|------|-----|
| **源模型** | {source_model}（dbt 模型名称） |
| **源字段** | {source_fields}（用于度量计算的字段） |
| **数据分层** | {layer: DWD/DWS} |

## 指标依赖

> 仅派生/复合指标需填写

| 依赖指标 ID | 指标名称 | 依赖类型 |
|-------------|----------|----------|
| {dep_id_1} | {dep_name_1} | {分子/分母/加数/...} |
| {dep_id_2} | {dep_name_2} | {分子/分母/加数/...} |

## 待确认问题

1. {question_1}
2. {question_2}

---

回复"**生成 YAML**"获取 dbt Semantic Layer 配置。
```

---

## Stage 2 输出模板：Semantic Layer YAML

用户确认 Stage 1 规格书后，按此模板生成完整配置。

### 依赖说明

- dbt version: 1.7+
- MetricFlow 支持（dbt Cloud / dbt-metricflow）

### File: models/semantic/{domain}_semantic.yml

```yaml
version: 2

semantic_models:
  - name: {semantic_model_name}
    model: ref('{dbt_model_name}')
    description: |
      {description}
    defaults:
      agg_time_dimension: {time_dimension}

    entities:
      - name: {primary_entity}
        type: primary
        expr: {primary_key}
      # 可选：foreign entities
      # - name: customer
      #   type: foreign
      #   expr: customer_sk

    dimensions:
      - name: {time_dimension}
        type: time
        type_params:
          time_granularity: day
      # 其他 categorical 维度
      - name: {categorical_dim}
        type: categorical
        expr: {dim_expr}

    measures:
      - name: {measure_name}
        description: "{measure_description}"
        agg: {agg_type}
        expr: {expr}

metrics:
  # 原子指标（type: simple）
  - name: {metric_id}
    description: "{description}"
    type: simple
    label: "{label}"
    type_params:
      measure: {measure_name}
    meta:
      owner: {owner}
      category: atomic

  # 派生指标（type: derived）
  # - name: {derived_metric_id}
  #   description: "{description}"
  #   type: derived
  #   label: "{label}"
  #   type_params:
  #     expr: {formula}  # 如: metric_a / metric_b
  #     metrics:
  #       - name: {dep_metric_1}
  #       - name: {dep_metric_2}
  #   meta:
  #     owner: {owner}
  #     category: derived
  #     depends_on: [{dep_metric_1}, {dep_metric_2}]

  # 比率指标（type: ratio）
  # - name: {ratio_metric_id}
  #   type: ratio
  #   type_params:
  #     numerator:
  #       name: {numerator_metric}
  #     denominator:
  #       name: {denominator_metric}
```

---

### File: docs/metrics/{metric_id}.md

```markdown
# {metric_name}

## 业务口径

{business_definition}

**分类：** {原子/派生/复合}

## 计算逻辑

**公式：** `{formula}`

**聚合方式：** {agg_type}

**数据来源：** {source_model}.{source_fields}

## 维度切面

| 维度 | 说明 |
|------|------|
| {dim_1} | {dim_1_desc} |
| {dim_2} | {dim_2_desc} |

## 使用说明

{usage_notes}

## 关联指标

| 指标 ID | 关系 |
|---------|------|
| {related_id} | {relationship} |

## 变更历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0 | {date} | 初始版本 |
```

---

## 输出交付契约

- 每个文件必须有明确路径：`### File: {path}`
- 代码块语言必须正确：`yaml` / `markdown`
- YAML 遵循 dbt Semantic Layer 2.0 规范
- 派生/复合指标必须在 `meta.depends_on` 中声明依赖指标 ID
- 不确定部分用 `TODO:` 标记并集中列出

---

## 自检清单

- [ ] **指标 ID 规范：** `{domain}_{name}` 格式，snake_case
- [ ] **分类正确：** 原子(simple)/派生(derived/ratio)/复合(derived 嵌套)
- [ ] **依赖声明：** 派生/复合指标在 `type_params.metrics` 中列出依赖
- [ ] **血缘追溯：** `meta.depends_on` 包含所有依赖指标 ID
- [ ] **semantic_models 完整：** entities + dimensions + measures
- [ ] **口径文档完整：** 业务定义 + 计算逻辑 + 维度切面 + 变更历史

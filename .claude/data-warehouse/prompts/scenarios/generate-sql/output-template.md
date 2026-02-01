---
type: scenario-support
scenario: generate-sql
document: output-template
version: 1.0.0
token_budget: 900
---

# SQL 生成输出模板

## Stage 1 输出模板：取数需求理解确认

```markdown
## 取数需求理解确认

### 业务目标

- **取数目的：** {用途描述}
- **输出粒度：** {一行代表什么}
- **输出形态：** {SELECT / INSERT OVERWRITE / CTAS}

### 数据源

| 表名 | 类型 | 作用 | 关键字段 |
|------|------|------|----------|
| `{table}` | 主表 | {role} | `{fields}` |
| `{table}` | 维表 | {role} | `{fields}` |

### 分区与时间

- **分区字段：** {dt 类型/格式，是否有 hour}
- **分区范围：** {时间窗表达}
- **时间字段（业务口径）：** {order_time / create_date}
- **时间表达：** {动态计算 / 固定日期}

### 过滤条件

- **业务过滤：** {status = 'completed', channel = 'APP'}
- **质量过滤：** {is_deleted = 0, is_test = 0}
- **口径定义：** {VIP = customer_level = 'VIP'}

### SCD2 语义（如有维表）

- **取数语义：** {is_current = 1（当前口径）/ as-of 历史口径}
- **对齐字段：** {order_time 对齐维表有效期}
- **JOIN key 唯一性：** {维表 key 当前唯一}

### 计算逻辑

- **聚合方式：** {SUM / COUNT DISTINCT / AVG}
- **分组维度：** {GROUP BY customer_id, dt}
- **异常处理：** {NULL 排除 / 负值计入}

---

请确认以上理解是否正确，或补充/修正信息后，回复"**生成**"获取完整 SQL。
```

---

## Stage 2 输出模板：完整产物

### 1. 生成的 SQL（带中文注释）

```markdown
### File: queries/{query_name}.sql

```sql
-- ===============================================
-- 查询名称：{query_name}
-- 生成时间：{{ CURRENT_TIMESTAMP }}
-- 口径版本：v1.0
-- ===============================================

-- 取数口径：
-- 1. {step_1}
-- 2. {step_2}
-- 3. {step_3}

SELECT
    -- 维度字段
    {dim_col_1},                   -- {comment}
    {dim_col_2},                   -- {comment}

    -- 度量字段
    COUNT(DISTINCT {col}) AS {alias},    -- {comment}
    SUM({col}) AS {alias},               -- {comment}
    AVG({col}) AS {alias}                -- {comment}

FROM {main_table} {alias}
{JOIN_clause}

WHERE 1=1
    -- 分区过滤（动态计算，可重复执行）
    AND {alias}.dt >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, {N}), 'yyyy-MM-dd')
    AND {alias}.dt <  DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd')

    -- 业务过滤
    AND {filter_condition}

    -- 质量过滤
    AND {quality_filter}

GROUP BY
    {group_by_columns}

ORDER BY
    {order_by_columns}
;
```
```

---

### 2. 自检结果（Validator）

```markdown
## 自检结果（Validator）

### P0（阻断）

- [x] V-P0-01 分区过滤缺失：{status} {details}
- [x] V-P0-02 分区谓词不可裁剪：{status} {details}
- [x] V-P0-03 分区类型不匹配：{status} {details}
- [x] V-P0-04 笛卡尔积风险：{status} {details}
- [x] V-P0-05 Hive 不支持：{status} {details}

### P1（警告）

- [ ] V-P1-01 JOIN 放大风险：{status} {details}
- [ ] V-P1-02 SCD2 语义未锁定：{status} {details}
- [ ] V-P1-03 聚合一致性风险：{status} {details}
- [ ] V-P1-04 时间口径不一致：{status} {details}

### P2（提示）

- [ ] V-P2-01 可运行性：{status} {details}
- [ ] V-P2-02 性能建议：{status} {details}

### 修复建议（可复制片段）

{如有 P0/P1 问题，提供修复代码片段}

```sql
-- 推荐的分区谓词写法
WHERE dt >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, 7), 'yyyy-MM-dd')
  AND dt <  DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd')
```
```

---

### 3. 口径说明

```markdown
## 口径说明

### 1. 计算步骤

1. 从 `{source_table}` 读取 `{partition_range}` 范围的数据
2. 按 `{filter_conditions}` 条件过滤
3. 关联 `{dim_table}` 获取维度属性（SCD2 {语义}）
4. 按 `{group_by_columns}` 粒度聚合
5. 计算 `{aggregations}` 指标

### 2. 数据源

| 表名 | 作用 | 关键字段 |
|------|------|----------|
| `{table}` | {role} | `{fields}` |

### 3. 假设和限制

- **数据新鲜度：** {T+1 更新假设}
- **已排除的数据：** {取消订单、删除标记、测试数据}
- **SCD 处理：** {is_current = 1 取当前版本 / as-of 对齐历史}
- **边界情况：** {NULL 处理、负值处理、重复数据处理}

### 4. 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | {date} | 初始版本 |
```

---

### 4. 性能提示

```markdown
## 性能提示

### 风险识别

| 风险项 | 严重度 | 说明 |
|--------|--------|------|
| 分区跨度 | {低/中/高} | 扫描 {N} 天分区 |
| JOIN 放大 | {低/中/高} | {JOIN 类型及风险} |
| 聚合成本 | {低/中/高} | {COUNT DISTINCT 等高成本操作} |

### 优化建议

1. **{suggestion_title}**
   ```sql
   -- 优化前
   {before_sql}

   -- 优化后
   {after_sql}
   ```

### 资源估算

- **预估扫描数据量：** {scan_size}（基于分区跨度）
- **预估执行时间：** {execution_time}（粗略估计）
- **建议执行队列：** {queue}（如适用）
```

---

### 5. 依赖说明

```markdown
## 依赖说明

### 表依赖

| 表名 | 层级 | 更新频率 | 分区策略 |
|------|------|----------|----------|
| `{table}` | {ODS/DWD/DWS/ADS} | {T+1} | {dt} |

### 字段依赖

| 输出字段 | 来源表 | 来源字段 | 转换逻辑 |
|----------|--------|----------|----------|
| `{output_col}` | `{source_table}` | `{source_col}` | {direct/SUM/CASE} |

### 外键关系

| 事实表字段 | 维表 | 维表字段 | JOIN 类型 |
|------------|------|----------|-----------|
| `{fact_key}` | `{dim_table}` | `{dim_key}` | {LEFT/INNER} |
```

---

## 样式约定

### 注释格式

- 文件头：`-- ====` 分隔线包围
- 口径说明：`-- 取数口径：` 开头的编号列表
- 行内注释：字段后 `-- {comment}` 对齐

### SQL 格式

- 关键字大写：`SELECT`, `FROM`, `WHERE`, `AND`, `GROUP BY`
- 缩进：4 空格
- 每个字段/条件独占一行
- 分区过滤放在 WHERE 子句前部

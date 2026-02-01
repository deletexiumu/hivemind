---
type: scenario-support
scenario: generate-sql
document: time-expressions
version: 1.0.0
token_budget: 450
---

# 动态时间表达速查表

## 时间表达转换表

### dt 为 string (yyyy-MM-dd)

| 自然语言 | Hive 表达式 | 说明 |
|----------|------------|------|
| 今天 | `CURRENT_DATE` | 当前日期 |
| 昨天 | `DATE_FORMAT(DATE_SUB(CURRENT_DATE, 1), 'yyyy-MM-dd')` | T-1 |
| 最近 N 天 | `dt >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, N), 'yyyy-MM-dd')` | 滚动窗口 |
| 本周（周一至今） | `dt >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, PMOD(DATEDIFF(CURRENT_DATE, '1900-01-08'), 7)), 'yyyy-MM-dd')` | 周一开始 |
| 本月 | `dt >= DATE_FORMAT(TRUNC(CURRENT_DATE, 'MM'), 'yyyy-MM-dd')` | 当月第一天至今 |
| 上月整月 | `dt >= DATE_FORMAT(ADD_MONTHS(TRUNC(CURRENT_DATE, 'MM'), -1), 'yyyy-MM-dd') AND dt < DATE_FORMAT(TRUNC(CURRENT_DATE, 'MM'), 'yyyy-MM-dd')` | 上月整月 |
| 本季度 | `dt >= DATE_FORMAT(TRUNC(CURRENT_DATE, 'Q'), 'yyyy-MM-dd')` | 当季第一天至今 |
| 本年 | `dt >= DATE_FORMAT(TRUNC(CURRENT_DATE, 'YY'), 'yyyy-MM-dd')` | 当年第一天至今 |

---

## dt 类型适配表

| dt 类型 | 格式 | 推荐谓词写法 |
|---------|------|--------------|
| string | `yyyy-MM-dd` | `dt >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, N), 'yyyy-MM-dd')` |
| int | `yyyyMMdd` | `dt >= CAST(DATE_FORMAT(DATE_SUB(CURRENT_DATE, N), 'yyyyMMdd') AS INT)` |

---

## dt + hour 二级分区模板

```sql
-- 规则：dt/hour 必须"裸字段比较常量"，不要对 dt/hour 做函数
-- {start_dt}/{start_hour}/{end_dt}/{end_hour} 由 Stage 2 计算成常量表达式

WHERE (
        dt >  {start_dt}
     OR (dt = {start_dt} AND hour >= {start_hour})
      )
  AND (
        dt <  {end_dt}
     OR (dt = {end_dt} AND hour <  {end_hour})
      )
```

**示例：最近 24 小时（动态）**

```sql
WHERE (
        dt > DATE_FORMAT(DATE_SUB(CURRENT_DATE, 1), 'yyyy-MM-dd')
     OR (dt = DATE_FORMAT(DATE_SUB(CURRENT_DATE, 1), 'yyyy-MM-dd') AND hour >= HOUR(CURRENT_TIMESTAMP))
      )
  AND (
        dt < DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd')
     OR (dt = DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd') AND hour < HOUR(CURRENT_TIMESTAMP))
      )
```

---

## 禁止写法（会破坏分区裁剪）

```sql
-- 对分区列做函数
WHERE to_date(dt) >= DATE_SUB(CURRENT_DATE, 7)

-- 对分区列 CAST
WHERE cast(dt as date) >= CURRENT_DATE

-- LIKE 命中分区列
WHERE dt like '2026-02%'

-- 在分区列上做计算
WHERE concat(dt, ' ', hour) >= '2026-02-01 10'
```

---

## Hive 3.x 关键日期函数

| 函数 | 用途 | 示例 |
|------|------|------|
| `DATE_SUB(date, N)` | 日期减 N 天 | `DATE_SUB(CURRENT_DATE, 7)` |
| `DATE_ADD(date, N)` | 日期加 N 天 | `DATE_ADD(CURRENT_DATE, 1)` |
| `TRUNC(date, 'MM')` | 截断到月初 | `TRUNC(CURRENT_DATE, 'MM')` |
| `TRUNC(date, 'Q')` | 截断到季初 | `TRUNC(CURRENT_DATE, 'Q')` |
| `TRUNC(date, 'YY')` | 截断到年初 | `TRUNC(CURRENT_DATE, 'YY')` |
| `ADD_MONTHS(date, N)` | 加减 N 月 | `ADD_MONTHS(CURRENT_DATE, -1)` |
| `LAST_DAY(date)` | 月末 | `LAST_DAY(ADD_MONTHS(CURRENT_DATE, -1))` |
| `DATE_FORMAT(date, fmt)` | 格式化 | `DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd')` |
| `DATEDIFF(end, start)` | 日期差 | `DATEDIFF(CURRENT_DATE, '2026-01-01')` |
| `CURRENT_DATE` | 当前日期 | 返回 date 类型 |
| `CURRENT_TIMESTAMP` | 当前时间戳 | 返回 timestamp 类型 |

---

## 常用模式速查

```sql
-- 最近 7 天（不含今天）
WHERE dt >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, 7), 'yyyy-MM-dd')
  AND dt <  DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd')

-- 最近 7 天（含今天）
WHERE dt >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, 6), 'yyyy-MM-dd')
  AND dt <= DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd')

-- 上月整月
WHERE dt >= DATE_FORMAT(ADD_MONTHS(TRUNC(CURRENT_DATE, 'MM'), -1), 'yyyy-MM-dd')
  AND dt <  DATE_FORMAT(TRUNC(CURRENT_DATE, 'MM'), 'yyyy-MM-dd')

-- 本月至今
WHERE dt >= DATE_FORMAT(TRUNC(CURRENT_DATE, 'MM'), 'yyyy-MM-dd')
  AND dt <= DATE_FORMAT(CURRENT_DATE, 'yyyy-MM-dd')
```

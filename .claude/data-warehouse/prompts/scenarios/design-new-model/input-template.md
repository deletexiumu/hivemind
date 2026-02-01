---
type: input-template
scenario: design-new-model
version: 1.0.0
---

# 设计新模型 - 输入模板

## 字段定义

| 字段名 | 说明 | 类型 | 必填/推荐/可选 |
|--------|------|------|----------------|
| `business_event` | 业务事件名称（一句话描述建模的业务活动） | string | **必填** |
| `grain` | 粒度声明（一行代表什么，如"一笔订单"） | string | **必填** |
| `measures` | 度量字段清单（包含名称、描述、类型） | array | 推荐 |
| `dimensions` | 维度清单（可选择 SCD 类型） | array | 可选 |
| `source` | 数据来源（表名、分区列等） | object | 可选 |

---

## YAML 模板

复制以下模板并填写：

```yaml
# === 必填信息 ===
business_event: ""     # [必填] 业务事件名称，如"订单支付"
grain: ""              # [必填] 粒度声明，如"一笔支付对应一行记录"

# === 推荐信息 ===
measures:              # [推荐] 度量字段清单
  - name: ""           # 字段名（英文）
    desc: ""           # 字段描述（中文）
    type: ""           # 数据类型，如 decimal(18,2)

# === 可选信息 ===
dimensions:            # [可选] 维度清单
  - name: ""           # 维度名称（中文）
    scd: ""            # SCD 类型：Type1/Type2（可选）
    reason: ""         # 选择理由（可选）

source:                # [可选] 数据来源
  table: ""            # 源表名称
  partition_col: ""    # 分区列名
```

---

## 示例输入

### 示例 1：电商订单明细（完整输入）

```yaml
business_event: 订单明细（每个订单行一条记录）
grain: 一个订单 + 一个商品 = 一行

measures:
  - name: quantity
    desc: 数量
  - name: unit_price
    desc: 单价
  - name: order_amount
    desc: 订单金额
  - name: discount_amount
    desc: 折扣金额
  - name: paid_amount
    desc: 实付金额

dimensions:
  - name: 客户
    scd: Type2
    reason: 需追踪会员等级变化
  - name: 商品
    scd: Type1
    reason: 商品信息覆盖即可
  - name: 门店
    scd: Type1
  - name: 日期
  - name: 订单状态

source:
  - ods_mysql.order_header
  - ods_mysql.order_detail
```

### 示例 2：最小输入（仅必填）

```yaml
business_event: 用户浏览页面
grain: 一次页面访问 = 一行
```

> **说明：** 仅提供必填字段时，系统会根据业务事件推断度量和维度，并在 Stage 1 输出假设清单供确认。

---

## 常见错误提示

| 错误类型 | 错误示例 | 正确示例 |
|----------|----------|----------|
| 粒度不明确 | `grain: 订单数据` | `grain: 一笔订单 = 一行` |
| 业务事件过于笼统 | `business_event: 销售` | `business_event: 订单支付（每笔支付一条记录）` |
| 度量字段缺少类型 | `name: amount` | `name: amount, type: decimal(18,2)` |

---

## 输入后的交互流程

1. **Stage 1（规格书）：** 系统解析输入，输出决策摘要、假设清单、待确认问题
2. **Stage 2（完整产物）：** 用户确认后，系统生成星型模型图、DDL、dbt SQL、schema.yml

回复"确认"或"OK"可触发 Stage 2 生成完整产物。

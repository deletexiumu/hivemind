---
type: context
title: 数据仓库命名规范
status: active
version: 1.0.0
domain: global
owner: data-platform
updated_at: 2026-01-31
---

# 数据仓库命名规范

> 本文档定义 HiveMind 数仓系统中所有数据库对象、文件和标识符的命名规则。

## 通用原则

1. **全小写** - 所有名称使用小写字母（Hive 大小写不敏感）
2. **下划线分隔** - 使用 `_` 连接多词，不用驼峰
3. **英文命名** - 表名、字段名使用英文，注释用中文
4. **避免保留字** - 不使用 SQL/Hive 保留字作为名称
5. **语义清晰** - 名称应自解释，避免过度缩写

---

## 1. Schema/数据库命名

### 1.1 格式规则

- 格式：`{layer}_db` 或直接使用分层名
- 全小写，下划线分隔
- 长度：建议 <= 20 字符

### 1.2 正例

```
ods_db          -- ODS 层数据库
dwd_db          -- DWD 层数据库
dws_db          -- DWS 层数据库
ads_db          -- ADS 层数据库
dim_db          -- 维度层数据库
stg_db          -- 暂存层数据库
```

### 1.3 反例

```
DWD_DB          -- 大写 ✗
data-warehouse  -- 使用连字符 ✗
dwdDB           -- 驼峰命名 ✗
d               -- 过度缩写 ✗
```

---

## 2. 表名命名规范

### 2.1 分层前缀（必须）

| 前缀 | 全称 | 含义 | 适用场景 |
|------|------|------|----------|
| `ods_` | Operational Data Store | 操作数据层/贴源层 | 原始数据落地 |
| `dwd_` | Data Warehouse Detail | 明细数据层 | 清洗后明细事实 |
| `dws_` | Data Warehouse Summary | 汇总数据层 | 轻度汇总/主题宽表 |
| `ads_` | Application Data Service | 应用数据层 | 面向应用/报表 |
| `dim_` | Dimension | 维度表 | 描述性属性表 |
| `stg_` | Staging | 暂存/过渡表 | ETL 中间结果 |
| `tmp_` | Temporary | 临时表 | 会话级临时表 |

### 2.2 表类型标识（可选）

跟在分层前缀后，用于进一步分类：

| 标识 | 含义 | 适用场景 | 示例 |
|------|------|----------|------|
| `fact_` | 事实表 | 存储度量值的表 | `dwd_fact_order_detail` |
| `bridge_` | 桥接表 | 多对多关系表 | `dwd_bridge_order_product` |
| `agg_` | 聚合表 | 预聚合汇总表 | `dws_agg_sales_monthly` |
| `snapshot_` | 快照表 | 定期快照表 | `dws_snapshot_inventory_daily` |
| `map_` | 映射表 | 码值映射表 | `dim_map_region_code` |

### 2.3 完整命名模式

```
{layer}_{type?}_{domain}_{entity}_{suffix?}
```

| 组件 | 必须 | 说明 | 示例 |
|------|------|------|------|
| `layer` | 是 | 分层前缀 | `ods_`, `dwd_`, `dws_`, `ads_`, `dim_` |
| `type` | 否 | 表类型标识 | `fact_`, `bridge_`, `agg_` |
| `domain` | 是 | 业务域 | `order`, `customer`, `product`, `payment` |
| `entity` | 是 | 实体/主题 | `orders`, `details`, `daily`, `summary` |
| `suffix` | 否 | 存储策略后缀 | `_di`(增量), `_df`(全量), `_snap`(快照) |

### 2.4 正例（20+ 个）

```
-- ODS 层表
ods_mysql_orders                  -- MySQL 订单原始数据
ods_mysql_customers               -- MySQL 客户原始数据
ods_kafka_user_event              -- Kafka 用户事件流
ods_api_product_info              -- API 产品信息

-- DWD 层表
dwd_fact_order_detail             -- 订单明细事实表
dwd_fact_order_payment            -- 订单支付事实表
dwd_fact_user_behavior            -- 用户行为事实表
dwd_fact_inventory_change         -- 库存变动事实表
dwd_bridge_order_product          -- 订单-产品桥接表
dwd_bridge_user_role              -- 用户-角色桥接表

-- DWS 层表
dws_order_daily                   -- 订单日汇总
dws_user_behavior_weekly          -- 用户行为周汇总
dws_agg_sales_monthly             -- 月度销售聚合表
dws_agg_customer_lifetime         -- 客户生命周期价值汇总
dws_snapshot_inventory_daily      -- 库存日快照

-- ADS 层表
ads_gmv_report                    -- GMV 报表
ads_user_retention                -- 用户留存报表
ads_product_ranking               -- 产品排行报表
ads_regional_sales                -- 区域销售报表

-- 维度表
dim_customer                      -- 客户维度表
dim_product                       -- 产品维度表
dim_date                          -- 日期维度表
dim_region                        -- 地区维度表
dim_store                         -- 门店维度表
dim_employee                      -- 员工维度表

-- 暂存表
stg_orders_cleaned                -- 清洗后订单暂存
stg_customers_dedup               -- 去重后客户暂存
```

### 2.5 反例

```
fact_orders               -- 缺少分层前缀 ✗
DWD_FACT_ORDERS           -- 使用大写 ✗
dwd-fact-orders           -- 使用连字符 ✗
dwd_fact_ord_dtl          -- 过度缩写（ord_dtl 不清晰）✗
orders_dwd_fact           -- 前缀顺序错误 ✗
dwd_订单明细              -- 使用中文 ✗
dwd_factOrderDetail       -- 驼峰命名 ✗
dwd_fact_orders_2024      -- 年份后缀（应使用分区）✗
```

---

## 3. 字段命名规范

### 3.1 通用规则

- 格式：全小写 + 下划线分隔（snake_case）
- 长度：建议 <= 30 字符
- 语义：名称应自解释

### 3.2 字段类型命名模式

| 字段类型 | 命名模式 | 示例 |
|----------|----------|------|
| 主键 | `{entity}_id` | `order_id`, `customer_id`, `product_id` |
| 外键 | `{referenced_entity}_id` | `customer_id`, `store_id` |
| 日期 | `{action}_date` | `order_date`, `create_date`, `expire_date` |
| 时间戳 | `{action}_time` | `create_time`, `update_time`, `login_time` |
| 金额 | `{desc}_amt` 或 `{desc}_amount` | `order_amt`, `payment_amount`, `refund_amt` |
| 数量 | `{desc}_cnt` 或 `{desc}_count` | `order_cnt`, `item_count`, `view_cnt` |
| 比率 | `{desc}_rate` 或 `{desc}_ratio` | `refund_rate`, `conversion_ratio` |
| 百分比 | `{desc}_pct` | `discount_pct`, `tax_pct` |
| 标志 | `is_{desc}` 或 `has_{desc}` | `is_deleted`, `is_active`, `has_refund` |
| 状态 | `{entity}_status` | `order_status`, `payment_status` |
| 名称 | `{entity}_name` | `customer_name`, `product_name` |
| 编码 | `{entity}_code` | `region_code`, `category_code` |
| 描述 | `{entity}_desc` | `product_desc`, `error_desc` |

### 3.3 正例

```sql
-- 主键/外键
order_id                          -- 订单主键
customer_id                       -- 客户外键
product_id                        -- 产品外键

-- 时间相关
order_date                        -- 订单日期
create_time                       -- 创建时间戳
update_time                       -- 更新时间戳
expire_date                       -- 过期日期

-- 金额/数量
order_amt                         -- 订单金额
payment_amount                    -- 支付金额
item_count                        -- 商品数量
order_cnt                         -- 订单数量

-- 标志/状态
is_deleted                        -- 删除标志 (0/1)
is_active                         -- 激活标志
has_refund                        -- 是否有退款
order_status                      -- 订单状态

-- 比率
refund_rate                       -- 退款率
conversion_rate                   -- 转化率
discount_pct                      -- 折扣百分比
```

### 3.4 反例

```sql
orderID                   -- 驼峰命名 ✗
ORDER_ID                  -- 全大写 ✗
order-id                  -- 使用连字符 ✗
ordid                     -- 过度缩写 ✗
oid                       -- 不可读 ✗
deleted                   -- 缺少 is_ 前缀（标志字段）✗
订单金额                  -- 中文字段名 ✗
create_datetime           -- datetime 应拆分为 date/time ✗
amt                       -- 缺少业务含义 ✗
```

---

## 4. 标准字段规范

### 4.1 技术元数据字段（所有表必须）

| 字段名 | 类型 | 含义 | 说明 |
|--------|------|------|------|
| `dw_create_time` | TIMESTAMP | 数据入仓时间 | 记录何时写入数仓 |
| `dw_modify_time` | TIMESTAMP | 数据最后修改时间 | 记录最后一次更新 |
| `etl_date` | DATE | ETL 处理日期 | 批次日期（通常为调度日期） |

### 4.2 事实表标准字段

| 字段名 | 类型 | 含义 | 说明 |
|--------|------|------|------|
| `is_deleted` | TINYINT | 逻辑删除标识 | 0=有效, 1=删除 |
| `data_source` | STRING | 数据来源标识 | 如 `mysql`, `kafka`, `api` |

### 4.3 维度表标准字段（SCD Type 2）

| 字段名 | 类型 | 含义 | 说明 |
|--------|------|------|------|
| `dw_valid_from` | DATE | 有效起始日期 | SCD Type 2 起始 |
| `dw_valid_to` | DATE | 有效截止日期 | SCD Type 2 截止（9999-12-31 表示当前） |
| `is_current` | TINYINT | 是否当前版本 | 0=历史版本, 1=当前版本 |

### 4.4 分区字段

| 字段名 | 类型 | 含义 | 说明 |
|--------|------|------|------|
| `dt` | STRING | 日期分区 | 格式 `yyyy-MM-dd` |
| `hour` | STRING | 小时分区 | 格式 `HH`（00-23） |

### 4.5 完整示例

```sql
-- 事实表示例
CREATE TABLE dwd_fact_order_detail (
    order_id            BIGINT      COMMENT '订单ID',
    order_item_id       BIGINT      COMMENT '订单明细ID',
    customer_id         BIGINT      COMMENT '客户ID',
    product_id          BIGINT      COMMENT '产品ID',
    order_date          DATE        COMMENT '订单日期',
    quantity            INT         COMMENT '购买数量',
    unit_price          DECIMAL(18,2) COMMENT '单价',
    order_amt           DECIMAL(18,2) COMMENT '订单金额',
    discount_amt        DECIMAL(18,2) COMMENT '折扣金额',
    payment_amt         DECIMAL(18,2) COMMENT '实付金额',
    order_status        STRING      COMMENT '订单状态',
    is_deleted          TINYINT     COMMENT '删除标志 0/1',
    data_source         STRING      COMMENT '数据来源',
    dw_create_time      TIMESTAMP   COMMENT '数据入仓时间',
    dw_modify_time      TIMESTAMP   COMMENT '数据修改时间',
    etl_date            DATE        COMMENT 'ETL处理日期'
)
PARTITIONED BY (dt STRING COMMENT '日期分区')
COMMENT '订单明细事实表';

-- 维度表示例
CREATE TABLE dim_customer (
    customer_id         BIGINT      COMMENT '客户ID（自然键）',
    customer_sk         BIGINT      COMMENT '客户代理键',
    customer_name       STRING      COMMENT '客户姓名',
    customer_level      STRING      COMMENT '客户等级',
    region_code         STRING      COMMENT '地区编码',
    city_name           STRING      COMMENT '城市名称',
    register_date       DATE        COMMENT '注册日期',
    is_vip              TINYINT     COMMENT 'VIP标志 0/1',
    dw_valid_from       DATE        COMMENT 'SCD有效起始',
    dw_valid_to         DATE        COMMENT 'SCD有效截止',
    is_current          TINYINT     COMMENT '当前版本标志 0/1',
    dw_create_time      TIMESTAMP   COMMENT '数据入仓时间',
    dw_modify_time      TIMESTAMP   COMMENT '数据修改时间',
    etl_date            DATE        COMMENT 'ETL处理日期'
)
COMMENT '客户维度表（SCD Type 2）';
```

---

## 5. 文件/目录命名规范

### 5.1 目录命名

- 格式：**kebab-case**（全小写 + 连字符）
- 示例：`data-warehouse/`, `design-new-model/`, `sql-style/`

### 5.2 文档文件命名

- 格式：**kebab-case**（全小写 + 连字符）
- 扩展名：`.md`
- 示例：`naming.md`, `token-budget.md`, `zh-en-terms.md`

### 5.3 模型文件命名

- 格式：**snake_case**（与表名一致）
- 扩展名：`.sql`
- 示例：`dwd_fact_orders.sql`, `dim_customer.sql`

### 5.4 正反例对比

| 对象类型 | 正例 | 反例 |
|----------|------|------|
| 目录 | `data-warehouse/` | `data_warehouse/`, `DataWarehouse/` |
| 文档 | `naming.md` | `Naming.md`, `naming_conventions.md` |
| 模型 | `dwd_fact_orders.sql` | `dwd-fact-orders.sql`, `DwdFactOrders.sql` |

---

## 6. 命名检查清单

### 6.1 表名检查

- [ ] 是否使用分层前缀（ods_/dwd_/dws_/ads_/dim_/stg_）？
- [ ] 是否全小写？
- [ ] 是否使用下划线分隔？
- [ ] 是否避免使用连字符？
- [ ] 是否避免过度缩写？
- [ ] 业务域是否清晰可识别？
- [ ] 实体名是否自解释？
- [ ] 是否避免使用中文？
- [ ] 是否避免使用 SQL 保留字？
- [ ] 长度是否 <= 64 字符？

### 6.2 字段名检查

- [ ] 是否全小写？
- [ ] 是否使用下划线分隔？
- [ ] 主键是否使用 `{entity}_id` 格式？
- [ ] 日期字段是否使用 `_date` 后缀？
- [ ] 时间字段是否使用 `_time` 后缀？
- [ ] 金额字段是否使用 `_amt` 或 `_amount` 后缀？
- [ ] 数量字段是否使用 `_cnt` 或 `_count` 后缀？
- [ ] 标志字段是否使用 `is_` 或 `has_` 前缀？
- [ ] 是否包含必要的技术元数据字段？
- [ ] 是否避免使用中文？

### 6.3 标准字段检查

- [ ] 是否包含 `dw_create_time`？
- [ ] 是否包含 `dw_modify_time`？
- [ ] 是否包含 `etl_date`？
- [ ] 事实表是否包含 `is_deleted`？
- [ ] 维度表是否包含 SCD 字段（Type 2 时）？
- [ ] 分区表是否使用标准分区字段（dt/hour）？

### 6.4 文件命名检查

- [ ] 目录是否使用 kebab-case？
- [ ] 文档文件是否使用 kebab-case？
- [ ] 模型文件是否使用 snake_case？
- [ ] 模型文件名是否与表名一致？

---

## 7. 附录：常用缩写对照

| 缩写 | 全称 | 说明 |
|------|------|------|
| `id` | identifier | 标识符 |
| `amt` | amount | 金额 |
| `cnt` | count | 数量 |
| `qty` | quantity | 数量（物理） |
| `pct` | percent | 百分比 |
| `dt` | date | 日期（分区） |
| `sk` | surrogate key | 代理键 |
| `bk` | business key | 业务键 |
| `fk` | foreign key | 外键 |
| `pk` | primary key | 主键 |
| `dw` | data warehouse | 数仓 |
| `etl` | extract-transform-load | 数据抽取转换加载 |

---

*Version: 1.0.0 | Updated: 2026-01-31 | Owner: data-platform*

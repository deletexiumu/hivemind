---
type: context
title: 平台约束库索引
status: draft
version: 1.0.0
domain: platform
owner: data-platform
updated_at: 2026-01-31
---

# 平台约束库索引

平台约束库定义 Hive 3.x + dbt-hive 平台的能力边界与最佳实践。文档面向两类读者：**数据工程师**（编写 dbt 模型、优化 SQL）和 **Claude 提示系统**（生成符合平台约束的代码）。

> **核心原则:** 非 ACID 模式下，分区回刷 (INSERT OVERWRITE PARTITION) 是唯一可靠的增量策略。

---

## P0 约束速查表

| ID | 约束名称 | 等级 | 一句话说明 | 所属文档 |
|----|---------|------|-----------|---------|
| HIVE-001 | 动态分区列位置 | P0 | 分区列必须在 SELECT 末尾 | [hive-constraints.md](./hive-constraints.md#hive-001) |
| HIVE-002 | 分区列非空 | P0 | dt 必须 NOT NULL，否则落默认分区 | [hive-constraints.md](./hive-constraints.md#hive-002) |
| HIVE-003 | 分区列格式 | P0 | dt 必须为 yyyy-MM-dd 格式 | [hive-constraints.md](./hive-constraints.md#hive-003) |
| HIVE-004 | 分区并发控制 | P0 | 禁止并发回刷同一分区 | [hive-constraints.md](./hive-constraints.md#hive-004) |
| HIVE-010 | MERGE 表类型 | P0 | MERGE 仅支持 ACID 表 | [hive-constraints.md](./hive-constraints.md#hive-010) |
| HIVE-011 | 行级更新表类型 | P0 | UPDATE/DELETE 仅支持 ACID 表 | [hive-constraints.md](./hive-constraints.md#hive-011) |
| HIVE-014 | 禁止 SELECT * | P0 | 列漂移导致静默错数 | [hive-constraints.md](./hive-constraints.md#hive-014) |
| HIVE-015 | 分区内去重 | P0 | 业务键 + dt 唯一，取最新版本 | [hive-constraints.md](./hive-constraints.md#hive-015) |
| HIVE-018 | 分区裁剪 | P0 | WHERE 必须包含分区条件 | [hive-constraints.md](./hive-constraints.md#hive-018) |
| DBT-HIVE-001 | 不支持 Snapshots | P0 | 用增量模型 + SCD2 替代 | [dbt-hive-limitations.md](./dbt-hive-limitations.md#dbt-hive-001) |
| DBT-HIVE-002 | 不支持 Ephemeral | P0 | 使用 View 物化替代 | [dbt-hive-limitations.md](./dbt-hive-limitations.md#dbt-hive-002) |
| DBT-HIVE-003 | insert_overwrite 必须配分区 | P0 | 否则全表覆盖 | [dbt-hive-limitations.md](./dbt-hive-limitations.md#dbt-hive-003) |

---

## 文档列表

| 文档 | 覆盖需求 | 聚焦领域 | 一句话描述 | 状态 |
|------|---------|---------|-----------|------|
| [hive-constraints.md](./hive-constraints.md) | PLATFORM-01 | Hive 平台约束 | 分区/ORC/ACID/性能优化约束 | planned |
| [dbt-hive-limitations.md](./dbt-hive-limitations.md) | PLATFORM-02 | dbt-hive 限制 | Snapshots/Ephemeral/分区列限制 | planned |
| [incremental-strategies.md](./incremental-strategies.md) | PLATFORM-03 | 增量策略 | T+1/insert_overwrite/lookback 模式 | planned |

---

## 阅读顺序建议

1. **[Hive 平台约束](./hive-constraints.md)** — 了解 Hive 3.x 平台能力边界（分区、ORC、ACID）
2. **[dbt-hive 限制](./dbt-hive-limitations.md)** — 了解适配器限制（Snapshots、Ephemeral、分区列）
3. **[增量策略](./incremental-strategies.md)** — 掌握 T+1 回刷模式与 lookback 窗口

> 建议按顺序阅读。理解 Hive 约束后再看 dbt-hive 限制，最后综合学习增量策略。

---

## 版本信息

| 平台组件 | 目标版本 | 备注 |
|---------|---------|------|
| Hive | 3.x | 非 ACID 模式为主，ORC 存储格式 |
| dbt-hive | 1.10.x | Cloudera 维护，dbt-core 1.10.x 兼容 |
| dbt-core | 1.10.x | 与 dbt-hive 配套 |

---

## 参考文献

- [dbt-hive Official Documentation](https://docs.getdbt.com/reference/resource-configs/hive-configs)
- [Hive Language Manual DML](https://cwiki.apache.org/confluence/display/hive/languagemanual+dml)
- [Hive Transactions Wiki](https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions)

---

*Version: 1.0.0 | Updated: 2026-01-31 | Owner: data-platform*

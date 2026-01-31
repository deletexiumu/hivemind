---
type: context
title: 方法论库索引
status: stable
version: 1.0.0
domain: methodology
owner: data-platform
updated_at: 2026-01-31
---

# 方法论库索引

方法论库为 HiveMind 数仓系统提供 Kimball 维度建模的理论支撑和实践指南。文档面向两类读者：**数据工程师**（设计模型、编写 dbt 代码）和**数据分析师**（理解口径、正确使用数据）。每篇文档采用双轨标识 `[Analyst]/[Engineer]` 穿插呈现。

---

## 文档列表

| 文档 | 覆盖需求 | 聚焦领域 | 一句话描述 | 状态 |
|------|---------|---------|-----------|------|
| [dimensional-modeling.md](./dimensional-modeling.md) | METHOD-01 | 模式与一致性 | Kimball 四步法、星型/雪花、一致性维度、Bus Matrix、特殊维度模式 | stable |
| [fact-table-types.md](./fact-table-types.md) | METHOD-02 | 事实与口径 | 事务/周期快照/累积快照、可加性、查询模式 | planned |
| [scd-strategies.md](./scd-strategies.md) | METHOD-03 | 历史与回溯 | SCD Type 1/2/3 选型、dbt-hive 实现（无 Snapshots） | planned |
| [layering-system.md](../layers/layering-system.md) | METHOD-04 | 落层与治理边界 | ODS/DWD/DWS/ADS 定义、跨层规则 | planned |

> **注意**: 以上四个文档由 Phase 02 的计划分别创建。当前索引页创建时，仅 `dimensional-modeling.md` 可用。

---

## 阅读顺序建议

1. **[Kimball 维度建模](./dimensional-modeling.md)** — 建立概念框架（粒度、星型模型、一致性维度）
2. **[事实表类型](./fact-table-types.md)** — 深入事实表设计（类型选型、可加性、查询模式）
3. **[SCD 策略](./scd-strategies.md)** — 掌握维度变更处理（历史追溯、dbt-hive 实现）
4. **[分层体系](../layers/layering-system.md)** — 理解数据落层边界（ODS/DWD/DWS/ADS）

> 建议按顺序阅读。如果只关心特定主题，可直接跳转。

---

## 参考文献

- **《数据仓库工具箱》第三版** — Ralph Kimball, Margy Ross（维度建模权威参考）
- **[Kimball Group](https://www.kimballgroup.com/)** — Kimball 维度建模技术官方资源
- **[阿里云 DataWorks 分层规范](https://help.aliyun.com/zh/dataworks/use-cases/data-layer)** — ODS/DWD/DWS/ADS 分层标准

---

*Version: 1.0.0 | Updated: 2026-01-31 | Owner: data-platform*

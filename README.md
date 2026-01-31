<div align="center">

# HiveMind

**基于 Hive + dbt 的智能数仓研发助手**

一套面向离线数仓的中文提示系统，覆盖模型评审、模型设计、SQL 生成、指标定义、DQ 规则、血缘分析六大核心场景。

[![GitHub stars](https://img.shields.io/github/stars/deletexiumu/hivemind?style=for-the-badge&logo=github&color=181717)](https://github.com/deletexiumu/hivemind)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Progress](https://img.shields.io/badge/progress-25%25-yellow?style=for-the-badge)](https://github.com/deletexiumu/hivemind)

</div>

---

## 项目简介

HiveMind 是一套可组合的中文提示包系统，将 Hive + dbt 数仓的六类高频任务标准化为**可复用、可追溯、带质量门禁**的输出。

### 核心价值

- **标准化输出** — 统一的模型设计规范、指标口径定义、DQ 规则模板
- **中文优先** — 全部提示、规范、输出均为中文，代码标识符保持英文
- **可组合架构** — 按场景/角色自动组装上下文，灵活应对不同任务

---

## 六大核心场景

| 场景 | 输入 | 输出 |
|------|------|------|
| **评审已有模型** | 模型 SQL / dbt 配置 / DDL / 样例数据 | 问题清单 + 严重级别 + 修复建议 |
| **设计新模型** | 业务事件 / 指标 / 粒度 / 样例数据 | 星型设计 + 事实/维度定义 + SCD策略 + 分层落点 |
| **生成导数 SQL** | 取数口径 / 过滤 / 时间窗 / 样例数据 | 符合规范的 SQL + 口径说明 + 性能提示 |
| **指标口径定义** | 业务需求 / 指标描述 / 样例数据 | 原子指标 + 派生指标 + 计算逻辑 + 版本管理 |
| **生成 DQ 规则** | 模型/表定义 / 样例数据 | dbt test 配置 + 自定义检测 SQL |
| **数据血缘分析** | SQL / dbt 模型 | 字段级血缘 + 影响评估 + 变更传导 |

---

## 技术栈

| 组件 | 选型 | 说明 |
|------|------|------|
| 数仓平台 | Hive 4.x | 推荐 4.0+，支持 ACID 可选 |
| 建模工具 | dbt-hive 1.10.0 | 注意：不支持 Snapshots、Ephemeral |
| 建模方法论 | Kimball 维度建模 | 星型/雪花模型 |
| 分层体系 | ODS/DWD/DWS/ADS | 国内主流分层架构 |
| 存储格式 | ORC | 推荐非事务表，避免 Compaction 复杂性 |
| 增量策略 | INSERT OVERWRITE | 分区级回刷，支持迟到数据 |
| 数据时效 | T+1 离线 | 本版本聚焦离线场景 |

---

## 项目结构

```
hivemind/
├── .claude/data-warehouse/         # 数仓提示系统
│   ├── prompts/                    # 提示模板
│   │   ├── system/                 # 系统角色提示
│   │   └── scenarios/              # 六大场景提示（Phase 4-7 构建）
│   ├── context/                    # 规范上下文
│   │   ├── methodology/            # Kimball 方法论文档 ✓
│   │   │   ├── index.md            # 方法论索引
│   │   │   ├── dimensional-modeling.md  # 维度建模核心概念
│   │   │   ├── fact-table-types.md      # 事实表类型指南
│   │   │   └── scd-strategies.md        # SCD 策略指南
│   │   ├── layers/                 # 分层体系 ✓
│   │   │   └── layering-system.md  # ODS/DWD/DWS/ADS 规范
│   │   └── global/                 # 全局规范
│   ├── docs/                       # 规范文档 ✓
│   │   ├── naming.md               # 命名规范
│   │   ├── prompting.md            # 提示工程规范
│   │   └── token-budget.md         # Token 预算
│   └── glossary/                   # 术语表 ✓
│       └── terms.md                # 89 条中英术语对照
├── .planning/                      # 项目规划
│   ├── PROJECT.md                  # 项目定义
│   ├── REQUIREMENTS.md             # 48 个 v1 需求
│   ├── ROADMAP.md                  # 8 阶段路线图
│   ├── STATE.md                    # 项目状态追踪
│   └── phases/                     # 阶段规划与执行记录
└── README.md
```

---

## 开发路线

| 阶段 | 内容 | 状态 | 完成度 |
|------|------|------|--------|
| **Phase 1** | 基础设施：目录结构、术语表（89条）、命名规范、Token 规范 | ✅ 完成 | 100% |
| **Phase 2** | 方法论库：Kimball 四步法、事实表类型、SCD 策略、分层体系 | ✅ 完成 | 100% |
| Phase 3 | 平台约束：Hive 规范、dbt-hive 限制、增量策略 | 待执行 | 0% |
| Phase 4 | 设计场景：新模型设计提示、模板、成功标准 | 待规划 | 0% |
| Phase 5 | 评审场景：模型评审提示、检查清单、修复建议 | 待规划 | 0% |
| Phase 6 | 治理场景：指标定义、DQ 规则生成、基础血缘 | 待规划 | 0% |
| Phase 7 | SQL 生成 + 血缘：SQL 生成、血缘分析、影响评估 | 待规划 | 0% |
| Phase 8 | 工具化：提示包组装、规格校验、集成框架 | 待规划 | 0% |

**整体进度：** 25%（2/8 阶段，6/24 计划）

---

## 已完成交付物

### Phase 1: 基础设施

| 交付物 | 说明 |
|--------|------|
| 目录结构 | `.claude/data-warehouse/` 标准化目录 |
| 术语表 | 89 条中英术语对照，覆盖维度建模、分层、指标、SCD 四大领域 |
| 命名规范 | 表名/字段名/文件名统一规范，含 20+ 正反例 |
| Token 预算 | 单文件 < 2000 tokens，组装后 < 4000 tokens |

### Phase 2: 方法论库

| 文档 | 行数 | 核心内容 |
|------|------|----------|
| `dimensional-modeling.md` | 329 | Kimball 四步法、星型/雪花模型、一致性维度、Bus Matrix、5 种特殊维度模式 |
| `fact-table-types.md` | 501 | 事务/周期快照/累积快照/无事实事实表、可加性规范、迟到事实处理 |
| `scd-strategies.md` | 649 | SCD Type 1/2/3、dbt-hive 无 Snapshots 实现、5 约束字段合同 |
| `layering-system.md` | 449 | ODS/DWD/DWS/ADS 四层定义、跨层规则、回刷窗口约束 |

**质量指标：**
- 45 个代码示例（SQL/YAML/Mermaid）
- 49 处双受众标识（[Analyst]/[Engineer]）
- 34 项检查清单

---

## 快速开始

### 前置条件

- [Claude Code](https://claude.ai/claude-code) CLI 工具
- Node.js 18+

### 安装

```bash
# 克隆项目
git clone https://github.com/deletexiumu/hivemind.git
cd hivemind
```

### 使用

```bash
# 查看项目进度
/gsd:progress

# 规划下一阶段
/gsd:plan-phase 3

# 执行阶段
/gsd:execute-phase 3
```

---

## 设计原则

### 中文化策略

| 层面 | 策略 |
|------|------|
| 提示模板 | 全中文 |
| 规范文档 | 全中文 |
| 输出内容 | 全中文 |
| 代码标识符 | 保持英文（避免编码问题） |
| 术语 | 提供中英对照表 |

### 双受众设计

所有方法论文档采用 `[Analyst]/[Engineer]` 同页双轨标识：
- **[Analyst]** — 口径定义、查询模式、数据解读
- **[Engineer]** — 字段合同、建表骨架、增量策略、dbt tests

### dbt-hive 约束

| 特性 | 支持情况 | 替代方案 |
|------|----------|----------|
| Snapshots | ❌ 不支持 | 手动 SCD2（全量重建 / Current-History 拆分） |
| Ephemeral | ❌ 不支持 | 使用 View 或 CTE |
| Incremental | ✅ 支持 | INSERT OVERWRITE 分区回刷 |

---

## 许可证

MIT License. 详见 [LICENSE](LICENSE)。

---

<div align="center">

**HiveMind — 让数仓研发更规范、更高效**

*Last updated: 2026-01-31 | Phase 2 Complete*

</div>

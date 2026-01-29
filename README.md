<div align="center">

# HiveMind

**基于 Hive + dbt 的智能数仓研发助手**

一套面向离线数仓的中文提示系统，覆盖模型评审、模型设计、SQL 生成、指标定义、DQ 规则、血缘分析六大核心场景。

[![GitHub stars](https://img.shields.io/github/stars/deletexiumu/hivemind?style=for-the-badge&logo=github&color=181717)](https://github.com/deletexiumu/hivemind)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

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
| 数仓平台 | Hive 3.x | 推荐 3.1.x，4.x 未来可选 |
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
├── prompts/                    # 提示模板
│   ├── scenarios/              # 六大场景提示
│   │   ├── model-review/       # 模型评审
│   │   ├── model-design/       # 模型设计
│   │   ├── sql-gen/            # SQL 生成
│   │   ├── metric-define/      # 指标定义
│   │   ├── dq-rules/           # DQ 规则
│   │   └── lineage/            # 血缘分析
│   └── shared/                 # 共享提示片段
├── context/                    # 规范上下文
│   ├── naming.md               # 命名规范
│   ├── layering.md             # 分层体系
│   ├── kimball.md              # Kimball 建模规范
│   ├── hive-platform.md        # Hive 平台约束
│   └── glossary.md             # 中英术语对照
├── knowledge/                  # 项目知识库（自动滚动）
│   ├── business/               # 业务术语表
│   ├── structure/              # 已有表结构
│   └── experience/             # 经验知识
├── examples/                   # 样例数据
│   ├── model_design/           # 模型设计样例
│   ├── model_review/           # 模型评审样例
│   └── sql_gen/                # SQL 生成样例
└── .planning/                  # HiveMind 规划文件
    ├── PROJECT.md              # 项目定义
    ├── REQUIREMENTS.md         # 需求列表
    ├── ROADMAP.md              # 路线图
    └── research/               # 研究文档
```

---

## 快速开始

### 前置条件

- [Claude Code](https://claude.ai/claude-code) 或 [OpenCode](https://github.com/opencode-ai/opencode)
- Node.js 18+

### 安装

```bash
# 克隆项目
git clone https://github.com/deletexiumu/hivemind.git
cd hivemind

# 安装 HiveMind 命令（如未安装）
npx hivemind-cc --claude --local
```

### 使用

```bash
# 查看项目进度
/dw:progress

# 规划下一阶段
/dw:plan-phase 1

# 执行阶段
/dw:execute-phase 1
```

---

## 开发路线

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 基础设施：目录结构、术语表、命名规范、Token 规范 | ✅ 规划完成 |
| Phase 2 | 方法论库：Kimball 文档、事实表、维度、SCD 指南 | 待规划 |
| Phase 3 | 平台约束：Hive 规范、dbt-hive 限制、增量策略 | 待规划 |
| Phase 4 | 设计场景：新模型设计提示、模板、成功标准 | 待规划 |
| Phase 5 | 评审场景：模型评审提示、检查清单、修复建议 | 待规划 |
| Phase 6 | 治理场景：指标定义、DQ 规则生成、基础血缘 | 待规划 |
| Phase 7 | SQL 生成 + 血缘：SQL 生成、血缘分析、影响评估 | 待规划 |
| Phase 8 | 工具化：提示包组装、规格校验、集成框架 | 待规划 |

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

### 防过度设计

- 先验证场景可用性，再考虑优化
- 每个场景独立可用，不强制全链路
- 避免过早抽象，3次以上重复再考虑复用

### dbt-hive 约束

| 特性 | 支持情况 | 替代方案 |
|------|----------|----------|
| Snapshots | 不支持 | 手动 SCD2 模板 |
| Ephemeral | 不支持 | 使用 View |
| Incremental | 支持 | INSERT OVERWRITE 分区 |

---

## 许可证

MIT License. 详见 [LICENSE](LICENSE)。

---

<div align="center">

**HiveMind — 让数仓研发更规范、更高效**

</div>

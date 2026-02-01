<div align="center">

# HiveMind

**基于 Hive + dbt 的智能数仓研发助手**

一套面向离线数仓的中文提示系统，覆盖模型评审、模型设计、SQL 生成、指标定义、DQ 规则、血缘分析六大核心场景。

[![GitHub stars](https://img.shields.io/github/stars/deletexiumu/hivemind?style=for-the-badge&logo=github&color=181717)](https://github.com/deletexiumu/hivemind)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Progress](https://img.shields.io/badge/v1.0-complete-brightgreen?style=for-the-badge)](https://github.com/deletexiumu/hivemind)

</div>

---

## 项目简介

HiveMind 是一套可组合的中文提示包系统，将 Hive + dbt 数仓的六类高频任务标准化为**可复用、可追溯、带质量门禁**的输出。

### 核心价值

- **标准化输出** — 统一的模型设计规范、指标口径定义、DQ 规则模板
- **中文优先** — 全部提示、规范、输出均为中文，代码标识符保持英文
- **可组合架构** — 按场景/角色自动组装上下文，灵活应对不同任务
- **工具化集成** — 9 个斜杠命令，开箱即用

---

## 快速开始

### 前置条件

- [Claude Code](https://claude.ai/claude-code) CLI 工具
- Node.js 22+

### 安装

```bash
# 克隆项目
git clone https://github.com/deletexiumu/hivemind.git
cd hivemind

# 安装工具依赖
cd .claude/data-warehouse && npm install
```

### 使用命令

| 命令 | 用途 | 示例 |
|------|------|------|
| `/dw:design` | 设计新模型 | `/dw:design 订单支付事实表` |
| `/dw:review` | 评审已有模型 | `/dw:review` |
| `/dw:generate-sql` | 生成取数 SQL | `/dw:generate-sql 最近30天订单` |
| `/dw:define-metric` | 定义指标口径 | `/dw:define-metric 订单总额` |
| `/dw:generate-dq` | 生成 DQ 规则 | `/dw:generate-dq` |
| `/dw:analyze-lineage` | 分析数据血缘 | `/dw:analyze-lineage` |

**工具命令：**

| 命令 | 用途 |
|------|------|
| `/dw:assemble` | 组装完整提示（调试用） |
| `/dw:validate` | 校验输入/输出规格 |
| `/dw:new-scenario` | 创建新场景脚手架 |

详细使用指南见 [.claude/data-warehouse/README.md](.claude/data-warehouse/README.md)

---

## 六大核心场景

| 场景 | 输入 | 输出 |
|------|------|------|
| **评审已有模型** | 模型 SQL / dbt 配置 / DDL | 问题清单 + 严重级别 + 修复建议 |
| **设计新模型** | 业务事件 / 指标 / 粒度 | 星型设计 + 事实/维度定义 + SCD策略 + dbt 模板 |
| **生成导数 SQL** | 取数口径 / 过滤 / 时间窗 | 符合规范的 SQL + 口径说明 + 性能提示 |
| **指标口径定义** | 业务需求 / 指标描述 | 指标定义 + Semantic Layer YAML |
| **生成 DQ 规则** | 模型/表定义 | dbt tests 配置 + 阈值设定 |
| **数据血缘分析** | SQL / dbt 模型 | 表级/字段级血缘 + 影响评估 + Mermaid 图 |

---

## 技术栈

| 组件 | 选型 | 说明 |
|------|------|------|
| 数仓平台 | Hive 4.x | 推荐 4.0+ |
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
├── .claude/
│   ├── commands/dw/              # 9 个 /dw:* 命令
│   │   ├── design.md
│   │   ├── review.md
│   │   ├── generate-sql.md
│   │   ├── define-metric.md
│   │   ├── generate-dq.md
│   │   ├── analyze-lineage.md
│   │   ├── assemble.md
│   │   ├── validate.md
│   │   └── new-scenario.md
│   └── data-warehouse/           # 数仓提示系统
│       ├── prompts/scenarios/    # 6 个场景
│       │   ├── design-new-model/
│       │   ├── review-existing-model/
│       │   ├── generate-sql/
│       │   ├── define-metrics/
│       │   ├── generate-dq-rules/
│       │   └── analyze-lineage/
│       ├── context/              # 上下文知识库
│       │   ├── methodology/      # Kimball 方法论
│       │   ├── platform/         # Hive/dbt-hive 约束
│       │   ├── layers/           # 分层规范
│       │   └── governance/       # 指标/DQ 规范
│       ├── config/               # 配置文件
│       │   ├── scenarios.yaml
│       │   ├── platforms.yaml
│       │   └── assembly-rules.yaml
│       ├── schemas/              # JSON Schema
│       │   ├── input/            # 6 个输入校验
│       │   └── output/           # 6 个输出校验
│       ├── scripts/              # 辅助脚本
│       │   ├── assemble.js       # 提示组装
│       │   ├── validate.js       # 规格校验
│       │   └── scaffold.js       # 脚手架生成
│       ├── glossary/terms.md     # 89 条中英术语
│       ├── docs/                 # 规范文档
│       └── README.md             # 工具使用指南
├── .planning/                    # 项目规划
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md           # 48 个 v1 需求
│   ├── ROADMAP.md                # 8 阶段路线图
│   └── STATE.md                  # 项目状态
└── README.md
```

---

## 开发路线

| 阶段 | 内容 | 状态 |
|------|------|------|
| **Phase 1** | 基础设施：目录结构、术语表（89条）、命名规范、Token 规范 | ✅ 完成 |
| **Phase 2** | 方法论库：Kimball 四步法、事实表类型、SCD 策略、分层体系 | ✅ 完成 |
| **Phase 3** | 平台约束：Hive 规范、dbt-hive 限制、增量策略 | ✅ 完成 |
| **Phase 4** | 设计场景：新模型设计提示、模板、案例库（两段式交互） | ✅ 完成 |
| **Phase 5** | 评审场景：模型评审提示、检查清单（33条）、修复建议、案例库 | ✅ 完成 |
| **Phase 6** | 治理场景：指标定义、DQ 规则生成、基础血缘分析 | ✅ 完成 |
| **Phase 7** | SQL 生成 + 血缘增强：SQL 生成、血缘分析、变更影响评估 | ✅ 完成 |
| **Phase 8** | 工具化：提示组装、规格校验、/dw:* 命令、文档 | ✅ 完成 |

**v1.0 完成：** 100%（8/8 阶段，48/48 需求）

---

## 已完成交付物

### Phase 1-3: 基础设施与知识库

| 交付物 | 说明 |
|--------|------|
| 术语表 | 89 条中英术语对照，覆盖维度建模、分层、指标、SCD 四大领域 |
| 命名规范 | 表名/字段名/文件名统一规范，含 20+ 正反例 |
| 方法论文档 | Kimball 四步法、事实表类型、SCD 策略、分层体系（4 份，共 1928 行） |
| 平台约束 | Hive 规范、dbt-hive 限制、增量策略（3 份） |
| 精简版上下文 | 7 个 `*-core.md` 文件，供场景提示运行时注入 |

### Phase 4-5: 设计与评审场景

| 场景 | 核心文件 | 案例数 |
|------|----------|--------|
| 设计新模型 | prompt.md + output-template.md + input-template.md | 3 个 |
| 评审已有模型 | prompt.md + 检查清单（33条）+ 修复建议模板 | 3 个 |

**设计机制：**
- 两段式交互（Stage 1 确认 → Stage 2 生成）
- P0 门禁 + 质量分评估

### Phase 6: 治理场景

| 场景 | 核心能力 | 案例数 |
|------|----------|--------|
| 指标定义 | 原子/派生/复合分类 + Semantic Layer YAML | 2 个 |
| DQ 规则生成 | 5 类检测（unique/not_null/accepted_values/relationships/freshness） | 2 个 |
| 血缘分析 | 表级 + 字段级血缘 + A-D 精度等级 | 2 个 |

### Phase 7: SQL 生成与血缘增强

| 场景 | 核心能力 | 案例数 |
|------|----------|--------|
| SQL 生成 | 分区裁剪强制 + 口径说明 + 性能提示 | 3 个 |
| 血缘增强 | 边级置信度 + 变更影响评估 | 2 个 |

**SQL 生成特性：**
- 8 类必问项（取数目标/数据源/分区/时间/过滤/SCD2/聚合/成本）
- P0/P1/P2 三级校验（分区缺失阻断、笛卡尔积阻断）
- 动态时间表达优先（DATE_SUB/TRUNC > 硬编码）

### Phase 8: 工具化

| 交付物 | 说明 |
|--------|------|
| 配置文件 | scenarios.yaml + platforms.yaml + assembly-rules.yaml |
| JSON Schema | 12 个（6 输入 + 6 输出），含中文错误提示 |
| 输入模板 | 6 个 input-template.md，结构化用户输入 |
| 辅助脚本 | assemble.js（511行）+ validate.js（517行）+ scaffold.js（538行） |
| 命令文件 | 9 个 `/dw:*` 命令 |
| 文档 | README.md（526行）+ extending.md（901行） |

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

## 扩展开发

想要添加新场景或新平台支持？参见 [扩展开发指南](.claude/data-warehouse/docs/extending.md)。

```bash
# 快速创建新场景脚手架
/dw:new-scenario my-new-scenario --name="我的新场景"
```

---

## 许可证

MIT License. 详见 [LICENSE](LICENSE)。

---

<div align="center">

**HiveMind — 让数仓研发更规范、更高效**

*v1.0 Complete | 2026-02-01 | 48/48 需求 | 8/8 阶段*

</div>

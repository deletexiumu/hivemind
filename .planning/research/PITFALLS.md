# 数仓提示系统陷阱指南

**领域:** 数仓提示系统（Hive + dbt + Claude）
**研究日期:** 2026-01-30
**置信度:** MEDIUM（多来源交叉验证）

---

## 关键陷阱

导致重写或重大问题的错误。

### 陷阱 1: 提示系统过度复杂化（Mega-Prompt 反模式）

**问题描述:** 将所有指令、数据、格式规则塞入单一巨型提示中，创建"指令碰撞"风险——模型困惑后开始忽略部分指令。

**根本原因:**
- 缺乏模块化思维
- 试图用一个提示解决所有问题
- 未将提示视为"代码"来管理

**后果:**
- 输出不稳定、不可预测
- 难以调试——不知道哪个指令出了问题
- 维护成本指数增长

**预防策略:**
```
采用模块化提示架构：
├── core/           # 核心行为模块
│   ├── role.md     # 角色定义
│   └── safety.md   # 安全约束
├── skills/         # 技能模块
│   ├── hive-sql.md
│   └── dbt-model.md
└── scenarios/      # 场景组装
    └── dim-table.md  # 组合 core + skills
```

**检测信号:**
- 单个提示文件超过 2000 tokens
- 频繁出现"AI 忽略了某些指令"
- 调试时无法隔离问题

**应解决阶段:** Phase 1（基础架构）

---

### 陷阱 2: dbt-hive 分区列处理错误

**问题描述:** 在 dbt-hive 中，分区列的处理有严格规则，违反会导致数据丢失或建模失败。

**根本原因:**
- 不了解 Hive ACID 表限制
- 增量模型配置不当

**后果:**
- `incremental merge` + 分区列 = 不支持（Hive ACID 不允许更新分区列）
- `incremental insert_overwrite` 不带分区列 = 全表覆盖，数据丢失
- SELECT 语句中分区列位置错误 = 建模失败

**预防策略:**
```yaml
# dbt 模型配置示例
{{ config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by=['dt'],  # 分区列必须是 SELECT 的最后一列
    file_format='orc'
) }}

SELECT
    id,
    name,
    amount,
    dt  -- 分区列放最后！
FROM {{ source('raw', 'orders') }}
```

**规则清单:**
1. 分区列必须是 SELECT 语句的最后一列
2. 避免在增量模型中更新分区列值
3. 使用 `insert_overwrite` 时必须指定分区列，否则全表覆盖

**检测信号:**
- dbt run 成功但数据量异常减少
- Hive 报错"cannot recognize input"

**应解决阶段:** Phase 2（dbt-hive 集成）

---

### 陷阱 3: 中文化表面翻译而非本地化

**问题描述:** 仅将英文内容机械翻译为中文，而未考虑文化和使用习惯差异。

**根本原因:**
- 将国际化等同于翻译
- 忽略中文用户的工作流程习惯

**后果:**
- 术语不统一，增加学习成本
- 示例代码/注释仍混杂英文
- 日期、地址等格式未本地化

**预防策略:**
```markdown
# 术语表（必须在 Phase 1 建立）
| 英文 | 中文术语 | 说明 |
|------|----------|------|
| staging | 贴源层 | 非"暂存" |
| intermediate | 中间层 | 非"过渡" |
| mart | 集市层 | 非"市场" |
| fact table | 事实表 | |
| dimension | 维度表 | |
| SCD | 缓慢变化维 | 非"慢变维" |
```

**检测信号:**
- 同一概念出现多种翻译
- 用户困惑于术语含义
- 示例代码与说明文字语言不一致

**应解决阶段:** Phase 1（术语表）+ 贯穿全程（一致性检查）

---

### 陷阱 4: Claude 4.x 字面执行特性误解

**问题描述:** Claude 4.x（包括 Opus 4.5）与早期版本行为不同——早期版本会推断意图并扩展模糊请求，而 4.x 严格按字面执行。

**根本原因:**
- 沿用旧版本的提示设计方式
- 使用过度激进的工具触发语言

**后果:**
- 曾经有效的提示突然"失效"
- 过度触发工具（overtriggering）
- 输出缺乏预期的上下文扩展

**预防策略:**
```markdown
# 避免过度激进语言
- 旧式: "CRITICAL: You MUST use this tool when..."
- 新式: "Use this tool when..."

# 提供明确许可表达不确定性
"如果你不确定，可以直接说明不确定，而非猜测。"

# 使用 Plan Mode 防止错误实现
在复杂任务前，先进入规划模式，强制思考后再执行。
```

**检测信号:**
- AI 输出与预期差异大
- 工具频繁被触发但输出无用
- AI 做出大量未被请求的假设

**应解决阶段:** Phase 1（提示规范），Phase 3（场景测试）

---

### 陷阱 5: 数仓模型过度设计（Codex 讨论确认）

**问题描述:** 虽然按照星型模型设计，但过度追求"正规化"导致模型数量爆炸、维护困难、开发成本上升。Kimball 星型并不等于"越正规越好"。

**根本原因:**
- 追求理论完美而非业务实用
- "未来可能用到"的过度预设
- 缺乏模型退出机制
- 多人开发缺少统一边界

**典型表现（Overdesign Smells）:**

| 信号 | 说明 | 后果 |
|------|------|------|
| **粒度不清** | 事实表没有一句话定义 grain | JOIN 后重复计数，只能靠 DISTINCT 修补 |
| **维度拆分过细** | 维表再拆维表（雪花化），JOIN 链条变长 | 分析价值不增，复杂度徒增 |
| **SCD2 滥用** | 所有维度都做拉链 | 回填/存储/口径复杂度陡增，业务并不需要历史视角 |
| **桥表/多值维泛化** | 提前引入桥表"以防未来需要" | 大多数查询用不到，增加理解成本 |
| **中间模型爆炸** | DWD/DWS 之间堆大量一次性中间表 | 缺乏复用边界，数据链路难追踪 |
| **万金油宽表** | ADS 为省事建超宽表 | 字段语义混杂、权限难控、下游强耦合 |
| **过早抽象宏/框架** | dbt macro 过度封装 | 调试困难、新人门槛高 |

**判定清单（评审可执行 checklist）:**

```markdown
# 事实表必答
- [ ] grain 能用一句话说清楚吗？
- [ ] 主键是什么？
- [ ] 时间口径字段是哪个？
- [ ] 度量是否可加（additive/semi/non）？

# 新增维表必答
- [ ] 它支持的分析问题是什么？
- [ ] 没有它会多花哪一步？
- [ ] 是否可用退化维替代？

# 复杂度阈值
- [ ] 常用查询 JOIN 链 >3 需要解释收益
- [ ] 桥表/SCD2 必须提供至少 1 个真实报表示例
- [ ] 桥表/SCD2 必须说明"没有它会错"的反例
```

**预防策略:**

| 策略 | 说明 |
|------|------|
| **默认最小星型** | 先满足核心指标闭环，再按需迭代（YAGNI） |
| **优先退化维/枚举维** | 能放事实表就别拆维表（尤其 ADS/DWS） |
| **SCD2 白名单机制** | 只对确有历史分析需求的维度启用，并固化回填策略 |
| **模型退出机制** | 定期检查下游引用（dbt exposures/查询日志），无引用则标记废弃 |
| **明确领域边界与 owner** | 避免多人各写各的导致重复建设 |

**反向风险（欠设计）:**
- 过度简化可能导致口径不可控、复用性差
- 需要在文档中明确"触发复杂化的条件"

**检测信号:**
- 模型数量增长速度 >> 业务需求增长速度
- 常用查询 JOIN 超过 3 层
- 大量模型无下游引用
- 口径问题频发

**应解决阶段:** Phase 2（方法论）+ Phase 4（设计场景评审）

---

## 中度陷阱

导致延迟或技术债的错误。

### 陷阱 6: 维度建模的缓慢变化维（SCD）处理不当

**问题描述:** 错误选择 SCD 类型或实现方式，导致历史数据丢失或查询性能问题。

**预防策略:**
- 非关键属性（如客户偏好）：使用 Type 1（覆盖）
- 业务关键变更（如产品价格）：使用 Type 2（历史追踪）
- 始终使用代理键（surrogate key），避免依赖自然键

**检测信号:**
- 无法回溯历史状态
- 子表外键指向已失效的父表记录

**应解决阶段:** Phase 4（维度表场景）

---

### 陷阱 7: Hive 查询性能陷阱

**问题描述:** 未优化的 Hive 查询导致集群资源浪费和长时间等待。

**常见错误:**
1. **未使用分区** - 全表扫描
2. **ORDER BY 全局排序** - 所有数据进入单一 Reducer
3. **过度使用 JOIN** - 数据倾斜
4. **小文件问题** - 太多 part 文件影响读取性能

**预防策略:**
```sql
-- 避免全局排序，使用分布式排序
SET hive.exec.parallel=true;  -- 开启并行执行

-- 使用分区裁剪
SELECT * FROM orders WHERE dt = '2026-01-30';

-- 使用 ORC/Parquet 列式存储
CREATE TABLE orders (
    id BIGINT,
    amount DECIMAL(18,2)
) PARTITIONED BY (dt STRING)
STORED AS ORC;

-- 避免 ORDER BY，使用 SORT BY + DISTRIBUTE BY
SELECT * FROM orders
DISTRIBUTE BY region
SORT BY amount DESC;
```

**应解决阶段:** Phase 5（SQL 优化指导）

---

### 陷阱 8: 提示测试缺失

**问题描述:** 不测试提示就部署，导致线上输出质量不稳定。

**预防策略:**
- 建立提示回归测试集
- 记录提示和响应日志
- 跟踪输出质量指标

```markdown
# 每个提示模块需要的测试
tests/
├── scenario-xxx/
│   ├── input.md          # 测试输入
│   ├── expected.md       # 期望输出要点
│   └── evaluation.md     # 评估标准
```

**应解决阶段:** Phase 3（场景开发）+ Phase 6（集成测试）

---

### 陷阱 9: dbt 项目结构混乱

**问题描述:** dbt 模型组织无序，导致难以理解数据流和维护。

**预防策略:**
```
models/
├── staging/          # 贴源层 - 1:1 映射源表
│   └── stg_*.sql
├── intermediate/     # 中间层 - 复用逻辑
│   └── int_*.sql
└── marts/           # 集市层 - 业务面向
    ├── dim_*.sql    # 维度表
    └── fct_*.sql    # 事实表
```

**规则:**
- staging 模型与源表 1:1 对应
- 不在 staging 外直接引用 source
- 使用 `ref()` 建立模型依赖

**应解决阶段:** Phase 2（dbt 规范）

---

## 轻度陷阱

造成困扰但可修复的错误。

### 陷阱 10: 字符编码问题

**问题描述:** 中文内容显示为乱码（如 ??? 或方块字符）。

**预防策略:**
- 所有文件使用 UTF-8 编码
- 确保字体支持 CJK 字符（推荐 Noto Sans CJK SC）
- 配置编辑器/终端正确显示

**应解决阶段:** Phase 1（项目初始化）

---

### 陷阱 11: 过多 Few-shot 示例

**问题描述:** 在提示中提供过多示例，导致模型困惑或过拟合。

**预防策略:**
- 少而精：一个高质量示例胜过五个弱示例
- 示例应涵盖边界情况，而非重复同一模式
- 控制示例总 token 数

**应解决阶段:** Phase 3（场景优化）

---

## 阶段性警告矩阵

| 构建阶段 | 可能陷阱 | 预防措施 |
|----------|----------|----------|
| Build Phase 1: 基础架构 | 陷阱1（Mega-Prompt）、陷阱3（中文化）、陷阱10（编码） | 建立模块化架构、术语表、UTF-8 规范 |
| Build Phase 2: dbt-hive 集成 | 陷阱2（分区）、陷阱9（dbt结构） | 分区规则文档、项目结构模板 |
| Build Phase 3: 场景开发 | 陷阱4（Claude特性）、陷阱8（提示测试）、陷阱11（示例） | 测试框架、提示审查流程 |
| Build Phase 4: 维度表场景 | 陷阱5（过度设计）、陷阱6（SCD） | 过度设计checklist、SCD选型指南 |
| Build Phase 5: SQL 优化 | 陷阱7（Hive性能） | Hive 最佳实践清单 |
| Build Phase 6: 集成测试 | 陷阱8（提示测试） | 端到端测试、回归测试 |

**注意：** 此处"Build Phase"指架构构建阶段，与ARCHITECTURE.md的8阶段构建顺序对应。

---

## 来源

### dbt-hive 相关
- [dbt-hive GitHub](https://github.com/cloudera/dbt-hive) - 官方适配器文档
- [Cloudera Hive configurations | dbt Developer Hub](https://docs.getdbt.com/reference/resource-configs/hive-configs) - HIGH 置信度
- [dbt Best Practices](https://docs.getdbt.com/best-practices/best-practice-workflows) - HIGH 置信度

### 提示工程相关
- [Prompting best practices - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices) - HIGH 置信度
- [5 Patterns for Scalable Prompt Design](https://latitude-blog.ghost.io/blog/5-patterns-for-scalable-prompt-design/) - MEDIUM 置信度
- [Modular Prompting (MCP)](https://decryptai.substack.com/p/the-prompt-is-dead-long-live-the) - MEDIUM 置信度

### Hive 性能优化
- [Hive Performance | Qubole](https://www.qubole.com/blog/hive-best-practices) - MEDIUM 置信度
- [Tips and best practices for optimizing Hive performance | Cloudera](https://community.cloudera.com/t5/Community-Articles/Tips-and-best-practices-for-optimizing-Hive-performance/ta-p/385637) - MEDIUM 置信度

### 维度建模
- [Five Common Dimensional Modeling Mistakes | Vertabelo](https://vertabelo.com/blog/five-common-dimensional-modeling-mistakes-and-how-to-solve-them/) - MEDIUM 置信度
- [Kimball Dimensional Modeling Techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/) - HIGH 置信度

### 中文化
- [Chinese Software Localization | Art One Translations](https://artonetranslations.com/chinese-software-localization-what-you-need-to-know/) - MEDIUM 置信度
- [Mastering i18n | Lingoport](https://lingoport.com/blog/9-best-practices-for-internationalization/) - MEDIUM 置信度

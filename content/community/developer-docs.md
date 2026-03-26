# OpenMatrix 开发者文档
## 文档结构
```
docs/
├── getting-started/
│   ├── introduction.md
│   ├── installation.md
│   └── quick-start.md
├── core-concepts/
│   ├── phases-tasks.md
│   ├── quality-levels.md
│   ├── meetings.md
│   └── skills.md
├── guides/
│   ├── building-saas.md
│   ├── building-cli.md
│   └── building-library.md
├── api-reference/
│   ├── cli.md
│   ├── config.md
│   └── sdk.md
└── examples/
    ├── basic-usage/
    ├── advanced-features/
    └── integrations/
```
## 核心概念文档
### Phase 与 Task
```markdown
# Phase 与 Task

## 概述
OpenMatrix 使用 **Phase → Task → Subagent** 的层级结构来组织复杂项目。
## Phase
Phase 是项目的最高层级划分，代表项目的主要阶段。
### Phase 类型
- **设计阶段**: 需求分析、架构设计
- **开发阶段**: 编码、实现
- **测试阶段**: 测试、验证
- **收尾阶段**: 文档、部署
### Phase 示例
```
## Phase 1: 设计阶段
└─ TASK-001: 需求分析
└─ TASK-002: 架构设计
## Phase 2: 开发阶段
├─ TASK-003: 数据模型
├─ TASK-004: API 接口
└─ TASK-005: 前端页面
```
## Task
Task 是 Phase 内的具体任务单元，每个 Task 都有明确的目标。
### Task 属性
```typescript
interface Task {
  id: string;           // TASK-001
  title: string;        // 任务标题
  description: string; // 详细描述
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignee?: string; // 分配给谁
  dependencies: string[]; // 依赖的任务
  estimatedTime: number; // 预计时间 (分钟)
}
```
### Task 状态转换
```
pending → in_progress → completed
                 ↘ blocked → in_progress
```
## Subagent
Subagent 是执行 Task 的 AI 智能体。
### Subagent 类型
- **general-purpose**: 通用任务
- **Explore**: 代码探索
- **Plan**: 规划设计
- **Execute**: 执行实现
## 任务依赖
Task 之间可以存在依赖关系：
```
## TASK-002 依赖 TASK-001
## TASK-003 依赖 TASK-002
## TASK-004 和 TASK-003 可以并行执行
```
## 最佳实践
1. **合理的 Phase 划分**: 每个 Phase 3-5 个 Task
2. **明确的 Task 目标**: 每个 Task 可在 30 分钟内完成
3. **最小化依赖**: 减少不必要的依赖关系
4. **并行执行**: 尽可能并行执行独立的 Task
```
## Task 命名规范
- 使用动词开头: "实现用户认证"
- 清晰简洁: "实现用户登录 API"
- 包含上下文: "实现用户登录 API (JWT)"
## 示例
### 良好示例
```
✅ TASK-003: 实现用户登录 API
   描述: 使用 JWT 实现用户登录认证
   依赖: TASK-002 (数据模型)
   预计时间: 20 分钟
   验收标准:
   - POST /api/login 返回 JWT token
   - Token 有效期 7 天
   - 包含用户基本信息
```
### 不良示例
```
❌ TASK-003: 登录
   描述: 用户登录 (太模糊)
   依赖: 无 (缺少必要的依赖)
   预计时间: 2 小时 (不切实际)
   验收标准: 无 (没有明确的验收标准)
```
```
## 相关文档
- [质量级别](../core-concepts/quality-levels.md)
- [Meeting 机制](../core-concepts/meetings.md)
- [快速入门](../getting-started/quick-start.md)

---
title: OpenMatrix 架构解析：委托模型 + 持久化循环的设计哲学
description: 借鉴 Harness 的成熟思想，OpenMatrix 如何实现可靠的 AI 任务编排
author: OpenMatrix Team
date: 2026-04-22
---

# 架构解析：委托模型 + 持久化循环

OpenMatrix 定位在 AI 编码的第三层——流程编排层。不是让 AI 写得更好，而是让 AI 的产出**可信、可交付**。

## 委托模型：不执行，只编排

OpenMatrix 最核心的设计原则：**自己不写代码，只做决策和协调**。

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ AgentRunner │────▶│ SubagentTask│────▶│ Claude Code │
│ (委托执行)  │     │ (任务配置)  │     │  (Delegate) │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 为什么委托模型是正确的？

1. **跟随模型升级**：Claude 模型升级，OpenMatrix 自动变强
2. **不受上下文限制**：Agent 有独立的上下文窗口
3. **不绑定特定模型**：架构可复用到其他 AI Agent

> TypeScript 代码是骨架，Prompt 模板是肌肉。
> OpenMatrix 只构建骨架，肌肉由 Claude Code 提供。

## 持久化循环：对抗上下文压缩

Claude Code 有上下文窗口压缩的限制。OpenMatrix 通过 step/complete 循环解决这个问题：

```
Skill 调用 openmatrix step
     │
     ▼
读取 state (从磁盘)
     │
     ▼
返回任务配置
     │
     ▼
Agent 执行任务
     │
     ▼
Skill 调用 openmatrix complete
     │
     ▼
写入 state (持久化到磁盘)
     │
     ▼
下一次 step，从磁盘读状态
```

### 状态存储结构

```
.openmatrix/
├── state.json              # 全局状态
├── context.md              # Agent 共享上下文
├── tasks/
│   └── TASK-001/
│       ├── task.json       # 任务定义
│       ├── develop.json    # 开发阶段结果
│       ├── verify.json     # 验证阶段结果
│       └── accept.json     # 验收阶段结果
├── approvals/              # 审批记录
└── meetings/               # Meeting 记录
```

## Meeting 机制：阻塞不中断

遇到无法抉择的问题 → 创建 Meeting → 跳过当前任务 → 继续其他任务 → 最后统一处理。

```
❌ 其他方案:
   TASK-001 ✓ → TASK-002 阻塞 ⏸️ → 等用户...

✅ OpenMatrix:
   TASK-001 ✓ → TASK-002 阻塞 → 创建Meeting → 跳过 ↷
   TASK-003 ✓ → TASK-004 ✓ → 完成!
```

**最大前进距离（Maximum Forward Progress）**：

- 承认 AI 有不确定性
- 不假装完美，用流程管理不确定性
- 用户得到「可预期的部分完成」，而不是「不可预期的全部失败」

## 七道质量门禁

| 门禁 | 检查内容 | strict | balanced | fast |
|-----|---------|:------:|:--------:|:----:|
| Gate 1 | 编译检查 | ✅ | ✅ | ❌ |
| Gate 2 | 测试运行 | ✅ | ✅ | ❌ |
| Gate 3 | 覆盖率 (>80%/60%/20%) | ✅ | ✅ | ❌ |
| Gate 4 | Lint 检查 | ✅ 严格 | ✅ | ❌ |
| Gate 5 | 安全扫描 | ✅ | ✅ | ❌ |
| Gate 6 | E2E 测试 | ❓可选 | ❓可选 | ❌ |
| Gate 7 | 验收标准 | ✅ | ✅ | ❌ |

## Agent Memory：上下文共享

前序 Agent 的决策自动传递给后续 Agent：

```typescript
// AgentRunner 从 context.md 读取前序 Agent 的决策
const contextFile = path.join(omPath, 'context.md');
const content = await fs.readFile(contextFile, 'utf-8');

// 注入到当前 Agent 的 prompt
return `
## 前序 Agent 共享上下文

以下是之前执行的 Agent 留下的上下文信息，
你应该基于这些信息来工作，避免重复犯错。

${content}
`;
```

## 架构优势

```
可靠性 = 委托执行（跟随模型升级）
       + 持久化循环（不受上下文限制）
       + 最大前进距离（阻塞不中断）

价值 = 自动化程度 × 质量保障 / 人工介入次数
```

## 总结

OpenMatrix 用软件工程的流程纪律，填补了「AI 能写」到「用户敢用」之间的信任鸿沟：

- **委托模型**让系统随 AI 进化自动变强
- **持久化循环**让执行不受上下文限制
- **Meeting 机制**让阻塞不影响整体效率

这不是技术问题，是信任问题。

---

[GitHub](https://github.com/bigfish1913/openmatrix) | [官方文档](https://matrix.laofu.online/docs/) | [完整架构图](https://matrix.laofu.online/docs/FLOW/)
---
title: OpenMatrix 快速入门教程
description: 5 分钟上手 OpenMatrix， AI 原生任务编排框架
author: OpenMatrix Team
date: 2026-03-26
---

# 快速入门教程

欢迎使用 OpenMatrix！本教程将帮助你在 5 分钟内上手。

## 安装 OpenMatrix

```bash
# 使用 npm
npm install -g openmatrix

# 或使用 yarn
yarn global add openmatrix
# 或使用 pnpm
pnpm add -g openmatrix
```

## 创建第一个任务
```bash
# 初始化项目
mkdir my-project
cd my-project
openmatrix init
```
### 开始你的第一个任务
```bash
openmatrix start "实现用户认证系统"
```
OpenMatrix 会启动交互式问答流程，帮助你澄清需求。
## 步骤 1: 选择质量级别
```
? 选择质量级别
  ┌─ strict (推荐生产代码)
  └─ TDD + 80% 覆盖率 + 严格 Lint + 安全扫描 + AI 验收
  └─ balanced (日常开发)
  └─ 60% 覆盖率 + Lint + 安全扫描 + AI 验收
  └─ fast (快速原型)
  └─ 20% 覆盖率 + 最小质量检查
```
## 步骤 2: 查看执行计划
```
📋 执行计划

## Phase 1: 设计阶段
  └─ TASK-001: 架构设计 (15min)

## Phase 2: 开发阶段
  ├─ TASK-002: 数据模型 (20min)
  ├─ TASK-003: API 接口 (30min)
  └─ TASK-004: 前端页面 (40min)

## Phase 3: 测试阶段
  ├─ TASK-005: 单元测试 (20min)
  └─ TASK-006: 集成测试 (15min)

📊 统计
  总任务: 6
    预计耗时: ~2小时
    审批点: plan, merge
```
## 步骤 3: 确认执行模式
```
? 每阶段确认
  └─ 每阶段完成后暂停，等待确认
? 关键节点确认
  └─ 仅在 plan/merge/deploy 时暂停
? 全自动执行
  └─ 无需确认，自动完成所有任务
```
## 步骤 4: 查看执行状态
```bash
openmatrix status
```
### 查看当前任务
```bash
openmatrix tasks
```
## 任务执行流程

```
┌── TASK-001: 塘架设计 [in_progress]
│   ├── TASK-002: 数据模型 [pending]
│   ├── TASK-003: API 接口 [pending]
│   └── TASK-004: 前端页面 [pending]
└── └── TASK-005: 单元测试 [pending]
   └── TASK-006: 集成测试 [pending]
```
## 険度处理阻塞
如果某个任务遇到阻塞：
```bash
openmatrix meeting
```
## 完成任务
当所有任务完成后：
```bash
openmatrix complete --success
```
## 埥看报告
```bash
openmatrix report
```
## 常用命令

| 命令 | 描述 |
|------|------|
| `openmatrix init` | 初始化项目 |
| `openmatrix start [task]` | 启动新任务 |
| `openmatrix status` | 查看当前状态 |
| `openmatrix tasks` | 查看任务列表 |
| `openmatrix meeting` | 处理阻塞的决策 |
| `openmatrix complete` | 标记任务完成 |
| `openmatrix report` | 生成执行报告 |
| `openmatrix config` | 配置设置 |
## 下一步
现在你已经掌握了 OpenMatrix 的基本使用方法！接下来你可以：
- 查看 [完整文档](https://openmatrix.ai/docs)
- 查看 [示例项目](https://github.com/openmatrix/openmatrix/tree/main/examples)
- 加入 [社区](https://discord.gg/openmatrix)
## 常见问题
### Q: OpenMatrix 支持哪些 AI 模型？
A: OpenMatrix 目前支持：
- Claude (Anthropic)
- OpenAI GPT-4
- 其他兼容 OpenAI API 的模型
我们正在添加更多模型支持。
### Q: OpenMatrix 是免费的吗？
A: 是的！OpenMatrix 是开源软件，采用 MIT 许可证。
### Q: 如何贡献代码？
A: 请查看 [贡献指南](https://github.com/openmatrix/openmatrix/blob/main/CONTRIBUTING.md)
## 获取帮助
- [GitHub Issues](https://github.com/openmatrix/openmatrix/issues)
- [Discord](https://discord.gg/openmatrix)
- [Twitter](https://twitter.com/openmatrix)

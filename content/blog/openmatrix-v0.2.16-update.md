---
title: OpenMatrix v0.2.16 更新：系统化调试 + 自动部署 + 智能恢复
description: 新增 om:debug 四阶段调试、om:deploy 自动部署、om:feature 轻量需求、om:resume 智能恢复等重大功能
author: OpenMatrix Team
date: 2026-04-22
---

# OpenMatrix v0.2.16 更新：重大功能升级

本次更新带来多个重量级新功能，让 OpenMatrix 从任务编排工具升级为完整的 AI 开发助手。

## 🔧 /om:debug 系统化调试

**四阶段根因分析 + 自动修复验证循环**

### 调试流程

```
Step 1: 接收问题
    ↓
Step 2: CLI 初始化会话
    ↓
Step 3: 根因调查（只读，Explore Agent）
    ↓
Step 4: 模式分析（只读，Explore Agent）
    ↓
Step 5: 展示诊断报告
    ↓
    ⛔ 必须等待用户确认是否修复
    ↓
Step 6: 用户选择是否修复
    ├─ "仅查看报告" → 输出报告后结束
    ├─ "继续深入调查" → 回到 Step 3
    └─ "需要修复" ↓
Step 7: 选择修复策略（自动/手动）
```

### 使用方式

```bash
/om:debug                          # 交互式调试
/om:debug --task TASK-003          # 调试指定失败任务
/om:debug "API 返回 500 错误"      # 带问题描述调试
```

### 适用场景

- Bug 修复
- 测试失败
- 异常行为
- 构建失败

---

## 🚀 /om:deploy 自动部署

**自动扫描部署环境，一键部署到多种平台**

### 支持的部署方式

| 方式 | 说明 | 检测文件 |
|------|------|---------|
| Docker | Docker 容器部署 | Dockerfile |
| Docker Compose | 多容器编排 | docker-compose.yml |
| Kubernetes | K8s 部署 | k8s/*.yaml |
| Helm | Helm Chart | helm/Chart.yaml |
| npm | npm 发布 | package.json (deploy script) |
| Make | Makefile 部署 | Makefile (deploy target) |
| GitHub Pages | 静态站点 | .github/workflows/*.yml |
| Vercel | Vercel 部署 | vercel.json |
| Netlify | Netlify 部署 | netlify.toml |

### 使用方式

```bash
/om:deploy                    # 自动扫描 → 展示报告 → 选择执行
/om:deploy docker             # 指定 Docker 部署
/om:deploy --dry-run          # 仅预览命令，不执行
/om:deploy --show-dev         # 显示开发环境命令
/om:deploy kubernetes --auto  # 自动执行 Kubernetes 部署
```

### 部署报告示例

```markdown
# 🚀 部署环境检测报告

**项目**: my-app
**类型**: typescript

---

## 📊 环境摘要

| 项目 | 数量/状态 |
|------|----------|
| 构建工具 | 2 个 |
| 部署选项 | 3 个 |
| CI 配置 | 已配置 |

---

## 🚀 部署选项

1. **Docker**
   - 📝 命令: `docker build -t my-app .`
   - 📁 配置: `Dockerfile`
   - ✅ 推荐

2. **Docker Compose**
   - 📝 命令: `docker-compose up -d`
   - 📁 配置: `docker-compose.yml`

3. **npm**
   - 📝 命令: `npm run deploy`
```

---

## ⚡ /om:feature 轻量小需求

**快速迭代小功能，无完整任务追踪**

### 适用场景

- 添加一个颜色变量
- 修复按钮样式
- 更新配置项
- 小型重构

### 使用方式

```bash
/om:feature 添加一个颜色变量
/om:feature 修复导航栏样式
```

### 与 /om:start 的区别

| 特性 | /om:feature | /om:start |
|------|:-----------:|:----------:|
| 任务拆解 | 无 | 自动拆解 |
| 任务追踪 | 无 | 完整追踪 |
| 质量门禁 | 轻量 | 完整 |
| 适用场景 | 小需求 | 复杂任务 |

---

## 🔄 /om:resume 智能恢复

**自动检测轻量/完整流程并恢复中断任务**

### 使用方式

```bash
/om:resume                    # 自动检测并恢复
```

### 智能检测

- 自动检测是否有进行中的任务
- 自动检测是否有待处理的 Meeting
- 区分轻量流程和完整流程
- 提供恢复选项

---

## 其他改进

### 执行循环持久化

默认启用 step/complete 循环，对抗上下文压缩：

```
Skill 调用 step → 拿到任务 → Agent 执行 → Skill 调用 complete → 标记完成
     ↑                                                    │
     └────── 下一次 step，从磁盘读状态 ────────────────────┘
```

### 测试体系完善

| 模块 | 覆盖率 |
|------|:------:|
| Orchestrator | 82% |
| Agents | 78% |
| Storage | 85% |
| Types | 90% |

---

## 📦 安装升级

```bash
# 全局安装最新版本
npm install -g openmatrix@latest

# 或使用 npx
npx openmatrix@latest start "你的任务"
```

---

## 📝 下一步计划

- [ ] VSCode 扩展开发
- [ ] CI/CD 集成优化
- [ ] 多语言 SDK (Python, Go)
- [ ] 可视化仪表板

---

**如果觉得有用，请给个 ⭐ Star！**

[GitHub](https://github.com/bigfish1913/openmatrix) | [官方文档](https://matrix.laofu.online/docs/)
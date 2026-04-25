# OpenMatrix

<div align="center">
  <img src="brand/logo-horizontal.svg" alt="OpenMatrix" width="300">

  <p><strong>同时实现 TDD + 严格质量门禁 + 全自动执行的 AI 任务编排系统</strong></p>

  <p><em>自动化 ≠ 牺牲质量 | 高质量 ≠ 手动操作</em></p>

  <p>
    <a href="https://www.npmjs.com/package/openmatrix">
      <img src="https://img.shields.io/npm/v/openmatrix.svg?color=blue&label=npm" alt="npm version">
    </a>
    <a href="https://www.npmjs.com/package/openmatrix">
      <img src="https://img.shields.io/npm/dm/openmatrix.svg?color=green&label=downloads" alt="npm downloads">
    </a>
    <a href="https://github.com/bigfish1913/openmatrix">
      <img src="https://img.shields.io/github/stars/bigfish1913/openmatrix.svg?style=social&label=Star" alt="GitHub Stars">
    </a>
    <a href="https://opensource.org/licenses/MIT">
      <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
    </a>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg" alt="Node">
    </a>
    <a href="https://claude.ai/code">
      <img src="https://img.shields.io/badge/Claude%20Code-Compatible-blue.svg" alt="Claude Code">
    </a>
  </p>

  <p>
    <a href="https://matrix.laofu.online/docs/">📚 官方文档</a> •
    <a href="https://matrix.laofu.online/docs/getting-started/">🚀 快速开始</a> •
    <a href="https://github.com/bigfish1913/openmatrix">💬 GitHub</a> •
    <a href="CONTRIBUTING.md">贡献指南</a>
  </p>
</div>

---

## 一句话介绍

```bash
/om 实现用户登录
# 自动启动任务编排，第一个问题选质量级别，然后全自动执行
```

> `/om` 是 `/om:start` 的快捷方式，功能完全相同

### 🪄 自动调用 (无需输入命令)

安装后，直接输入任务描述即可自动调用:

```
用户输入: 实现用户登录功能
     ↓
自动调用: /om:start 实现用户登录功能
```

**触发场景:**

| 用户输入 | 触发原因 |
|---------|---------|
| `实现用户登录功能` | 功能开发 |
| `登录页面报错了` | Bug 修复 |
| `性能太慢需要优化` | 性能优化 |
| `写个单元测试` | 测试相关 |
| `做个完整的用户系统` | 多组件任务 |
| `从零搭建一个后台` | 多步骤项目 |

---

## Skills 命令一览 (v0.2.23)

| 命令 | 用途 |
|------|------|
| `/om` | **默认入口** - 直接输入任务描述即可启动 |
| `/om:brainstorm` | 🧠 **头脑风暴** - 先探索需求和设计，再执行任务 |
| `/om:research` | 📚 **领域调研** - AI 驱动的领域调研和问题探索 |
| `/om:debug` | 🔧 **系统化调试** - 四阶段根因分析 + 自动修复验证循环 |
| `/om:feature` | ⚡ **轻量小需求** - 快速迭代小功能，无完整任务追踪 |
| `/om:deploy` | 🚀 **自动部署** - 扫描部署环境，支持 Docker/K8s/npm 等 |
| `/om:test` | 🧪 **测试生成** - 自动生成或改进测试用例 |
| `/om:start` | 启动新任务 (第一个问题选质量级别) |
| `/om:auto` | 🚀 **全自动执行** - 无阻塞、无确认、直接完成 |
| `/check` | 🔍 **项目检查** - 自动检测可改进点并提供升级建议 |
| `/om:status` | 查看状态 |
| `/om:approve` | 审批决策 |
| `/om:meeting` | 处理阻塞问题 |
| `/om:resume` | **智能恢复** - 自动检测轻量/完整流程并恢复中断任务 |
| `/om:retry` | 重试失败 |
| `/om:report` | 生成报告 |

---

## 为什么选择 OpenMatrix？

### 与 superpowers / gsd 对比

| 特性 | OpenMatrix | superpowers | gsd |
|------|:----------:|:-----------:|:---:|
| **100% 自动化** | ✅ auto 模式 | ❌ 50% | ❌ 60% |
| **TDD 内置** | ✅ strict 模式 | ❌ 需手动 | ❌ 无 |
| **覆盖率强制** | ✅ 60-80% | ❌ 无 | ❌ 无 |
| **安全扫描** | ✅ npm audit | ❌ 无 | ❌ 无 |
| **AI 验收** | ✅ Reviewer Agent | ❌ 无 | 部分 |
| **阻塞不中断** | ✅ Meeting 机制 | ❌ 停止 | ❌ 停止 |
| **质量报告** | ✅ JSON + MD | ❌ 无 | 部分 |
| **系统化调试** | ✅ /om:debug | ❌ 无 | ❌ 无 |
| **自动部署** | ✅ /om:deploy | ❌ 无 | ❌ 无 |
| **上手难度** | ⚡ 一句话开始 | 中等 | 较高 |

---

## 执行流程概览

```
用户输入 → 质量选择 → 任务规划 → 执行 → 质量门禁 → AI验收 → Meeting处理 → 完成
```

| 阶段 | 说明 | 关键点 |
|:----:|------|--------|
| 0 | 交互问答 | **第一个问题选质量级别** |
| 1 | 任务规划 | Planner Agent 生成计划 |
| 2 | 任务执行 | strict/balanced/fast 三种模式 |
| 3 | 质量门禁 | 7 道质量门禁验证 |
| 4 | AI 验收 | Reviewer Agent 最终确认 |
| 5 | Meeting | 阻塞不中断，最后处理并**重新执行** |
| 6 | 最终报告 | 质量评分 + 产出文件 |

---

## 快速开始

### 安装

```bash
# 全局安装 (推荐)
npm install -g openmatrix

# Skills 会自动安装到 ~/.claude/commands/om/
```

### 第一次使用

```bash
/om 实现用户登录功能

# 系统会先问:
┌─────────────────────────────────────────────────────────┐
│ 问题 0: 选择质量级别                                     │
├─────────────────────────────────────────────────────────┤
│ 🚀 strict   → TDD + 80%覆盖率 + AI验收 (推荐生产代码)    │
│ ⚖️ balanced  → 60%覆盖率 + AI验收 (日常开发)            │
│ ⚡ fast      → 无质量门禁 (快速原型)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 核心特性

### 1️⃣ 三级质量配置

| 级别 | TDD | 覆盖率 | Lint | 安全 | E2E测试 | AI验收 | 适用场景 |
|:----:|:---:|:------:|:----:|:----:|:-------:|:------:|---------|
| **strict** | ✅ | >80% | ✅ 严格 | ✅ | ❓ 可选 | ✅ | 🏭 **生产代码** |
| **balanced** | ❌ | >60% | ✅ | ✅ | ❓ 可选 | ✅ | 📦 日常开发 |
| **fast** | ❌ | >20% | ❌ | ❌ | ❌ | ❌ | 🏃 快速原型 |

### 2️⃣ 七道质量门禁

| 门禁 | 检查内容 | strict | balanced | fast |
|-----|---------|:------:|:--------:|:----:|
| Gate 1 | 编译检查 | ✅ | ✅ | ❌ |
| Gate 2 | 测试运行 | ✅ | ✅ | ❌ |
| Gate 3 | 覆盖率 | ✅ | ✅ | ❌ |
| Gate 4 | Lint 检查 | ✅ 严格 | ✅ | ❌ |
| Gate 5 | 安全扫描 | ✅ | ✅ | ❌ |
| Gate 6 | E2E 测试 | ❓可选 | ❓可选 | ❌ |
| Gate 7 | 验收标准 | ✅ | ✅ | ❌ |

### 3️⃣ Meeting 机制 (阻塞不中断)

```
❌ 其他方案:
   TASK-001 ✓ → TASK-002 阻塞 ⏸️ → 等用户...

✅ OpenMatrix:
   TASK-001 ✓ → TASK-002 阻塞 → 创建Meeting → 跳过 ↷
   TASK-003 ✓ → TASK-004 ✓ → 完成!
```

---

## 新功能亮点 (v0.2.23)

### /om:debug 系统化调试

**适用场景**: Bug 修复、测试失败、异常行为

```bash
/om:debug                          # 交互式调试
/om:debug --task TASK-003          # 调试指定失败任务
/om:debug "API 返回 500 错误"      # 带问题描述调试
```

**四阶段流程**:
1. 接收问题
2. 根因调查（只读，Explore Agent）
3. 模式分析（只读，Explore Agent）
4. 修复验证循环

### /om:deploy 自动部署

**适用场景**: 部署项目到 Docker/K8s/npm 等

```bash
/om:deploy                    # 自动扫描 → 展示报告 → 选择执行
/om:deploy docker             # 指定 Docker 部署
/om:deploy --dry-run          # 仅预览命令
/om:deploy kubernetes --auto  # 自动执行 Kubernetes 部署
```

**支持的部署方式**: Docker、Docker Compose、Kubernetes、Helm、npm、Make、GitHub Pages、Vercel、Netlify

### /om:feature 轻量小需求

**适用场景**: 快速迭代小功能，无需完整任务追踪

```bash
/om:feature 添加一个颜色变量
/om:feature 修复按钮样式
```

### /om:test 测试生成

**适用场景**: 自动生成或改进测试用例

```bash
/om:test                      # 为当前代码生成测试
/om:test --coverage           # 目标覆盖率模式
/om:test e2e                  # 生成 E2E 测试
```

### /om:resume 智能恢复

**适用场景**: 恢复中断的任务，自动检测轻量/完整流程

```bash
/om:resume                    # 自动检测并恢复
```

---

## 路线图

- [x] 核心任务编排引擎
- [x] 三级质量门禁
- [x] Meeting 阻塞处理机制
- [x] TDD 模式
- [x] 系统化调试 (/om:debug)
- [x] 自动部署 (/om:deploy)
- [x] 轻量小需求 (/om:feature)
- [x] 智能恢复 (/om:resume)
- [x] 测试生成 (/om:test)
- [x] 执行循环持久化
- [ ] VSCode 扩展
- [ ] CI/CD 集成
- [ ] 多语言 SDK (Python, Go)

---

## 社区

- [GitHub Discussions](https://github.com/bigfish1913/openmatrix/discussions) - 提问和讨论
- [GitHub Issues](https://github.com/bigfish1913/openmatrix/issues) - Bug 报告和功能建议

---

<div align="center">
  <p>如果这个项目对你有帮助，请给一个 ⭐️ Star！</p>

  [GitHub](https://github.com/bigfish1913/openmatrix) | [官方文档](https://matrix.laofu.online/docs/)
</div>
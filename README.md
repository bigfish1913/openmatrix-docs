<div align="center">
  <img src="brand/logo-horizontal.svg" alt="OpenMatrix" width="300">

  <p><strong>AI 原生任务编排框架</strong></p>

  <p>让复杂的多步骤任务自动化变得简单可靠</p>

  <p>
    <a href="https://github.com/openmatrix/openmatrix/actions">
      <img src="https://github.com/openmatrix/openmatrix/workflows/CI/badge.svg" alt="CI Status">
    </a>
    <a href="https://www.npmjs.com/package/openmatrix">
      <img src="https://img.shields.io/npm/v/openmatrix.svg" alt="npm version">
    </a>
    <a href="https://opensource.org/licenses/MIT">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
    </a>
    <a href="https://discord.gg/openmatrix">
      <img src="https://img.shields.io/discord/123456789.svg?label=Discord" alt="Discord">
    </a>
  </p>
</div>

---

## 为什么选择 OpenMatrix？

在 AI 辅助开发的时代，我们面临一个挑战：**如何让 AI 完成复杂的多步骤任务，同时保持代码质量和可追踪性？**

OpenMatrix 提供了一个结构化的解决方案：

- **Phase → Task → Subagent** 的清晰层级
- **三级质量门禁** (strict/balanced/fast)
- **智能阻塞处理** (Meeting 机制)
- **完整可追溯** 的执行日志

## 快速开始

```bash
# 使用 npx 快速启动
npx openmatrix start "实现用户认证系统"

# 或者全局安装
npm install -g openmatrix
openmatrix start "你的任务描述"
```

OpenMatrix 会自动：
1. 分析任务需求
2. 拆解为多个 Phase 和 Task
3. 询问质量级别
4. 开始执行任务

## 核心概念

### Phase 与 Task

```
Phase 1: 设计阶段
  └─ TASK-001: 架构设计

Phase 2: 开发阶段
  ├─ TASK-002: 数据模型
  ├─ TASK-003: API 接口
  └─ TASK-004: 前端页面

Phase 3: 测试阶段
  ├─ TASK-005: 单元测试
  └─ TASK-006: 集成测试
```

### 质量级别

| 级别 | TDD | 覆盖率 | 适用场景 |
|------|:---:|:------:|---------|
| **strict** | ✅ | >80% | 生产代码 |
| **balanced** | ❌ | >60% | 日常开发 |
| **fast** | ❌ | >20% | 快速原型 |

### Meeting 机制

当任务遇到阻塞或需要决策时，OpenMatrix 会：
1. 记录问题到 Meeting
2. 跳过当前任务，继续执行其他任务
3. 最后统一处理所有 Meeting

## 功能特性

- **结构化任务编排** - Phase → Task → Subagent 清晰层级
- **三级质量门禁** - strict / balanced / fast 模式
- **AI 原生设计** - 与 Claude、GPT 等深度集成
- **智能阻塞处理** - Meeting 机制自动处理阻塞点
- **完整可追溯** - 详细的执行日志和状态追踪
- **开源免费** - MIT 协议，社区驱动

## 安装

```bash
# npm
npm install -g openmatrix

# yarn
yarn global add openmatrix

# pnpm
pnpm add -g openmatrix
```

## 使用示例

### 创建新项目

```bash
openmatrix start "创建一个博客系统"
```

### 执行特定任务

```bash
openmatrix start "添加用户登录功能" --quality strict
```

### 查看任务状态

```bash
openmatrix status
```

### 处理阻塞的 Meeting

```bash
openmatrix meeting
```

## CLI 命令

| 命令 | 描述 |
|------|------|
| `openmatrix start [task]` | 启动新任务 |
| `openmatrix status` | 查看当前状态 |
| `openmatrix meeting` | 处理待确认的 Meeting |
| `openmatrix resume` | 恢复暂停的任务 |
| `openmatrix config` | 配置设置 |

## 文档

- [快速开始](https://openmatrix.ai/docs/getting-started)
- [核心概念](https://openmatrix.ai/docs/concepts)
- [API 参考](https://openmatrix.ai/docs/api)
- [示例](https://openmatrix.ai/docs/examples)

## 社区

- [GitHub Discussions](https://github.com/openmatrix/openmatrix/discussions) - 提问和讨论
- [Discord](https://discord.gg/openmatrix) - 实时交流
- [Twitter](https://twitter.com/openmatrix) - 最新动态

## 贡献

我们欢迎所有形式的贡献！

- 提交 [Issue](https://github.com/openmatrix/openmatrix/issues) 报告 bug 或建议新功能
- 提交 [Pull Request](https://github.com/openmatrix/openmatrix/pulls) 修复问题或添加功能
- 参与 [Discussions](https://github.com/openmatrix/openmatrix/discussions) 讨论项目方向

请阅读 [贡献指南](CONTRIBUTING.md) 了解更多。

## 路线图

- [x] 核心任务编排引擎
- [x] 三级质量门禁
- [x] Meeting 阻塞处理机制
- [ ] 多语言 SDK (Python, Go)
- [ ] 可视化仪表板
- [ ] 云端协作功能

## 许可证

[MIT](LICENSE) © 2026 OpenMatrix

---

<div align="center">
  <p>如果这个项目对你有帮助，请给一个 ⭐️ Star！</p>
</div>

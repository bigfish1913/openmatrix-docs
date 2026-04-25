---
title: OpenMatrix v0.2.20 更新：智能测试生成
description: 新增 /om:test 指令，全自动扫描项目发现测试缺失，像"测试工程师"一样理解业务逻辑生成测试
author: OpenMatrix Team
date: 2026-04-25
---

# OpenMatrix v0.2.20 更新：智能测试生成

本次更新带来全新的 `/om:test` 指令，让 OpenMatrix 能够像专业测试工程师一样理解业务逻辑并自动生成高质量测试。

## 🧪 /om:test 智能测试生成

**全自动扫描 + 业务逻辑分析 + 自动验证循环**

### 核心特性

- **全自动项目扫描**: 自动检测语言、测试框架、源文件结构
- **业务角度分析**: 像"测试工程师"一样理解代码逻辑，而非简单模板生成
- **智能发现缺失**: 对比源文件与测试文件，识别关键业务场景未被覆盖
- **UI 测试可选**: 用户确认 + AI 推荐，支持 Playwright/Cypress 等框架
- **自动验证循环**: 生成后自动运行测试验证，失败自动修复（最多 3 次）

### 测试生成流程

```
Step 1: 调用 CLI 收集原始数据
    │   openmatrix test --json
    ▼
Step 2: AI 分析项目上下文
    │   • 读取 projectInfo 判断语言和框架
    │   • 读取 sourceFiles 了解项目结构
    │   • 读取 existingTests 识别现有覆盖
    ▼
Step 3: 发现测试缺失
    │   • 对比源文件与测试文件
    │   • 分析每个源文件的业务逻辑复杂度
    │   • 识别关键业务场景未被测试覆盖
    │   • 输出缺失测试报告
    ▼
Step 4: UI 测试决策
    │   • 如果 hasFrontend=true，AskUserQuestion 是否需要 UI 测试
    │   • AI 给出推荐（基于 frontendFramework 和现有测试情况）
    ▼
Step 5: 生成测试
    │   • 调用 Agent(general-purpose) 生成单元测试
    │   • 如果需要 UI 测试，调用 Agent 生成 E2E 测试
    │   • Agent 将测试文件写入对应目录
    ▼
Step 6: 验证测试
    │   • 调用 CLI: openmatrix test --verify
    │   • 如果验证失败，分析失败原因
    │   • 如果失败次数 < 3，重新生成修复
    │   • 如果失败次数 >= 3，暂停并报告
    ▼
Step 7: 输出报告
    │   • 展示生成的测试文件列表
    │   • 展示验证结果
    │   • Git 提交（可选）
```

### 模块架构

```
┌─────────────────────────────────────────────────────────────┐
│                    用户调用 /om:test                          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Skill 层 (skills/test.md)                       │
│                                                               │
│  1. 调用 CLI 收集项目原始数据                                   │
│  2. 分析业务逻辑、发现测试缺失                                   │
│  3. 询问用户是否需要 UI 测试                                    │
│  4. 调用 Agent 生成测试代码                                     │
│  5. 调用 CLI 验证测试                                          │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│ CLI 层               │       │ Agent 层             │
│ (commands/test.ts)   │       │ (general-purpose)    │
│                     │       │                      │
│ • 扫描项目结构        │       │ • 生成测试代码        │
│ • 检测测试框架        │       │ • 分析业务逻辑        │
│ • 运行测试验证        │       │                      │
│ • 输出 JSON 数据      │       │                      │
└─────────────────────┘       └─────────────────────┘
```

### 使用方式

```bash
/om:test              # 无参数，自动扫描整个项目
/om:test src/auth/    # 指定目录范围（可选扩展）
```

### CLI 命令

```bash
openmatrix test              # 全自动扫描
openmatrix test --json       # 输出 JSON 格式（供 Skill 调用）
openmatrix test --verify     # 扫描后运行测试验证
```

### 适用场景

| 场景 | 说明 |
|------|------|
| 新项目测试覆盖 | 从零开始建立测试体系 |
| 遗留代码测试补充 | 为现有代码补充缺失测试 |
| 回归测试完善 | 关键业务逻辑增加测试保护 |
| UI 测试创建 | 前端项目 E2E 测试生成 |

---

## 📁 测试文件生成策略

### 文件放置规则

| 项目类型 | 测试目录 | 文件命名 |
|---------|---------|---------|
| TypeScript | `__tests__/` 或 `tests/` | `{source}.test.ts` |
| Python | `tests/` | `test_{source}.py` |
| Go | `{package}_test.go` | 与源文件同目录 |

### UI 测试文件结构

```
tests/e2e/
├── playwright.config.ts
├── pages/
│   └── LoginPage.spec.ts
├── screenshots/
│   └── *.png
└── .gitignore
```

---

## 🔁 自动验证循环

```
生成测试 → 运行测试验证 → 判断结果
    │                        │
    │              ┌─────────┴─────────┐
    │              │                   │
    │           通过                  失败
    │              │                   │
    │              ▼                   ▼
    │        输出成功报告          retryCount + 1
    │                               │
    │                      ┌────────┴────────┐
    │                      │                 │
    │                   < 3 次            >= 3 次
    │                      │                 │
    │                      ▼                 ▼
    │               重新分析修复         暂停并报告
    │               (带失败信息)         (可能测试框架问题)
```

### 错误类型处理

| 错误类型 | 处理方式 |
|---------|---------|
| 测试语法错误 | Agent 分析错误信息，修复测试代码 |
| 测试逻辑错误 | Agent 分析失败断言，调整测试用例 |
| 环境配置错误 | 提示用户检查测试框架配置 |
| 3 次失败后 | 报告问题，建议用户手动检查 |

---

## 📊 扫描数据结构

CLI 输出 JSON 供 Skill 分析：

```typescript
interface TestScanResult {
  sessionId: string;
  status: 'scanning' | 'analyzing' | 'generating' | 'verifying' | 'completed';

  projectInfo: {
    language: string;
    testFramework: string;
    hasExistingTests: boolean;
    testDirectory: string;
  };

  sourceFiles: string[];
  existingTests: string[];

  uiInfo?: {
    hasFrontend: boolean;
    frontendFramework: string;
    hasUITests: boolean;
    recommendedUIFramework: string;
  };
}
```

---

## 🎯 设计原则

遵循 OpenMatrix 分层职责原则：

```
Skill 层（AI）              CLI 层（程序）
─────────────────           ─────────────────
理解业务逻辑                 收集原始数据
分析测试缺失                 执行测试命令
给出推荐理由                 输出结构化 JSON
交互问答                     状态持久化
生成测试文件                 运行验证
```

**CLI 只做两件事：**
1. 收集原始事实（项目结构、测试框架、文件列表）
2. 执行明确的操作（运行测试验证）

**Skill 层 AI 负责：**
1. 分析业务逻辑复杂度
2. 识别关键场景测试缺失
3. 推荐是否需要 UI 测试
4. 生成高质量测试代码

---

## 📦 安装升级

```bash
# 全局安装最新版本
npm install -g openmatrix@latest

# 或使用 npx
npx openmatrix@latest test

# 验证安装
openmatrix --version
# 应显示: 0.2.20
```

---

## 📝 下一步计划

- [ ] VSCode 扩展开发
- [ ] CI/CD 集成优化
- [ ] 多语言 SDK (Python, Go)
- [ ] 可视化仪表板
- [ ] 测试覆盖率目标配置

---

**如果觉得有用，请给个 ⭐ Star！**

[GitHub](https://github.com/bigfish1913/openmatrix) | [官方文档](https://matrix.laofu.online/docs/)
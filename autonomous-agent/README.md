# OpenMatrix 推广智能体

> AI 驱动的任务执行和推广助手 - 让 openmatrix 火起来

## ✨ 核心能力

### 🤖 多模型 LLM 支持
- **Claude** (Anthropic) - 推荐，智能且安全
- **OpenAI** (GPT-4/GPT-3.5) - 生态丰富
- **本地模型** (Ollama) - 隐私优先

### 📋 智能任务规划
- 自动分解复杂任务
- 多步骤执行和依赖管理
- 任务模板系统

### 🎯 推广能力模块
- 📝 **内容生成** - 自动生成技术文章、教程、公告
- 📢 **平台发布** - 发布到 GitHub、掘金、公众号、小红书等
- 💬 **社区互动** - 回复 Issue、PR、评论
- 📊 **数据分析** - 分析数据，优化推广策略

## 🚀 快速开始

### 安装

```bash
cd autonomous-agent
cargo build --release
```

### 配置 LLM

设置环境变量（至少配置一个）：

```bash
# Claude (推荐)
export ANTHROPIC_API_KEY=your-key

# OpenAI
export OPENAI_API_KEY=your-key

# 本地模型 (Ollama)
# 启动 Ollama 服务即可
ollama serve
```

### 使用

```bash
# 查看状态
./target/release/autonomous-agent status

# AI 对话模式
./target/release/autonomous-agent chat

# 列出可用 LLM
./target/release/autonomous-agent llm list

# 规划任务
./target/release/autonomous-agent task plan "推广 openmatrix 到 GitHub"

# 执行命令
./target/release/autonomous-agent exec "echo Hello"
```

## 📖 CLI 命令

### 基础命令

| 命令 | 说明 |
|------|------|
| `status` | 显示智能体状态 |
| `chat` | AI 对话模式 |
| `update` | 检查更新 |

### 记忆管理

| 命令 | 说明 |
|------|------|
| `add-memory` | 添加记忆 |
| `search-memory` | 搜索记忆 |
| `list-memories` | 列出记忆 |

### 目标管理

| 命令 | 说明 |
|------|------|
| `add-goal` | 创建目标 |
| `list-goals` | 列出目标 |
| `update-progress` | 更新进度 |
| `focus` | 设置聚焦目标 |

### LLM 管理

| 命令 | 说明 |
|------|------|
| `llm list` | 列出可用 Provider |
| `llm test` | 测试连接 |
| `llm set-default` | 设置默认 Provider |

### 任务管理

| 命令 | 说明 |
|------|------|
| `task plan` | 规划任务 |
| `task execute` | 执行任务 |
| `task list` | 列出任务 |
| `task status` | 查看状态 |

## 🎨 使用示例

### AI 对话模式

```bash
$ ./autonomous-agent chat

🤖 OpenMatrix 推广智能体 - AI 对话模式
═════════════════════════════════════════
可用 LLM: claude

你: 帮我写一篇关于 OpenMatrix 的介绍文章

🤖 好的，我来帮你写一篇介绍 OpenMatrix 的文章...
```

### 任务规划

```bash
$ ./autonomous-agent task plan "推广 openmatrix 到掘金"

📋 任务计划: 智能任务
   描述: 推广 openmatrix 到掘金
   优先级: Medium

📝 执行步骤:
   ⏳ 1. 分析目标受众和平台
   ⏳ 2. 生成推广内容
   ⏳ 3. 审核内容质量
   ⏳ 4. 发布到目标平台
   ⏳ 5. 跟踪效果数据

📊 预计步骤: 5
```

## 🏗️ 架构

```
autonomous-agent/
├── src/
│   ├── main.rs          # 入口和 CLI
│   ├── llm/             # LLM 模块
│   │   ├── mod.rs       # 工厂和 trait
│   │   ├── types.rs     # 类型定义
│   │   ├── claude.rs    # Claude 适配器
│   │   ├── openai.rs    # OpenAI 适配器
│   │   └── local.rs     # Ollama 适配器
│   ├── tasks/           # 任务模块
│   │   ├── mod.rs       # 导出
│   │   ├── types.rs     # 任务类型
│   │   ├── planner.rs   # 任务规划器
│   │   └── executor.rs  # 任务执行器
│   ├── memory.rs        # 记忆系统
│   ├── goals.rs         # 目标管理
│   ├── executor.rs      # 命令执行
│   └── updater.rs       # 自我更新
└── Cargo.toml
```

## 🔮 路线图

- [x] Phase 1: LLM 集成
  - [x] 多模型适配器
  - [x] Claude/OpenAI/Ollama 支持
  - [x] AI 对话模式

- [x] Phase 2: 任务规划
  - [x] 任务分解
  - [x] 模板系统
  - [x] 执行器

- [ ] Phase 3: 推广能力
  - [ ] 内容生成器
  - [ ] 平台发布器
  - [ ] 社区互动器
  - [ ] 数据分析器

## 📄 许可证

MIT License

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](../CONTRIBUTING.md)

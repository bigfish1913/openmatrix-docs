# OpenMatrix 推广智能体

> AI 驱动的推广助手 - 让 openmatrix 火起来 🚀

## ✨ 核心能力

### 🤖 多模型 LLM 支持
- **Claude** (Anthropic) - 推荐，智能且安全
- **OpenAI** (GPT-4/GPT-3.5) - 生态丰富
- **本地模型** (Ollama) - 隐私优先，免费使用

### 📋 智能任务规划
- 自动分解复杂任务为多步骤
- 任务模板系统（推广、部署、分析等）
- 依赖管理和执行跟踪

### 🎯 推广能力模块
| 模块 | 功能 |
|------|------|
| 📝 **内容生成** | 技术文章、教程、公告、社交媒体帖子 |
| 📢 **平台发布** | GitHub、掘金、公众号、小红书、知乎 |
| 💬 **社区互动** | Issue 回复、PR 审核、评论互动 |
| 📊 **数据分析** | 效果报告、平台排名、增长预测 |

## 🚀 快速开始

### 安装

```bash
cd autonomous-agent
cargo build --release
```

### 配置 LLM

```bash
# Claude (推荐)
export ANTHROPIC_API_KEY=your-key

# OpenAI
export OPENAI_API_KEY=your-key

# 本地模型
ollama serve
```

### 使用

```bash
# 查看状态
./autonomous-agent status

# AI 对话模式
./autonomous-agent chat

# 规划任务
./autonomous-agent task plan "推广 openmatrix"

# 生成内容
./autonomous-agent content generate --topic "OpenMatrix 入门" --type article

# 查看分析报告
./autonomous-agent analytics report --days 7
```

## 📖 CLI 命令

### 基础命令
| 命令 | 说明 |
|------|------|
| `status` | 显示智能体状态 |
| `chat` | AI 对话模式 |
| `update` | 检查更新 |

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

### 推广命令
| 命令 | 说明 |
|------|------|
| `content generate` | 生成内容 |
| `publish` | 发布到平台 |
| `community reply` | 回复社区 |
| `analytics report` | 分析报告 |

## 🏗️ 架构

```
autonomous-agent/
├── src/
│   ├── main.rs              # 入口和 CLI
│   ├── llm/                 # LLM 模块
│   │   ├── mod.rs           # 工厂和 trait
│   │   ├── types.rs         # 类型定义
│   │   ├── claude.rs        # Claude 适配器
│   │   ├── openai.rs        # OpenAI 适配器
│   │   └── local.rs         # Ollama 适配器
│   ├── tasks/               # 任务模块
│   │   ├── types.rs         # 任务类型
│   │   ├── planner.rs       # 任务规划器
│   │   └── executor.rs      # 任务执行器
│   ├── promotion/           # 推广模块
│   │   ├── content.rs       # 内容生成器
│   │   ├── publisher.rs     # 平台发布器
│   │   ├── community.rs     # 社区互动器
│   │   └── analytics.rs     # 数据分析器
│   ├── memory.rs            # 记忆系统
│   ├── goals.rs             # 目标管理
│   └── executor.rs          # 命令执行
└── Cargo.toml
```

## 🎨 使用示例

### AI 对话模式

```
$ ./autonomous-agent chat

🤖 OpenMatrix 推广智能体 - AI 对话模式
═════════════════════════════════════════
可用 LLM: claude

你: 帮我写一篇关于 OpenMatrix 的介绍文章

🤖 好的，我来为你撰写一篇介绍 OpenMatrix 的技术文章...
```

### 任务规划

```
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

## 🔮 路线图

- [x] Phase 1: LLM 集成
- [x] Phase 2: 任务规划
- [x] Phase 3: 推广能力
- [ ] Phase 4: 实战应用
  - [ ] 自动生成项目文档
  - [ ] 自动发布到多平台
  - [ ] 自动回复 GitHub Issues
  - [ ] 推广效果追踪

## 📄 许可证

MIT License

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**OpenMatrix** - 让开发更高效 🚀

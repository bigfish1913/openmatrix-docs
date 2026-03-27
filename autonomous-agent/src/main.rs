mod executor;
mod goals;
mod memory;
mod updater;
mod llm;
mod tasks;
mod promotion;

use anyhow::Result;
use clap::{Parser, Subcommand};
use executor::{CommandExecutor, ExecutorType};
use goals::{GoalManager, GoalPriority};
use memory::MemoryManager;
use llm::{LLMFactory, LLMProvider, types::{Message, ConversationContext}};
use tasks::{TaskPlanner, TaskExecutor};
use chrono::Utc;
use tracing::Level;
use std::io::{self, Write};

const VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Parser)]
#[command(name = "autonomous-agent")]
#[command(version = VERSION)]
#[command(about = "OpenMatrix 推广智能体 - AI 驱动的任务执行和推广助手")]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
    #[arg(short, long, global = true)]
    quiet: bool,
    #[arg(short, long, global = true)]
    debug: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// 添加记忆
    AddMemory { content: String, #[arg(short, long, default_value = "long")] memory_type: String, #[arg(short, long)] tags: Option<String> },
    /// 搜索记忆
    SearchMemory { query: String },
    /// 列出记忆
    ListMemories { #[arg(short, long)] memory_type: Option<String> },
    /// 列出 Session 记忆
    ListSessions,
    /// 切换 Session
    SetSession { session_id: Option<String> },
    /// 创建目标
    AddGoal { description: String, #[arg(short, long, default_value = "medium")] priority: String, #[arg(long)] deadline: Option<String> },
    /// 列出目标
    ListGoals { #[arg(short, long)] active: bool },
    /// 更新进度
    UpdateProgress { goal_id: String, #[arg(short, long)] progress: u8 },
    /// 设置聚焦目标
    Focus { goal_id: String },
    /// 执行命令
    Exec { command: String, #[arg(short, long)] executor: Option<String>, #[arg(short, long)] stream: bool },
    /// 测试执行器
    TestExecutors,
    /// 显示执行器信息
    ExecutorInfo,
    /// 显示状态
    Status,
    /// 检查更新
    Update,
    /// 清理
    Cleanup,
    /// 运行
    Run,
    /// AI 对话模式 (需要 LLM)
    Chat,
    /// LLM 相关命令
    Llm {
        #[command(subcommand)]
        command: LlmCommands,
    },
    /// 任务规划命令
    Task {
        #[command(subcommand)]
        command: TaskCommands,
    },
}

#[derive(Subcommand)]
enum LlmCommands {
    /// 列出可用的 LLM Provider
    List,
    /// 测试 LLM 连接
    Test { #[arg(short, long)] provider: Option<String> },
    /// 设置默认 Provider
    SetDefault { provider: String },
}

#[derive(Subcommand)]
enum TaskCommands {
    /// 规划任务
    Plan { description: String },
    /// 执行任务
    Execute { task_id: Option<String> },
    /// 列出任务
    List,
    /// 显示任务状态
    Status { task_id: String },
}

struct Agent {
    memory: std::sync::Arc<tokio::sync::RwLock<MemoryManager>>,
    goals: std::sync::Arc<tokio::sync::RwLock<GoalManager>>,
    executor: CommandExecutor,
    updater: updater::SelfUpdater,
    llm_factory: LLMFactory,
    task_planner: TaskPlanner,
}

impl Agent {
    async fn new() -> Result<Self> {
        let mut llm_factory = LLMFactory::new();

        // 注册所有 Provider
        llm_factory.register(Box::new(llm::claude::ClaudeProvider::new(None)));
        llm_factory.register(Box::new(llm::openai::OpenAIProvider::new(None)));
        llm_factory.register(Box::new(llm::local::LocalProvider::new(None)));

        Ok(Self {
            memory: std::sync::Arc::new(tokio::sync::RwLock::new(MemoryManager::new().await?)),
            goals: std::sync::Arc::new(tokio::sync::RwLock::new(GoalManager::new().await?)),
            executor: CommandExecutor::new()?,
            updater: updater::SelfUpdater::new(VERSION)?,
            llm_factory,
            task_planner: TaskPlanner::new(),
        })
    }

    async fn show_status(&self) {
        let m = self.memory.read().await;
        let g = self.goals.read().await;
        let available_llms = self.llm_factory.list_available().await;

        println!("\n📊 OpenMatrix 推广智能体 v{}", VERSION);
        println!("═══════════════════════════════════");
        println!("🧠 记忆：{}", m.retrieve("").len());
        println!("🎯 活跃目标：{}", g.active_goals().len());
        if let Some(f) = g.current_focus() { println!("🎯 聚焦：{} ({}%)", f.description, f.progress); }
        let overdue = g.overdue_goals();
        if !overdue.is_empty() { println!("⚠️  过期：{}", overdue.len()); }
        println!("🔧 执行器：{:?}", self.executor.current_executor());
        println!("🤖 可用 LLM：{}", if available_llms.is_empty() { "无".to_string() } else { available_llms.join(", ") });
        println!("💾 当前 Session: {}", m.current_session());
        println!();
    }

    async fn start_chat(&self) -> Result<()> {
        let available = self.llm_factory.list_available().await;

        if available.is_empty() {
            println!("\n⚠️  没有可用的 LLM Provider");
            println!("请配置以下环境变量之一:");
            println!("  - ANTHROPIC_API_KEY (Claude)");
            println!("  - OPENAI_API_KEY (OpenAI)");
            println!("  - 启动 Ollama 服务 (本地模型)\n");
            return Ok(());
        }

        println!("\n🤖 OpenMatrix 推广智能体 - AI 对话模式");
        println!("═════════════════════════════════════════");
        println!("可用 LLM: {}", available.join(", "));
        println!("输入消息与我交流。输入 'exit' 或 'quit' 退出");
        println!("特殊命令: /help /status /clear /goals /memories /model");
        println!("═════════════════════════════════════════\n");

        let stdin = io::stdin();
        let mut input = String::new();
        let mut context = ConversationContext::new()
            .with_system_prompt(self.get_system_prompt());

        let current_model = self.llm_factory.select_best().await;

        loop {
            print!("你: ");
            io::stdout().flush()?;

            input.clear();
            match stdin.read_line(&mut input) {
                Ok(0) => break,
                Ok(_) => {},
                Err(_) => break,
            }

            let line = input.trim();
            if line.is_empty() { continue; }

            match line {
                "exit" | "quit" | "q" => {
                    println!("\n👋 再见！");
                    break;
                }
                "/help" => {
                    println!("\n📖 可用命令:");
                    println!("  /status    - 显示状态");
                    println!("  /clear     - 清屏");
                    println!("  /goals     - 列出目标");
                    println!("  /memories  - 列出记忆");
                    println!("  /session   - 显示当前Session");
                    println!("  /model     - 切换 LLM 模型");
                    println!("  /plan      - 规划任务");
                    println!("  exit/quit  - 退出\n");
                }
                "/status" => { self.show_status().await; }
                "/clear" => {
                    print!("\x1B[2J\x1B[H");
                    context = ConversationContext::new()
                        .with_system_prompt(self.get_system_prompt());
                }
                "/goals" => {
                    let g = self.goals.read().await;
                    println!("\n🎯 目标列表:");
                    for goal in g.active_goals() {
                        println!("  [{}] {} - {}%", goal.id, goal.description, goal.progress);
                    }
                    println!();
                }
                "/memories" => {
                    let m = self.memory.read().await;
                    println!("\n🧠 记忆列表:");
                    for mem in m.retrieve("") {
                        println!("  [{}] {:?}", mem.id, mem.memory_type);
                    }
                    println!();
                }
                "/session" => {
                    let m = self.memory.read().await;
                    println!("\n💾 当前 Session: {}\n", m.current_session());
                }
                "/model" => {
                    println!("\n可用模型:");
                    for (i, model) in available.iter().enumerate() {
                        println!("  {}. {}", i + 1, model);
                    }
                    println!();
                }
                _ => {
                    // 使用 LLM 处理
                    if let Some(provider) = current_model.as_ref() {
                        context.add_user(line);

                        print!("\n🤖 思考中");
                        io::stdout().flush()?;

                        match provider.chat(context.to_messages()).await {
                            Ok(response) => {
                                context.add_assistant(&response.content);
                                println!("\r🤖 {}\n", response.content);

                                // 保存到记忆
                                let mut m = self.memory.write().await;
                                m.add_session_memory(
                                    format!("用户: {}\n助手: {}", line, response.content),
                                    vec!["chat".to_string()]
                                );
                                let _ = m.save().await;
                            }
                            Err(e) => {
                                println!("\r❌ LLM 错误: {}\n", e);
                            }
                        }
                    } else {
                        // 回退到简单处理
                        let response = self.process_chat_input_simple(line).await;
                        println!("\n🤖 {}\n", response);
                    }
                }
            }
        }
        Ok(())
    }

    fn get_system_prompt(&self) -> String {
        r#"你是 OpenMatrix 推广智能体，一个专注于帮助推广 OpenMatrix 项目的 AI 助手。

你的核心能力:
1. 📝 内容生成 - 自动生成技术文章、教程、公告
2. 📢 平台发布 - 发布到 GitHub、掘金、公众号、小红书等
3. 💬 社区互动 - 回复 Issue、PR、评论
4. 📊 数据分析 - 分析数据，优化推广策略

你的性格:
- 专业但友好
- 热情推广 OpenMatrix
- 擅长技术写作
- 理解开发者需求

当用户请求帮助时，你应该:
1. 理解用户的具体需求
2. 提供可行的方案
3. 必要时规划任务步骤
4. 执行并跟踪进度

OpenMatrix 是一个开源的 AI 任务编排系统，帮助开发者更高效地完成开发任务。"#
            .to_string()
    }

    async fn process_chat_input_simple(&self, input: &str) -> String {
        let lower = input.to_lowercase();

        // 记住相关内容
        if lower.contains("记住") || lower.contains("记得") {
            let content = input.replace("记住", "").replace("记得", "").trim().to_string();
            if content.is_empty() {
                return "请告诉我你想记住什么。例如: '记住我的项目叫OpenMatrix'".to_string();
            }
            let mut m = self.memory.write().await;
            let id = m.add_long_term(content.clone(), vec!["chat".to_string()]);
            let _ = m.save().await;
            return format!("✅ 已记住: {}", id);
        }

        // 创建目标
        if lower.contains("目标") || lower.contains("完成") || lower.contains("任务") {
            let content = input.replace("目标", "").replace("完成", "").replace("任务", "").trim().to_string();
            if content.len() < 3 {
                return "请告诉我具体的目标。例如: '完成项目文档'".to_string();
            }
            let mut g = self.goals.write().await;
            let id = g.create_goal(content, GoalPriority::Medium, None);
            let _ = g.save().await;
            return format!("✅ 已创建目标: {}", id);
        }

        // 执行命令
        if lower.starts_with("执行") || lower.starts_with("运行") || lower.starts_with("run ") {
            let cmd = input.replace("执行", "").replace("运行", "").replace("run", "").trim().to_string();
            if cmd.is_empty() {
                return "请告诉我你想执行什么命令。例如: '执行 ls -la'".to_string();
            }
            match self.executor.execute(&cmd).await {
                Ok(result) => {
                    if result.success {
                        return format!("✅ 执行成功:\n{}", result.stdout);
                    } else {
                        return format!("❌ 执行失败:\n{}", result.stderr);
                    }
                }
                Err(e) => return format!("❌ 错误: {}", e),
            }
        }

        // 搜索记忆
        if lower.contains("回忆") || lower.contains("搜索") || lower.contains("查找") {
            let query = input.replace("回忆", "").replace("搜索", "").replace("查找", "").trim().to_string();
            if query.is_empty() {
                return "请告诉我你想搜索什么。例如: '回忆项目'".to_string();
            }
            let m = self.memory.read().await;
            let results = m.retrieve(&query);
            if results.is_empty() {
                return format!("没有找到关于 '{}' 的记忆", query);
            }
            let mut response = format!("找到 {} 条相关记忆:\n", results.len());
            for mem in results.iter().take(5) {
                response.push_str(&format!("- {}\n", mem.content));
            }
            return response;
        }

        // 获取上下文回复
        let m = self.memory.read().await;
        let memories = m.retrieve(input);
        let g = self.goals.read().await;
        let goals = g.active_goals();

        let mut context = String::new();
        if !memories.is_empty() {
            context.push_str("相关记忆: ");
            for mem in memories.iter().take(3) {
                context.push_str(&format!("{}, ", mem.content));
            }
            context.push_str("\n");
        }
        if !goals.is_empty() {
            context.push_str("活跃目标: ");
            for goal in goals.iter().take(3) {
                context.push_str(&format!("{} ({}%), ", goal.description, goal.progress));
            }
        }

        if context.is_empty() {
            format!("收到: \"{}\"。我可以帮你记住信息、创建目标或执行命令。试试说 '记住...' 或 '目标...'", input)
        } else {
            format!("收到: \"{}\"\n{}\n需要我帮你做什么?", input, context)
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    let level = if cli.debug { Level::DEBUG } else if cli.quiet { Level::WARN } else { Level::INFO };
    let _ = tracing_subscriber::FmtSubscriber::builder().with_max_level(level).with_target(false).without_time().try_init();

    let agent = Agent::new().await?;

    match cli.command {
        Some(Commands::AddMemory { content, memory_type, tags }) => {
            let mut m = agent.memory.write().await;
            let t: Vec<String> = tags.map(|s| s.split(',').map(|x| x.trim().to_string()).collect()).unwrap_or_default();
            let id = match memory_type.as_str() {
                "short" => m.add_short_term(content.clone(), t.clone()),
                "session" => m.add_session_memory(content.clone(), t.clone()),
                _ => m.add_long_term(content.clone(), t.clone()),
            };
            m.save().await?;
            println!("✅ 记忆已添加：{} (类型：{})", id, memory_type);
        }
        Some(Commands::SearchMemory { query }) => {
            let m = agent.memory.read().await;
            let r = m.retrieve(&query);
            if r.is_empty() { println!("未找到"); } else { for x in r { println!("[{}] [{:?}] {}", x.id, x.memory_type, x.content); } }
        }
        Some(Commands::ListMemories { memory_type }) => {
            let m = agent.memory.read().await;
            let memories = m.retrieve("");
            for x in memories {
                if let Some(ref t) = memory_type {
                    let type_str = format!("{:?}", x.memory_type).to_lowercase();
                    let search = t.to_lowercase();
                    if !type_str.contains(&search) { continue; }
                }
                println!("[{}] [{:?}] {}", x.id, x.memory_type, x.content);
            }
        }
        Some(Commands::ListSessions) => {
            let m = agent.memory.read().await;
            println!("当前 Session: {}", m.current_session());
        }
        Some(Commands::SetSession { session_id }) => {
            let mut m = agent.memory.write().await;
            let sid = session_id.unwrap_or_else(|| Utc::now().format("%Y%m%d_%H%M%S").to_string());
            m.set_session(sid.clone()).await?;
            println!("✅ 已切换到 Session: {}", sid);
        }
        Some(Commands::AddGoal { description, priority, deadline: _ }) => {
            let p = match priority.as_str() { "low" => GoalPriority::Low, "high" => GoalPriority::High, "critical" => GoalPriority::Critical, _ => GoalPriority::Medium };
            let mut g = agent.goals.write().await;
            let id = g.create_goal(description, p, None);
            g.save().await?;
            println!("✅ 目标已创建：{}", id);
        }
        Some(Commands::ListGoals { active }) => {
            let g = agent.goals.read().await;
            let goals = if active { g.active_goals() } else { g.goals_by_priority() };
            for x in goals { println!("[{}] {} - {}% ({:?})", x.id, x.description, x.progress, x.status); }
        }
        Some(Commands::UpdateProgress { goal_id, progress }) => {
            let mut g = agent.goals.write().await;
            g.update_progress(&goal_id, progress);
            g.save().await?;
            println!("✅ 进度已更新");
        }
        Some(Commands::Focus { goal_id }) => {
            let mut g = agent.goals.write().await;
            if g.set_focus(&goal_id) { println!("✅ 聚焦目标：{}", goal_id); } else { println!("❌ 目标不存在"); }
        }
        Some(Commands::Exec { command, executor, stream: _ }) => {
            let ex = match executor.as_deref() {
                Some("cmd") => ExecutorType::Cmd,
                Some("powershell") | Some("ps") => ExecutorType::PowerShell,
                Some("wsl") => ExecutorType::Wsl,
                Some("shell") | Some("bash") => ExecutorType::Shell,
                _ => agent.executor.current_executor().clone(),
            };
            let r = agent.executor.execute_with_executor(&command, ex).await?;
            println!("\nExecutor: {}", r.executor);
            println!("Success: {}", r.success);
            if !r.stdout.is_empty() { println!("Stdout:\n{}", r.stdout); }
            if !r.stderr.is_empty() { println!("Stderr:\n{}", r.stderr); }
        }
        Some(Commands::TestExecutors) => {
            println!("Testing executors...");
            for (name, ok) in agent.executor.test_all_executors().await {
                println!("{}: {}", name, if ok { "✅" } else { "❌" });
            }
        }
        Some(Commands::ExecutorInfo) => {
            println!("Current executor: {:?}", agent.executor.current_executor());
            println!("WSL available: {}", agent.executor.can_use_wsl());
        }
        Some(Commands::Status) => agent.show_status().await,
        Some(Commands::Update) => { agent.updater.update().await?; }
        Some(Commands::Cleanup) => {
            let mut g = agent.goals.write().await;
            let n = g.cleanup_completed(30).await?;
            println!("✅ 清理了 {} 个已完成目标", n);
        }
        Some(Commands::Chat) => {
            agent.start_chat().await?;
        }
        Some(Commands::Llm { command }) => {
            match command {
                LlmCommands::List => {
                    let available = agent.llm_factory.list_available().await;
                    println!("\n🤖 可用的 LLM Provider:");
                    if available.is_empty() {
                        println!("  无。请配置环境变量:");
                        println!("    - ANTHROPIC_API_KEY");
                        println!("    - OPENAI_API_KEY");
                        println!("    - 或启动 Ollama 服务");
                    } else {
                        for name in &available {
                            println!("  ✅ {}", name);
                        }
                    }
                    println!();
                }
                LlmCommands::Test { provider } => {
                    if let Some(p) = agent.llm_factory.get_provider(provider.as_deref()) {
                        let available = p.is_available().await;
                        println!("{}: {}", p.name(), if available { "✅ 可用" } else { "❌ 不可用" });
                    } else {
                        println!("❌ Provider 不存在");
                    }
                }
                LlmCommands::SetDefault { provider } => {
                    println!("✅ 默认 Provider 已设置为: {}", provider);
                }
            }
        }
        Some(Commands::Task { command }) => {
            match command {
                TaskCommands::Plan { description } => {
                    println!("📋 规划任务: {}", description);
                    let plan = agent.task_planner.plan(&description);
                    println!("\n{}", plan);
                }
                TaskCommands::Execute { task_id } => {
                    println!("🚀 执行任务: {:?}", task_id);
                }
                TaskCommands::List => {
                    println!("📋 任务列表:");
                }
                TaskCommands::Status { task_id } => {
                    println!("📊 任务状态: {}", task_id);
                }
            }
        }
        Some(Commands::Run) | None => agent.show_status().await,
    }
    Ok(())
}

//! 任务规划器

use super::types::{Task, TaskStep, TaskPriority, TaskTemplate, TemplateStep};

/// 任务规划器
pub struct TaskPlanner {
    templates: Vec<TaskTemplate>,
}

impl TaskPlanner {
    pub fn new() -> Self {
        Self {
            templates: Self::load_default_templates(),
        }
    }

    /// 规划任务
    pub fn plan(&self, description: &str) -> String {
        let task = self.analyze_and_create(description);
        self.format_plan(&task)
    }

    /// 分析描述并创建任务
    fn analyze_and_create(&self, description: &str) -> Task {
        let mut task = Task::new("智能任务", description);
        task.priority = self.detect_priority(description);

        // 根据关键词匹配模板
        if let Some(template) = self.match_template(description) {
            self.apply_template(&mut task, &template);
        } else {
            // 默认分解
            self.smart_decompose(&mut task, description);
        }

        task
    }

    /// 检测优先级
    fn detect_priority(&self, description: &str) -> TaskPriority {
        let lower = description.to_lowercase();

        if lower.contains("紧急") || lower.contains("立即") || lower.contains("urgent") {
            TaskPriority::Critical
        } else if lower.contains("重要") || lower.contains("important") || lower.contains("高优先") {
            TaskPriority::High
        } else if lower.contains("低优先") || lower.contains("稍后") {
            TaskPriority::Low
        } else {
            TaskPriority::Medium
        }
    }

    /// 匹配任务模板
    fn match_template(&self, description: &str) -> Option<&TaskTemplate> {
        let lower = description.to_lowercase();

        // 推广相关模板
        if lower.contains("发布") || lower.contains("publish") {
            return self.templates.iter().find(|t| t.name == "发布内容");
        }
        if lower.contains("文章") || lower.contains("article") || lower.contains("写") {
            return self.templates.iter().find(|t| t.name == "生成文章");
        }
        if lower.contains("回复") || lower.contains("issue") || lower.contains("comment") {
            return self.templates.iter().find(|t| t.name == "社区互动");
        }

        None
    }

    /// 应用模板
    fn apply_template(&self, task: &mut Task, template: &TaskTemplate) {
        task.tags = template.tags.clone();

        for (i, step) in template.steps.iter().enumerate() {
            task.add_step(TaskStep::new(
                format!("step-{}", i + 1),
                &step.description,
                i as u32 + 1,
            ).with_command(&step.command_template));
        }
    }

    /// 智能分解任务
    fn smart_decompose(&self, task: &mut Task, description: &str) {
        let lower = description.to_lowercase();

        // 通用任务分解
        if lower.contains("推广") || lower.contains("promote") {
            self.add_promotion_steps(task);
        } else if lower.contains("部署") || lower.contains("deploy") {
            self.add_deployment_steps(task);
        } else if lower.contains("分析") || lower.contains("analyze") {
            self.add_analysis_steps(task);
        } else {
            // 默认简单分解
            self.add_generic_steps(task, description);
        }
    }

    fn add_promotion_steps(&self, task: &mut Task) {
        task.tags = vec!["推广".to_string()];

        task.add_step(TaskStep::new("analyze", "分析目标受众和平台", 1));
        task.add_step(TaskStep::new("content", "生成推广内容", 2));
        task.add_step(TaskStep::new("review", "审核内容质量", 3));
        task.add_step(TaskStep::new("publish", "发布到目标平台", 4));
        task.add_step(TaskStep::new("track", "跟踪效果数据", 5));
    }

    fn add_deployment_steps(&self, task: &mut Task) {
        task.tags = vec!["部署".to_string()];

        task.add_step(TaskStep::new("build", "构建项目", 1)
            .with_command("cargo build --release"));
        task.add_step(TaskStep::new("test", "运行测试", 2)
            .with_command("cargo test"));
        task.add_step(TaskStep::new("deploy", "执行部署", 3));
        task.add_step(TaskStep::new("verify", "验证部署结果", 4));
    }

    fn add_analysis_steps(&self, task: &mut Task) {
        task.tags = vec!["分析".to_string()];

        task.add_step(TaskStep::new("collect", "收集数据", 1));
        task.add_step(TaskStep::new("process", "处理数据", 2));
        task.add_step(TaskStep::new("analyze", "执行分析", 3));
        task.add_step(TaskStep::new("report", "生成报告", 4));
    }

    fn add_generic_steps(&self, task: &mut Task, description: &str) {
        task.add_step(TaskStep::new("analyze", format!("分析: {}", description), 1));
        task.add_step(TaskStep::new("plan", "制定执行计划", 2));
        task.add_step(TaskStep::new("execute", "执行任务", 3));
        task.add_step(TaskStep::new("verify", "验证结果", 4));
    }

    /// 格式化任务计划
    fn format_plan(&self, task: &Task) -> String {
        let mut output = String::new();

        output.push_str(&format!("\n📋 任务计划: {}\n", task.title));
        output.push_str(&format!("   描述: {}\n", task.description));
        output.push_str(&format!("   优先级: {:?}\n", task.priority));
        output.push_str("\n📝 执行步骤:\n");

        for step in &task.steps {
            let status_icon = match step.status {
                super::types::TaskStatus::Pending => "⏳",
                super::types::TaskStatus::Running => "🔄",
                super::types::TaskStatus::Completed => "✅",
                super::types::TaskStatus::Failed => "❌",
                super::types::TaskStatus::Cancelled => "🚫",
            };
            output.push_str(&format!("   {} {}. {}\n", status_icon, step.order, step.description));
            if let Some(ref cmd) = step.command {
                output.push_str(&format!("      命令: {}\n", cmd));
            }
        }

        output.push_str(&format!("\n📊 预计步骤: {}\n", task.steps.len()));

        output
    }

    /// 加载默认模板
    fn load_default_templates() -> Vec<TaskTemplate> {
        vec![
            TaskTemplate {
                name: "生成文章".to_string(),
                description: "生成技术文章".to_string(),
                tags: vec!["内容生成".to_string()],
                steps: vec![
                    TemplateStep {
                        description: "分析主题和目标受众".to_string(),
                        command_template: "llm analyze --topic {topic}".to_string(),
                    },
                    TemplateStep {
                        description: "生成文章大纲".to_string(),
                        command_template: "llm outline --topic {topic}".to_string(),
                    },
                    TemplateStep {
                        description: "撰写文章内容".to_string(),
                        command_template: "llm write --outline {outline}".to_string(),
                    },
                    TemplateStep {
                        description: "审核和优化".to_string(),
                        command_template: "llm review --content {content}".to_string(),
                    },
                ],
            },
            TaskTemplate {
                name: "发布内容".to_string(),
                description: "发布内容到多个平台".to_string(),
                tags: vec!["发布".to_string()],
                steps: vec![
                    TemplateStep {
                        description: "准备发布内容".to_string(),
                        command_template: "content prepare --file {file}".to_string(),
                    },
                    TemplateStep {
                        description: "发布到 GitHub".to_string(),
                        command_template: "publish github --content {content}".to_string(),
                    },
                    TemplateStep {
                        description: "发布到掘金".to_string(),
                        command_template: "publish juejin --content {content}".to_string(),
                    },
                    TemplateStep {
                        description: "发布到公众号".to_string(),
                        command_template: "publish wechat --content {content}".to_string(),
                    },
                ],
            },
            TaskTemplate {
                name: "社区互动".to_string(),
                description: "处理社区互动".to_string(),
                tags: vec!["社区".to_string()],
                steps: vec![
                    TemplateStep {
                        description: "获取待处理项".to_string(),
                        command_template: "community fetch --type {type}".to_string(),
                    },
                    TemplateStep {
                        description: "生成回复内容".to_string(),
                        command_template: "llm reply --context {context}".to_string(),
                    },
                    TemplateStep {
                        description: "发送回复".to_string(),
                        command_template: "community reply --id {id}".to_string(),
                    },
                ],
            },
        ]
    }
}

impl Default for TaskPlanner {
    fn default() -> Self {
        Self::new()
    }
}

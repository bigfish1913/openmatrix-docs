//! 社区互动管理器
//!
//! 处理 GitHub Issues、PR、评论等社区互动

use anyhow::Result;
use chrono::Utc;
use std::sync::Arc;

use crate::llm::{LLMProvider, types::Message};
use super::types::{InteractionType, InteractionRecord, Platform};

/// 社区互动管理器
pub struct CommunityManager {
    llm: Option<Arc<dyn LLMProvider>>,
    history: Vec<InteractionRecord>,
}

impl CommunityManager {
    pub fn new() -> Self {
        Self {
            llm: None,
            history: Vec::new(),
        }
    }

    pub fn with_llm(mut self, llm: Arc<dyn LLMProvider>) -> Self {
        self.llm = Some(llm);
        self
    }

    /// 生成回复
    pub async fn generate_reply(
        &mut self,
        context: &str,
        interaction_type: InteractionType,
    ) -> Result<String> {
        if let Some(ref llm) = self.llm {
            self.generate_reply_with_llm(llm.as_ref(), context, &interaction_type).await
        } else {
            Ok(self.get_template_reply(&interaction_type))
        }
    }

    /// 使用 LLM 生成回复
    async fn generate_reply_with_llm(
        &self,
        llm: &dyn LLMProvider,
        context: &str,
        interaction_type: &InteractionType,
    ) -> Result<String> {
        let system_prompt = self.get_system_prompt(interaction_type);
        let user_prompt = format!("请回复以下内容：\n\n{}", context);

        let messages = vec![
            Message::system(&system_prompt),
            Message::user(&user_prompt),
        ];

        let response = llm.chat(messages).await?;
        Ok(response.content)
    }

    /// 获取模板回复
    fn get_template_reply(&self, interaction_type: &InteractionType) -> String {
        match interaction_type {
            InteractionType::IssueReply => {
                r#"感谢你的反馈！

我们已经注意到这个问题，正在调查中。如果有任何进展，我们会及时更新。

如果急需解决，欢迎提交 PR！

---
OpenMatrix 团队"#.to_string()
            }
            InteractionType::PRReview => {
                r#"感谢你的贡献！

代码看起来不错，我们正在进行详细审查。

建议：
- 确保测试覆盖
- 更新相关文档

期待你的更多贡献！

---
OpenMatrix 团队"#.to_string()
            }
            InteractionType::CommentReply => {
                "感谢你的评论！我们会认真考虑你的建议。".to_string()
            }
            InteractionType::WelcomeMessage => {
                r#"欢迎加入 OpenMatrix 社区！🎉

感谢你的关注和支持。这里有一些资源帮助你开始：

- 📖 文档：https://matrix.laofu.online
- 💬 社区：GitHub Discussions
- 🐛 问题：GitHub Issues

有任何问题随时提问！

---
OpenMatrix 团队"#.to_string()
            }
            InteractionType::ThankYou => {
                "感谢你的支持！你的反馈对我们非常重要。🙏".to_string()
            }
        }
    }

    /// 获取系统提示词
    fn get_system_prompt(&self, interaction_type: &InteractionType) -> String {
        let role = match interaction_type {
            InteractionType::IssueReply => "技术支持专家",
            InteractionType::PRReview => "代码审查专家",
            InteractionType::CommentReply => "友好的社区成员",
            InteractionType::WelcomeMessage => "社区管理员",
            InteractionType::ThankYou => "感恩的维护者",
        };

        format!(
            "你是 OpenMatrix 的{}。\n\n\
             OpenMatrix 是一个开源的 AI 任务编排系统。\n\n\
             你的职责是专业、友好地回复社区反馈。\n\
             回复要求：\n\
             - 简洁明了\n\
             - 专业友好\n\
             - 提供有价值的信息\n\
             - 鼓励参与贡献",
            role
        )
    }

    /// 处理 Issue
    pub async fn handle_issue(&mut self, issue_id: &str, title: &str, body: &str) -> Result<InteractionRecord> {
        let context = format!("Issue #{}: {}\n\n{}", issue_id, title, body);
        let reply = self.generate_reply(&context, InteractionType::IssueReply).await?;

        let record = InteractionRecord {
            id: uuid::Uuid::new_v4().to_string(),
            interaction_type: InteractionType::IssueReply,
            platform: Platform::GitHub,
            target_id: issue_id.to_string(),
            content: reply,
            success: true,
            created_at: Utc::now(),
        };

        self.history.push(record.clone());
        Ok(record)
    }

    /// 处理 PR
    pub async fn handle_pr(&mut self, pr_id: &str, title: &str, body: &str) -> Result<InteractionRecord> {
        let context = format!("PR #{}: {}\n\n{}", pr_id, title, body);
        let reply = self.generate_reply(&context, InteractionType::PRReview).await?;

        let record = InteractionRecord {
            id: uuid::Uuid::new_v4().to_string(),
            interaction_type: InteractionType::PRReview,
            platform: Platform::GitHub,
            target_id: pr_id.to_string(),
            content: reply,
            success: true,
            created_at: Utc::now(),
        };

        self.history.push(record.clone());
        Ok(record)
    }

    /// 发送欢迎消息
    pub fn generate_welcome(&self) -> String {
        self.get_template_reply(&InteractionType::WelcomeMessage)
    }

    /// 获取互动历史
    pub fn get_history(&self) -> &[InteractionRecord] {
        &self.history
    }

    /// 统计互动数量
    pub fn stats(&self) -> CommunityStats {
        let mut stats = CommunityStats::default();

        for record in &self.history {
            match record.interaction_type {
                InteractionType::IssueReply => stats.issues_replied += 1,
                InteractionType::PRReview => stats.prs_reviewed += 1,
                InteractionType::CommentReply => stats.comments_replied += 1,
                InteractionType::WelcomeMessage => stats.welcomes_sent += 1,
                InteractionType::ThankYou => stats.thank_yous += 1,
            }
        }

        stats
    }
}

impl Default for CommunityManager {
    fn default() -> Self {
        Self::new()
    }
}

/// 社区互动统计
#[derive(Debug, Clone, Default)]
pub struct CommunityStats {
    pub issues_replied: u32,
    pub prs_reviewed: u32,
    pub comments_replied: u32,
    pub welcomes_sent: u32,
    pub thank_yous: u32,
}

impl CommunityStats {
    pub fn total(&self) -> u32 {
        self.issues_replied + self.prs_reviewed + self.comments_replied +
        self.welcomes_sent + self.thank_yous
    }
}

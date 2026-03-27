//! 推广模块类型定义

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 内容类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContentType {
    /// 技术文章
    Article,
    /// 教程
    Tutorial,
    /// 公告
    Announcement,
    /// 更新日志
    Changelog,
    /// 社交媒体帖子
    SocialPost,
    /// 评论回复
    Comment,
}

/// 内容状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContentStatus {
    Draft,
    Reviewing,
    Approved,
    Published,
    Failed,
}

/// 生成的内容
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedContent {
    pub id: String,
    pub title: String,
    pub content: String,
    pub content_type: ContentType,
    pub status: ContentStatus,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub word_count: usize,
    pub summary: String,
}

impl GeneratedContent {
    pub fn new(title: impl Into<String>, content: impl Into<String>, content_type: ContentType) -> Self {
        let content = content.into();
        let word_count = content.chars().count();
        let summary = content.chars().take(200).collect();

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title: title.into(),
            content,
            content_type,
            status: ContentStatus::Draft,
            tags: Vec::new(),
            created_at: Utc::now(),
            word_count,
            summary,
        }
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = tags;
        self
    }
}

/// 发布平台
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Platform {
    GitHub,
    Juejin,
    WeChat,
    XiaoHongShu,
    Zhihu,
    Twitter,
    Custom(String),
}

impl Platform {
    pub fn name(&self) -> &str {
        match self {
            Platform::GitHub => "GitHub",
            Platform::Juejin => "掘金",
            Platform::WeChat => "微信公众号",
            Platform::XiaoHongShu => "小红书",
            Platform::Zhihu => "知乎",
            Platform::Twitter => "Twitter",
            Platform::Custom(name) => name,
        }
    }
}

/// 发布结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublishResult {
    pub platform: Platform,
    pub success: bool,
    pub url: Option<String>,
    pub message: String,
    pub published_at: DateTime<Utc>,
}

/// 社区互动类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum InteractionType {
    IssueReply,
    PRReview,
    CommentReply,
    WelcomeMessage,
    ThankYou,
}

/// 社区互动记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionRecord {
    pub id: String,
    pub interaction_type: InteractionType,
    pub platform: Platform,
    pub target_id: String,
    pub content: String,
    pub success: bool,
    pub created_at: DateTime<Utc>,
}

/// 分析指标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metrics {
    pub views: u64,
    pub likes: u64,
    pub comments: u64,
    pub shares: u64,
    pub stars: u64,
    pub forks: u64,
}

impl Default for Metrics {
    fn default() -> Self {
        Self {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            stars: 0,
            forks: 0,
        }
    }
}

/// 分析报告
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsReport {
    pub id: String,
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub total_content: u32,
    pub total_interactions: u32,
    pub metrics: Metrics,
    pub platform_breakdown: std::collections::HashMap<String, Metrics>,
    pub top_content: Vec<String>,
    pub recommendations: Vec<String>,
    pub generated_at: DateTime<Utc>,
}

impl AnalyticsReport {
    pub fn new(period_start: DateTime<Utc>, period_end: DateTime<Utc>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            period_start,
            period_end,
            total_content: 0,
            total_interactions: 0,
            metrics: Metrics::default(),
            platform_breakdown: std::collections::HashMap::new(),
            top_content: Vec::new(),
            recommendations: Vec::new(),
            generated_at: Utc::now(),
        }
    }
}

/// 推广配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromotionConfig {
    /// 目标平台
    pub platforms: Vec<Platform>,
    /// 内容风格
    pub style: ContentStyle,
    /// 目标受众
    pub target_audience: String,
    /// 发布频率 (每天)
    pub daily_post_limit: u32,
}

impl Default for PromotionConfig {
    fn default() -> Self {
        Self {
            platforms: vec![Platform::GitHub, Platform::Juejin],
            style: ContentStyle::Technical,
            target_audience: "开发者".to_string(),
            daily_post_limit: 3,
        }
    }
}

/// 内容风格
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContentStyle {
    /// 技术专业
    Technical,
    /// 轻松幽默
    Casual,
    /// 正式官方
    Formal,
    /// 故事化
    Storytelling,
}

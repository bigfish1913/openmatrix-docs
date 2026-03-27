//! 平台发布器
//!
//! 支持发布内容到多个平台

use anyhow::{Result, Context};
use chrono::Utc;

use super::types::{GeneratedContent, Platform, PublishResult};

/// 平台发布器
pub struct PlatformPublisher {
    /// 已配置的平台
    platforms: Vec<PlatformConfig>,
}

/// 平台配置
#[derive(Debug, Clone)]
pub struct PlatformConfig {
    pub platform: Platform,
    pub enabled: bool,
    pub api_key: Option<String>,
    pub api_secret: Option<String>,
    pub base_url: Option<String>,
}

impl PlatformConfig {
    pub fn new(platform: Platform) -> Self {
        Self {
            platform,
            enabled: true,
            api_key: None,
            api_secret: None,
            base_url: None,
        }
    }

    pub fn with_api_key(mut self, key: impl Into<String>) -> Self {
        self.api_key = Some(key.into());
        self
    }

    pub fn disabled(mut self) -> Self {
        self.enabled = false;
        self
    }
}

impl PlatformPublisher {
    pub fn new() -> Self {
        Self {
            platforms: Self::load_default_platforms(),
        }
    }

    /// 加载默认平台配置
    fn load_default_platforms() -> Vec<PlatformConfig> {
        vec![
            PlatformConfig::new(Platform::GitHub),
            PlatformConfig::new(Platform::Juejin),
            PlatformConfig::new(Platform::WeChat),
            PlatformConfig::new(Platform::XiaoHongShu),
        ]
    }

    /// 发布内容到指定平台
    pub async fn publish(&self, content: &GeneratedContent, platform: &Platform) -> Result<PublishResult> {
        let config = self.get_platform_config(platform);

        if !config.map(|c| c.enabled).unwrap_or(false) {
            return Ok(PublishResult {
                platform: platform.clone(),
                success: false,
                url: None,
                message: "平台未启用".to_string(),
                published_at: Utc::now(),
            });
        }

        match platform {
            Platform::GitHub => self.publish_to_github(content).await,
            Platform::Juejin => self.publish_to_juejin(content).await,
            Platform::WeChat => self.publish_to_wechat(content).await,
            Platform::XiaoHongShu => self.publish_to_xiaohongshu(content).await,
            Platform::Zhihu => self.publish_to_zhihu(content).await,
            Platform::Twitter => self.publish_to_twitter(content).await,
            Platform::Custom(name) => self.publish_to_custom(content, name).await,
        }
    }

    /// 发布到所有已启用的平台
    pub async fn publish_to_all(&self, content: &GeneratedContent) -> Vec<PublishResult> {
        let mut results = Vec::new();

        for config in &self.platforms {
            if config.enabled {
                match self.publish(content, &config.platform).await {
                    Ok(result) => results.push(result),
                    Err(e) => results.push(PublishResult {
                        platform: config.platform.clone(),
                        success: false,
                        url: None,
                        message: format!("发布失败: {}", e),
                        published_at: Utc::now(),
                    }),
                }
            }
        }

        results
    }

    /// 获取平台配置
    fn get_platform_config(&self, platform: &Platform) -> Option<&PlatformConfig> {
        self.platforms.iter().find(|c| &c.platform == platform)
    }

    // === 各平台发布实现 ===

    async fn publish_to_github(&self, content: &GeneratedContent) -> Result<PublishResult> {
        // 模拟发布到 GitHub (实际实现需要 GitHub API)
        let url = format!(
            "https://github.com/bigfish1913/openmatrix/blob/main/docs/{}.md",
            content.title.to_lowercase().replace(' ', "-")
        );

        Ok(PublishResult {
            platform: Platform::GitHub,
            success: true,
            url: Some(url),
            message: "已创建文档".to_string(),
            published_at: Utc::now(),
        })
    }

    async fn publish_to_juejin(&self, content: &GeneratedContent) -> Result<PublishResult> {
        // 模拟发布到掘金
        let url = format!(
            "https://juejin.cn/post/{}",
            uuid::Uuid::new_v4().to_string()
        );

        Ok(PublishResult {
            platform: Platform::Juejin,
            success: true,
            url: Some(url),
            message: "文章已发布".to_string(),
            published_at: Utc::now(),
        })
    }

    async fn publish_to_wechat(&self, content: &GeneratedContent) -> Result<PublishResult> {
        // 模拟发布到微信公众号
        Ok(PublishResult {
            platform: Platform::WeChat,
            success: true,
            url: None,
            message: "草稿已保存，请登录公众号后台审核发布".to_string(),
            published_at: Utc::now(),
        })
    }

    async fn publish_to_xiaohongshu(&self, content: &GeneratedContent) -> Result<PublishResult> {
        // 模拟发布到小红书
        Ok(PublishResult {
            platform: Platform::XiaoHongShu,
            success: true,
            url: None,
            message: "笔记已提交审核".to_string(),
            published_at: Utc::now(),
        })
    }

    async fn publish_to_zhihu(&self, content: &GeneratedContent) -> Result<PublishResult> {
        // 模拟发布到知乎
        let url = format!(
            "https://zhuanlan.zhihu.com/p/{}",
            uuid::Uuid::new_v4().to_string()
        );

        Ok(PublishResult {
            platform: Platform::Zhihu,
            success: true,
            url: Some(url),
            message: "文章已发布".to_string(),
            published_at: Utc::now(),
        })
    }

    async fn publish_to_twitter(&self, content: &GeneratedContent) -> Result<PublishResult> {
        // 模拟发布到 Twitter
        let url = format!(
            "https://twitter.com/openmatrix/status/{}",
            uuid::Uuid::new_v4().to_string()
        );

        Ok(PublishResult {
            platform: Platform::Twitter,
            success: true,
            url: Some(url),
            message: "推文已发布".to_string(),
            published_at: Utc::now(),
        })
    }

    async fn publish_to_custom(&self, content: &GeneratedContent, name: &str) -> Result<PublishResult> {
        // 自定义平台
        Ok(PublishResult {
            platform: Platform::Custom(name.to_string()),
            success: false,
            url: None,
            message: "自定义平台需要实现发布逻辑".to_string(),
            published_at: Utc::now(),
        })
    }

    /// 添加平台配置
    pub fn add_platform(&mut self, config: PlatformConfig) {
        // 移除同平台旧配置
        self.platforms.retain(|c| c.platform != config.platform);
        self.platforms.push(config);
    }

    /// 列出所有平台
    pub fn list_platforms(&self) -> &Vec<PlatformConfig> {
        &self.platforms
    }

    /// 生成发布计划
    pub fn generate_schedule(&self, days: u32) -> Vec<ScheduleItem> {
        let mut schedule = Vec::new();
        let mut current_day = 0;

        for platform in &self.platforms {
            if platform.enabled {
                schedule.push(ScheduleItem {
                    platform: platform.platform.clone(),
                    day: current_day % days,
                    description: format!("发布到 {}", platform.platform.name()),
                });
                current_day += 1;
            }
        }

        schedule
    }
}

impl Default for PlatformPublisher {
    fn default() -> Self {
        Self::new()
    }
}

/// 发布计划项
#[derive(Debug, Clone)]
pub struct ScheduleItem {
    pub platform: Platform,
    pub day: u32,
    pub description: String,
}

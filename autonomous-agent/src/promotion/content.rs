//! 内容生成器
//!
//! 使用 LLM 生成各类推广内容

use anyhow::Result;
use std::sync::Arc;

use crate::llm::{LLMProvider, types::{Message, ConversationContext}};
use super::types::{ContentType, ContentStyle, GeneratedContent, PromotionConfig};

/// 内容生成器
pub struct ContentGenerator {
    config: PromotionConfig,
    llm: Option<Arc<dyn LLMProvider>>,
}

impl ContentGenerator {
    pub fn new(config: PromotionConfig) -> Self {
        Self {
            config,
            llm: None,
        }
    }

    pub fn with_llm(mut self, llm: Arc<dyn LLMProvider>) -> Self {
        self.llm = Some(llm);
        self
    }

    /// 生成内容
    pub async fn generate(
        &self,
        topic: &str,
        content_type: ContentType,
        style: Option<ContentStyle>,
    ) -> Result<GeneratedContent> {
        let style = style.unwrap_or_else(|| self.config.style.clone());

        if let Some(ref llm) = self.llm {
            self.generate_with_llm(llm.as_ref(), topic, &content_type, &style).await
        } else {
            self.generate_fallback(topic, &content_type, &style)
        }
    }

    /// 使用 LLM 生成内容
    async fn generate_with_llm(
        &self,
        llm: &dyn LLMProvider,
        topic: &str,
        content_type: &ContentType,
        style: &ContentStyle,
    ) -> Result<GeneratedContent> {
        let prompt = self.build_prompt(topic, content_type, style);

        let context = ConversationContext::new()
            .with_system_prompt(self.get_system_prompt(style));

        let messages = context.to_messages();
        let mut all_messages = messages;
        all_messages.push(Message::user(&prompt));

        let response = llm.chat(all_messages).await?;

        let title = self.extract_title(&response.content).unwrap_or_else(|| topic.to_string());

        Ok(GeneratedContent::new(title, response.content, content_type.clone())
            .with_tags(self.suggest_tags(topic)))
    }

    /// 回退生成 (无 LLM 时)
    fn generate_fallback(
        &self,
        topic: &str,
        content_type: &ContentType,
        style: &ContentStyle,
    ) -> Result<GeneratedContent> {
        let template = self.get_template(content_type, style);
        let content = template
            .replace("{topic}", topic)
            .replace("{audience}", &self.config.target_audience);

        let title = match content_type {
            ContentType::Article => format!("深入了解 {}", topic),
            ContentType::Tutorial => format!("{} 入门教程", topic),
            ContentType::Announcement => format!("{} 重要公告", topic),
            ContentType::Changelog => format!("{} 更新日志", topic),
            ContentType::SocialPost => format!("关于 {}", topic),
            ContentType::Comment => format!("Re: {}", topic),
        };

        Ok(GeneratedContent::new(title, content, content_type.clone())
            .with_tags(self.suggest_tags(topic)))
    }

    /// 构建提示词
    fn build_prompt(&self, topic: &str, content_type: &ContentType, style: &ContentStyle) -> String {
        let style_guide = match style {
            ContentStyle::Technical => "技术专业，深入浅出，包含代码示例",
            ContentStyle::Casual => "轻松幽默，贴近生活，易于理解",
            ContentStyle::Formal => "正式官方，严谨准确，适合企业级",
            ContentStyle::Storytelling => "故事化叙述，引人入胜，有情感共鸣",
        };

        let content_guide = match content_type {
            ContentType::Article => "写一篇技术文章，包含引言、正文、总结",
            ContentType::Tutorial => "写一篇教程，包含步骤说明和注意事项",
            ContentType::Announcement => "写一篇公告，简洁明了，重点突出",
            ContentType::Changelog => "写更新日志，列出主要变更",
            ContentType::SocialPost => "写一条社交媒体帖子，简短有力",
            ContentType::Comment => "写一条评论回复",
        };

        format!(
            "请关于「{}」{}\n\n\
             风格要求：{}\n\
             目标受众：{}\n\n\
             请直接输出内容，不要包含其他说明。",
            topic, content_guide, style_guide, self.config.target_audience
        )
    }

    /// 获取系统提示词
    fn get_system_prompt(&self, style: &ContentStyle) -> String {
        let style_desc = match style {
            ContentStyle::Technical => "技术专家",
            ContentStyle::Casual => "友好的开发者",
            ContentStyle::Formal => "官方发言人",
            ContentStyle::Storytelling => "技术故事讲述者",
        };

        format!(
            "你是 OpenMatrix 的{}，专注于推广 OpenMatrix 项目。\n\n\
             OpenMatrix 是一个开源的 AI 任务编排系统，帮助开发者更高效地完成开发任务。\n\n\
             你的职责是创作高质量的推广内容，吸引更多开发者使用和参与 OpenMatrix。",
            style_desc
        )
    }

    /// 获取模板
    fn get_template(&self, content_type: &ContentType, _style: &ContentStyle) -> String {
        match content_type {
            ContentType::Article => {
                r#"# {topic}

## 简介

{topic} 是 OpenMatrix 生态中的重要组成部分。本文将深入介绍其核心概念和使用方法。

## 核心特性

- **特性一**：强大的任务编排能力
- **特性二**：AI 驱动的智能决策
- **特性三**：跨平台支持

## 快速开始

```bash
# 安装 OpenMatrix
npm install -g openmatrix

# 初始化项目
openmatrix init
```

## 总结

{topic} 为 {audience} 提供了强大的工具支持。欢迎加入我们的社区！
"#.to_string()
            }
            ContentType::Tutorial => {
                r#"# {topic} 入门教程

本教程将帮助你快速上手 {topic}。

## 准备工作

- Node.js 18+
- npm 或 yarn

## 步骤 1: 安装

```bash
npm install -g openmatrix
```

## 步骤 2: 初始化

```bash
openmatrix init my-project
cd my-project
```

## 步骤 3: 运行

```bash
openmatrix start
```

## 常见问题

Q: 遇到问题怎么办？
A: 查看 GitHub Issues 或加入社区讨论。

## 下一步

- 阅读完整文档
- 查看示例项目
- 加入开发者社区
"#.to_string()
            }
            ContentType::Announcement => {
                r#"📢 {topic}

亲爱的 {audience}，

我们很高兴地宣布：{topic}！

## 主要更新

- 更新内容 1
- 更新内容 2
- 更新内容 3

## 如何获取

```bash
npm update openmatrix
```

感谢大家的支持！

---
OpenMatrix 团队
"#.to_string()
            }
            ContentType::Changelog => {
                r#"## {topic} 更新日志

### 新功能 ✨
- 新增功能 1
- 新增功能 2

### 改进 🚀
- 改进 1
- 改进 2

### 修复 🐛
- 修复问题 1
- 修复问题 2

### 文档 📚
- 更新文档 1

---

完整变更请查看 GitHub Releases。
"#.to_string()
            }
            ContentType::SocialPost => {
                r#"🚀 {topic}

OpenMatrix 让任务编排变得简单！

✨ AI 驱动
🔧 跨平台支持
📚 开源免费

GitHub: https://github.com/bigfish1913/openmatrix

#OpenMatrix #AI #开发工具
"#.to_string()
            }
            ContentType::Comment => {
                r#"感谢你的反馈！

关于 {topic}，我们已经注意到这个问题并计划在下一个版本中修复。

如果急需解决，可以尝试临时方案：
1. 检查配置文件
2. 更新到最新版本

如有其他问题，欢迎继续讨论！
"#.to_string()
            }
        }
    }

    /// 提取标题
    fn extract_title(&self, content: &str) -> Option<String> {
        content.lines()
            .find(|line| line.starts_with("# "))
            .map(|line| line.trim_start_matches("# ").to_string())
    }

    /// 建议标签
    fn suggest_tags(&self, topic: &str) -> Vec<String> {
        let mut tags = vec![
            "OpenMatrix".to_string(),
            "AI".to_string(),
            "开发工具".to_string(),
        ];

        // 根据主题添加相关标签
        let lower = topic.to_lowercase();
        if lower.contains("教程") || lower.contains("入门") {
            tags.push("教程".to_string());
        }
        if lower.contains("api") {
            tags.push("API".to_string());
        }
        if lower.contains("cli") {
            tags.push("CLI".to_string());
        }

        tags
    }

    /// 生成推广文案
    pub async fn generate_promo_copy(&self, feature: &str) -> Result<String> {
        self.generate(feature, ContentType::SocialPost, Some(ContentStyle::Casual))
            .await
            .map(|c| c.content)
    }

    /// 生成教程
    pub async fn generate_tutorial(&self, topic: &str) -> Result<GeneratedContent> {
        self.generate(topic, ContentType::Tutorial, Some(ContentStyle::Technical))
            .await
    }

    /// 生成公告
    pub async fn generate_announcement(&self, title: &str, content_points: &[&str]) -> Result<GeneratedContent> {
        let topic = format!("{}: {}", title, content_points.join(", "));
        self.generate(&topic, ContentType::Announcement, Some(ContentStyle::Formal))
            .await
    }
}

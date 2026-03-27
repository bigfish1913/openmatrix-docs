//! Claude API 适配器

use anyhow::{Result, Context};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::types::{ChatResponse, LLMConfig, Message, Role, Usage};
use super::{LLMProvider, provider::default_config};

/// Claude API 适配器
pub struct ClaudeProvider {
    client: Client,
    config: LLMConfig,
}

impl ClaudeProvider {
    pub fn new(config: Option<LLMConfig>) -> Self {
        let config = config.unwrap_or_else(|| default_config("claude"));
        Self {
            client: Client::new(),
            config,
        }
    }

    fn convert_messages(&self, messages: Vec<Message>) -> Vec<ClaudeMessage> {
        messages
            .into_iter()
            .filter_map(|m| {
                let role = match m.role {
                    Role::System => "user".to_string(), // Claude 使用 user/assistant
                    Role::User => "user".to_string(),
                    Role::Assistant => "assistant".to_string(),
                };
                Some(ClaudeMessage {
                    role,
                    content: m.content,
                })
            })
            .collect()
    }
}

#[async_trait]
impl LLMProvider for ClaudeProvider {
    fn name(&self) -> &str {
        "claude"
    }

    async fn chat(&self, messages: Vec<Message>) -> Result<ChatResponse> {
        let api_key = self.config.api_key.as_ref()
            .context("Claude API key not configured. Set ANTHROPIC_API_KEY environment variable.")?;

        let request = ClaudeRequest {
            model: self.config.model.clone(),
            max_tokens: self.config.max_tokens.unwrap_or(4096),
            messages: self.convert_messages(messages),
        };

        let response = self.client
            .post(format!("{}/v1/messages", self.config.base_url.as_deref().unwrap_or("https://api.anthropic.com")))
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&request)
            .send()
            .await?
            .json::<ClaudeResponse>()
            .await?;

        Ok(ChatResponse {
            content: response.content.first()
                .map(|c| c.text.clone())
                .unwrap_or_default(),
            model: response.model,
            usage: response.usage.map(|u| Usage {
                prompt_tokens: u.input_tokens,
                completion_tokens: u.output_tokens,
                total_tokens: u.input_tokens + u.output_tokens,
            }),
            finish_reason: response.stop_reason,
        })
    }

    async fn is_available(&self) -> bool {
        self.config.api_key.is_some()
    }

    fn model_info(&self) -> String {
        format!("Claude ({})", self.config.model)
    }
}

// Claude API 请求/响应类型

#[derive(Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<ClaudeMessage>,
}

#[derive(Serialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ClaudeResponse {
    content: Vec<ClaudeContent>,
    model: String,
    stop_reason: Option<String>,
    usage: Option<ClaudeUsage>,
}

#[derive(Deserialize)]
struct ClaudeContent {
    text: String,
}

#[derive(Deserialize)]
struct ClaudeUsage {
    input_tokens: u32,
    output_tokens: u32,
}

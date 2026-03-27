//! OpenAI API 适配器

use anyhow::{Result, Context};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::types::{ChatResponse, LLMConfig, Message, Role, Usage};
use super::{LLMProvider, provider::default_config};

/// OpenAI API 适配器
pub struct OpenAIProvider {
    client: Client,
    config: LLMConfig,
}

impl OpenAIProvider {
    pub fn new(config: Option<LLMConfig>) -> Self {
        let config = config.unwrap_or_else(|| default_config("openai"));
        Self {
            client: Client::new(),
            config,
        }
    }

    fn convert_messages(&self, messages: Vec<Message>) -> Vec<OpenAIMessage> {
        messages
            .into_iter()
            .map(|m| {
                let role = match m.role {
                    Role::System => "system",
                    Role::User => "user",
                    Role::Assistant => "assistant",
                };
                OpenAIMessage {
                    role: role.to_string(),
                    content: m.content,
                }
            })
            .collect()
    }
}

#[async_trait]
impl LLMProvider for OpenAIProvider {
    fn name(&self) -> &str {
        "openai"
    }

    async fn chat(&self, messages: Vec<Message>) -> Result<ChatResponse> {
        let api_key = self.config.api_key.as_ref()
            .context("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.")?;

        let request = OpenAIRequest {
            model: self.config.model.clone(),
            messages: self.convert_messages(messages),
            max_tokens: self.config.max_tokens,
            temperature: self.config.temperature,
        };

        let response = self.client
            .post(format!("{}/chat/completions", self.config.base_url.as_deref().unwrap_or("https://api.openai.com/v1")))
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?
            .json::<OpenAIResponse>()
            .await?;

        let choice = response.choices.first()
            .context("No response from OpenAI")?;

        Ok(ChatResponse {
            content: choice.message.content.clone(),
            model: response.model,
            usage: response.usage.map(|u| Usage {
                prompt_tokens: u.prompt_tokens,
                completion_tokens: u.completion_tokens,
                total_tokens: u.total_tokens,
            }),
            finish_reason: Some(choice.finish_reason.clone()),
        })
    }

    async fn is_available(&self) -> bool {
        self.config.api_key.is_some()
    }

    fn model_info(&self) -> String {
        format!("OpenAI ({})", self.config.model)
    }
}

// OpenAI API 请求/响应类型

#[derive(Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
}

#[derive(Serialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct OpenAIResponse {
    model: String,
    choices: Vec<OpenAIChoice>,
    usage: Option<OpenAIUsage>,
}

#[derive(Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessageResponse,
    finish_reason: String,
}

#[derive(Deserialize)]
struct OpenAIMessageResponse {
    content: String,
}

#[derive(Deserialize)]
struct OpenAIUsage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

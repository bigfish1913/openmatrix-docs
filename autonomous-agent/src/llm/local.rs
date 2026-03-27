//! 本地模型适配器 (Ollama)

use anyhow::{Result, Context};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::types::{ChatResponse, LLMConfig, Message, Role, Usage};
use super::{LLMProvider, provider::default_config};

/// Ollama 本地模型适配器
pub struct LocalProvider {
    client: Client,
    config: LLMConfig,
}

impl LocalProvider {
    pub fn new(config: Option<LLMConfig>) -> Self {
        let config = config.unwrap_or_else(|| default_config("local"));
        Self {
            client: Client::new(),
            config,
        }
    }

    fn convert_messages(&self, messages: Vec<Message>) -> Vec<OllamaMessage> {
        messages
            .into_iter()
            .map(|m| {
                let role = match m.role {
                    Role::System => "system",
                    Role::User => "user",
                    Role::Assistant => "assistant",
                };
                OllamaMessage {
                    role: role.to_string(),
                    content: m.content,
                }
            })
            .collect()
    }
}

#[async_trait]
impl LLMProvider for LocalProvider {
    fn name(&self) -> &str {
        "local"
    }

    async fn chat(&self, messages: Vec<Message>) -> Result<ChatResponse> {
        let base_url = self.config.base_url.as_deref()
            .unwrap_or("http://localhost:11434");

        let request = OllamaRequest {
            model: self.config.model.clone(),
            messages: self.convert_messages(messages),
            stream: false,
        };

        let response = self.client
            .post(format!("{}/api/chat", base_url))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?
            .json::<OllamaResponse>()
            .await?;

        Ok(ChatResponse {
            content: response.message.content,
            model: response.model,
            usage: response.eval_count.map(|c| Usage {
                prompt_tokens: response.prompt_eval_count.unwrap_or(0),
                completion_tokens: c,
                total_tokens: response.prompt_eval_count.unwrap_or(0) + c,
            }),
            finish_reason: response.done.then_some("stop".to_string()),
        })
    }

    async fn is_available(&self) -> bool {
        // 检查 Ollama 服务是否运行
        let base_url = self.config.base_url.as_deref()
            .unwrap_or("http://localhost:11434");

        self.client
            .get(format!("{}/api/tags", base_url))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false)
    }

    fn model_info(&self) -> String {
        format!("Ollama ({})", self.config.model)
    }
}

// Ollama API 请求/响应类型

#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    messages: Vec<OllamaMessage>,
    stream: bool,
}

#[derive(Serialize)]
struct OllamaMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct OllamaResponse {
    model: String,
    message: OllamaMessageResponse,
    done: bool,
    #[serde(default)]
    prompt_eval_count: Option<u32>,
    #[serde(default)]
    eval_count: Option<u32>,
}

#[derive(Deserialize)]
struct OllamaMessageResponse {
    content: String,
}

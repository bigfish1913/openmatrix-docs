//! Anthropic 协议代理模块
//!
//! 支持将请求转发到其他兼容 Anthropic 协议的服务
//! 例如: 智谱 AI (https://open.bigmodel.cn/api/anthropic)

pub mod types;

pub use types::*;

use anyhow::Result;
use async_trait::async_trait;
use reqwest::Client;
use std::sync::Arc;

/// Anthropic 协议兼容的 Provider
#[async_trait]
pub trait AnthropicProvider: Send + Sync {
    /// Provider 名称
    fn name(&self) -> &str;

    /// API 端点
    fn endpoint(&self) -> &str;

    /// 是否可用
    fn is_available(&self) -> bool;

    /// 转发请求
    async fn forward(&self, request: AnthropicRequest) -> Result<AnthropicResponse>;
}

/// Provider 配置
#[derive(Debug, Clone)]
pub struct ProviderConfig {
    pub name: String,
    pub endpoint: String,
    pub api_key: String,
    pub model_mapping: std::collections::HashMap<String, String>,
    pub enabled: bool,
}

impl ProviderConfig {
    pub fn new(name: impl Into<String>, endpoint: impl Into<String>, api_key: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            endpoint: endpoint.into(),
            api_key: api_key.into(),
            model_mapping: std::collections::HashMap::new(),
            enabled: true,
        }
    }

    /// 智谱 AI (支持 Anthropic 协议)
    /// https://open.bigmodel.cn/api/anthropic
    pub fn zhipu(api_key: impl Into<String>) -> Self {
        let mut config = Self::new(
            "zhipu",
            "https://open.bigmodel.cn/api/anthropic",
            api_key,
        );
        config.model_mapping.insert("claude-3-opus".to_string(), "glm-4".to_string());
        config.model_mapping.insert("claude-3-sonnet".to_string(), "glm-4-flash".to_string());
        config.model_mapping.insert("claude-3-haiku".to_string(), "glm-4-flash".to_string());
        config
    }

    /// Moonshot AI
    pub fn moonshot(api_key: impl Into<String>) -> Self {
        Self::new(
            "moonshot",
            "https://api.moonshot.cn/anthropic",
            api_key,
        )
    }

    /// DeepSeek
    pub fn deepseek(api_key: impl Into<String>) -> Self {
        Self::new(
            "deepseek",
            "https://api.deepseek.com/anthropic",
            api_key,
        )
    }

    /// OpenAI
    pub fn openai(api_key: impl Into<String>) -> Self {
        Self::new(
            "openai",
            "https://api.openai.com/v1",
            api_key,
        )
    }

    /// 本地 Ollama
    pub fn ollama(host: impl Into<String>) -> Self {
        Self::new(
            "ollama",
            &format!("{}/v1", host.into()),
            "ollama",
        )
    }

    /// 映射模型名称
    pub fn map_model(&self, model: &str) -> String {
        self.model_mapping
            .get(model)
            .cloned()
            .unwrap_or_else(|| model.to_string())
    }
}

/// 通用 Anthropic 协议兼容 Provider
pub struct CompatibleProvider {
    config: ProviderConfig,
    client: Client,
}

impl CompatibleProvider {
    pub fn new(config: ProviderConfig) -> Self {
        Self {
            config,
            client: Client::new(),
        }
    }

    /// 从环境变量自动检测可用的 Provider
    pub fn auto_detect() -> Vec<Arc<dyn AnthropicProvider>> {
        let mut providers: Vec<Arc<dyn AnthropicProvider>> = Vec::new();

        if let Ok(key) = std::env::var("ZHIPU_API_KEY") {
            providers.push(Arc::new(Self::new(ProviderConfig::zhipu(key))));
        }
        if let Ok(key) = std::env::var("MOONSHOT_API_KEY") {
            providers.push(Arc::new(Self::new(ProviderConfig::moonshot(key))));
        }
        if let Ok(key) = std::env::var("DEEPSEEK_API_KEY") {
            providers.push(Arc::new(Self::new(ProviderConfig::deepseek(key))));
        }
        if let Ok(key) = std::env::var("OPENAI_API_KEY") {
            providers.push(Arc::new(Self::new(ProviderConfig::openai(key))));
        }

        providers
    }

    /// 获取优先级最高的 Provider
    pub fn get_priority_provider(providers: &[Arc<dyn AnthropicProvider>]) -> Option<&Arc<dyn AnthropicProvider>> {
        let priority = ["zhipu", "deepseek", "moonshot", "openai"];
        for name in priority {
            if let Some(p) = providers.iter().find(|p| p.name() == name && p.is_available()) {
                return Some(p);
            }
        }
        providers.iter().find(|p| p.is_available())
    }
}

#[async_trait]
impl AnthropicProvider for CompatibleProvider {
    fn name(&self) -> &str {
        &self.config.name
    }

    fn endpoint(&self) -> &str {
        &self.config.endpoint
    }

    fn is_available(&self) -> bool {
        self.config.enabled && !self.config.api_key.is_empty()
    }

    async fn forward(&self, mut request: AnthropicRequest) -> Result<AnthropicResponse> {
        request.model = self.config.map_model(&request.model);

        let url = format!("{}/v1/messages", self.config.endpoint);

        let response = self.client
            .post(&url)
            .header("x-api-key", &self.config.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Provider error: {}", error);
        }

        Ok(response.json().await?)
    }
}

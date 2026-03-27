//! LLM 模块 - 多模型支持
//!
//! 支持的模型:
//! - Claude (Anthropic)
//! - OpenAI (GPT-4, GPT-3.5)
//! - 本地模型 (Ollama)

pub mod types;
pub mod provider;
pub mod claude;
pub mod openai;
pub mod local;

use anyhow::Result;
use async_trait::async_trait;
use types::{Message, ChatResponse, LLMConfig};

/// LLM Provider trait - 所有模型都需要实现这个接口
#[async_trait]
pub trait LLMProvider: Send + Sync {
    /// Provider 名称
    fn name(&self) -> &str;

    /// 发送聊天请求
    async fn chat(&self, messages: Vec<Message>) -> Result<ChatResponse>;

    /// 流式聊天 (可选)
    async fn chat_stream(&self, messages: Vec<Message>) -> Result<()> {
        // 默认实现: 不支持流式
        let response = self.chat(messages).await?;
        println!("{}", response.content);
        Ok(())
    }

    /// 检查 Provider 是否可用
    async fn is_available(&self) -> bool;

    /// 获取模型信息
    fn model_info(&self) -> String;
}

/// LLM 工厂 - 创建和管理多个 Provider
pub struct LLMFactory {
    providers: Vec<Box<dyn LLMProvider>>,
    default_provider: Option<String>,
}

impl LLMFactory {
    pub fn new() -> Self {
        Self {
            providers: Vec::new(),
            default_provider: None,
        }
    }

    /// 注册 Provider
    pub fn register(&mut self, provider: Box<dyn LLMProvider>) {
        if self.default_provider.is_none() {
            self.default_provider = Some(provider.name().to_string());
        }
        self.providers.push(provider);
    }

    /// 获取 Provider
    pub fn get_provider(&self, name: Option<&str>) -> Option<&Box<dyn LLMProvider>> {
        let target = name.unwrap_or_else(|| self.default_provider.as_deref().unwrap_or(""));
        self.providers.iter().find(|p| p.name() == target)
    }

    /// 列出所有可用的 Provider
    pub async fn list_available(&self) -> Vec<String> {
        let mut available = Vec::new();
        for provider in &self.providers {
            if provider.is_available().await {
                available.push(provider.name().to_string());
            }
        }
        available
    }

    /// 自动选择最佳 Provider
    pub async fn select_best(&self) -> Option<&Box<dyn LLMProvider>> {
        // 优先级: Claude > OpenAI > Local
        let priority = ["claude", "openai", "local"];
        for name in priority {
            if let Some(p) = self.get_provider(Some(name)) {
                if p.is_available().await {
                    return Some(p);
                }
            }
        }
        None
    }
}

impl Default for LLMFactory {
    fn default() -> Self {
        Self::new()
    }
}

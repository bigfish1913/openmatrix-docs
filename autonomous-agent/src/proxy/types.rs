//! Anthropic API 类型定义
//!
//! 完全兼容 Anthropic Messages API 格式

use serde::{Deserialize, Serialize};

/// Anthropic Messages API 请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnthropicRequest {
    /// 模型名称
    pub model: String,
    /// 消息列表
    pub messages: Vec<Message>,
    /// 系统提示
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system: Option<String>,
    /// 最大 token 数
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
    /// 温度
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
}

impl AnthropicRequest {
    pub fn simple(model: impl Into<String>, prompt: impl Into<String>) -> Self {
        Self {
            model: model.into(),
            messages: vec![Message {
                role: "user".to_string(),
                content: Content::Text(prompt.into()),
            }],
            system: None,
            max_tokens: Some(4096),
            temperature: Some(0.7),
        }
    }
}

/// 消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub content: Content,
}

/// 内容
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Content {
    Text(String),
    Blocks(Vec<ContentBlock>),
}

/// 内容块
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentBlock {
    #[serde(rename = "type")]
    pub block_type: String,
    pub text: Option<String>,
}

/// Anthropic 响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnthropicResponse {
    pub id: String,
    #[serde(rename = "type")]
    pub response_type: String,
    pub role: String,
    pub content: Vec<ResponseContent>,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop_reason: Option<String>,
    pub usage: Usage,
}

/// 响应内容
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResponseContent {
    #[serde(rename = "type")]
    pub content_type: String,
    pub text: String,
}

/// Token 使用量
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Usage {
    pub input_tokens: u32,
    pub output_tokens: u32,
}

impl AnthropicResponse {
    /// 获取文本内容
    pub fn text(&self) -> Option<&str> {
        self.content.first().map(|c| c.text.as_str())
    }
}

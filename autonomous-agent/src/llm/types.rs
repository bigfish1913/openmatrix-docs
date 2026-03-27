//! LLM 类型定义

use serde::{Deserialize, Serialize};

/// 聊天消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: Role,
    pub content: String,
}

impl Message {
    pub fn system(content: impl Into<String>) -> Self {
        Self {
            role: Role::System,
            content: content.into(),
        }
    }

    pub fn user(content: impl Into<String>) -> Self {
        Self {
            role: Role::User,
            content: content.into(),
        }
    }

    pub fn assistant(content: impl Into<String>) -> Self {
        Self {
            role: Role::Assistant,
            content: content.into(),
        }
    }
}

/// 消息角色
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    System,
    User,
    Assistant,
}

/// 聊天响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub content: String,
    pub model: String,
    pub usage: Option<Usage>,
    pub finish_reason: Option<String>,
}

/// Token 使用量
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Usage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

/// LLM 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMConfig {
    /// API Key
    pub api_key: Option<String>,
    /// 模型名称
    pub model: String,
    /// 最大 Token 数
    pub max_tokens: Option<u32>,
    /// 温度 (0.0 - 2.0)
    pub temperature: Option<f32>,
    /// API 基础 URL
    pub base_url: Option<String>,
}

impl Default for LLMConfig {
    fn default() -> Self {
        Self {
            api_key: None,
            model: "default".to_string(),
            max_tokens: Some(4096),
            temperature: Some(0.7),
            base_url: None,
        }
    }
}

/// 工具定义 (Function Calling)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tool {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

/// 工具调用请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: serde_json::Value,
}

/// 工具调用结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    pub tool_call_id: String,
    pub content: String,
}

/// 对话上下文
#[derive(Debug, Clone, Default)]
pub struct ConversationContext {
    pub messages: Vec<Message>,
    pub system_prompt: Option<String>,
    pub tools: Vec<Tool>,
}

impl ConversationContext {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_system_prompt(mut self, prompt: impl Into<String>) -> Self {
        self.system_prompt = Some(prompt.into());
        self
    }

    pub fn add_message(&mut self, message: Message) {
        self.messages.push(message);
    }

    pub fn add_user(&mut self, content: impl Into<String>) {
        self.messages.push(Message::user(content));
    }

    pub fn add_assistant(&mut self, content: impl Into<String>) {
        self.messages.push(Message::assistant(content));
    }

    pub fn to_messages(&self) -> Vec<Message> {
        let mut messages = Vec::new();
        if let Some(ref prompt) = self.system_prompt {
            messages.push(Message::system(prompt));
        }
        messages.extend(self.messages.clone());
        messages
    }
}

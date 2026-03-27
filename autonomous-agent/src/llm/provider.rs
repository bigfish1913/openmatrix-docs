//! Provider 基础实现

use super::types::LLMConfig;
use std::env;

/// 从环境变量加载 API Key
pub fn load_api_key(provider: &str) -> Option<String> {
    let keys = match provider {
        "claude" => vec!["ANTHROPIC_API_KEY", "CLAUDE_API_KEY"],
        "openai" => vec!["OPENAI_API_KEY"],
        "local" => vec!["OLLAMA_HOST"],
        _ => vec![],
    };

    for key in keys {
        if let Ok(value) = env::var(key) {
            if !value.is_empty() {
                return Some(value);
            }
        }
    }
    None
}

/// 创建默认配置
pub fn default_config(provider: &str) -> LLMConfig {
    match provider {
        "claude" => LLMConfig {
            api_key: load_api_key("claude"),
            model: "claude-sonnet-4-6-20250514".to_string(),
            max_tokens: Some(4096),
            temperature: Some(0.7),
            base_url: Some("https://api.anthropic.com".to_string()),
        },
        "openai" => LLMConfig {
            api_key: load_api_key("openai"),
            model: "gpt-4o".to_string(),
            max_tokens: Some(4096),
            temperature: Some(0.7),
            base_url: Some("https://api.openai.com/v1".to_string()),
        },
        "local" => LLMConfig {
            api_key: None,
            model: "llama3".to_string(),
            max_tokens: Some(4096),
            temperature: Some(0.7),
            base_url: Some("http://localhost:11434".to_string()),
        },
        _ => LLMConfig::default(),
    }
}

//! 任务类型定义

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 任务状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

/// 任务步骤
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskStep {
    pub id: String,
    pub description: String,
    pub command: Option<String>,
    pub status: TaskStatus,
    pub order: u32,
    pub dependencies: Vec<String>,
    pub result: Option<String>,
    pub error: Option<String>,
}

impl TaskStep {
    pub fn new(id: impl Into<String>, description: impl Into<String>, order: u32) -> Self {
        Self {
            id: id.into(),
            description: description.into(),
            command: None,
            status: TaskStatus::Pending,
            order,
            dependencies: Vec::new(),
            result: None,
            error: None,
        }
    }

    pub fn with_command(mut self, command: impl Into<String>) -> Self {
        self.command = Some(command.into());
        self
    }

    pub fn depends_on(mut self, step_id: impl Into<String>) -> Self {
        self.dependencies.push(step_id.into());
        self
    }
}

/// 任务
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: TaskStatus,
    pub steps: Vec<TaskStep>,
    pub current_step: Option<String>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub tags: Vec<String>,
    pub priority: TaskPriority,
}

impl Task {
    pub fn new(title: impl Into<String>, description: impl Into<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title: title.into(),
            description: description.into(),
            status: TaskStatus::Pending,
            steps: Vec::new(),
            current_step: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            tags: Vec::new(),
            priority: TaskPriority::Medium,
        }
    }

    pub fn add_step(&mut self, step: TaskStep) {
        self.steps.push(step);
    }

    pub fn progress(&self) -> f32 {
        if self.steps.is_empty() {
            return 0.0;
        }
        let completed = self.steps.iter()
            .filter(|s| s.status == TaskStatus::Completed)
            .count();
        (completed as f32 / self.steps.len() as f32) * 100.0
    }

    pub fn next_step(&self) -> Option<&TaskStep> {
        self.steps.iter()
            .filter(|s| s.status == TaskStatus::Pending)
            .min_by_key(|s| s.order)
    }

    pub fn is_complete(&self) -> bool {
        self.steps.iter().all(|s| s.status == TaskStatus::Completed)
    }
}

/// 任务优先级
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Critical,
}

/// 任务执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResult {
    pub task_id: String,
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub duration_ms: u64,
}

/// 任务模板
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskTemplate {
    pub name: String,
    pub description: String,
    pub steps: Vec<TemplateStep>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateStep {
    pub description: String,
    pub command_template: String,
}

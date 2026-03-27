//! 任务执行器

use anyhow::Result;
use std::collections::HashMap;
use std::time::Instant;

use super::types::{Task, TaskStep, TaskStatus, TaskResult};

/// 任务执行器
pub struct TaskExecutor {
    /// 任务存储
    tasks: HashMap<String, Task>,
    /// 执行历史
    history: Vec<TaskResult>,
}

impl TaskExecutor {
    pub fn new() -> Self {
        Self {
            tasks: HashMap::new(),
            history: Vec::new(),
        }
    }

    /// 添加任务
    pub fn add_task(&mut self, task: Task) {
        self.tasks.insert(task.id.clone(), task);
    }

    /// 获取任务
    pub fn get_task(&self, id: &str) -> Option<&Task> {
        self.tasks.get(id)
    }

    /// 列出所有任务
    pub fn list_tasks(&self) -> Vec<&Task> {
        self.tasks.values().collect()
    }

    /// 执行任务
    pub async fn execute(&mut self, task_id: &str) -> Result<TaskResult> {
        let task = self.tasks.get(task_id)
            .ok_or_else(|| anyhow::anyhow!("Task not found: {}", task_id))?;

        let start_time = Instant::now();
        let mut success = true;
        let mut output = String::new();
        let mut error = None;

        // 获取步骤顺序
        let mut steps: Vec<TaskStep> = task.steps.clone();
        steps.sort_by_key(|s| s.order);

        output.push_str(&format!("开始执行任务: {}\n\n", task.title));

        for step in &mut steps {
            output.push_str(&format!("▶ 步骤 {}: {}\n", step.order, step.description));

            // 检查依赖
            let deps_ok = self.check_dependencies(&step.dependencies);
            if !deps_ok {
                output.push_str("  ⚠️ 跳过 (依赖未满足)\n");
                continue;
            }

            // 执行步骤
            match self.execute_step(step).await {
                Ok(result) => {
                    output.push_str(&format!("  ✅ {}\n", result));
                    step.status = TaskStatus::Completed;
                    step.result = Some(result);
                }
                Err(e) => {
                    output.push_str(&format!("  ❌ 错误: {}\n", e));
                    step.status = TaskStatus::Failed;
                    step.error = Some(e.to_string());
                    success = false;
                    error = Some(e.to_string());
                    break;
                }
            }
        }

        let duration_ms = start_time.elapsed().as_millis() as u64;

        let result = TaskResult {
            task_id: task_id.to_string(),
            success,
            output: output.clone(),
            error,
            duration_ms,
        };

        self.history.push(result.clone());

        // 更新任务状态
        if let Some(task) = self.tasks.get_mut(task_id) {
            task.status = if success { TaskStatus::Completed } else { TaskStatus::Failed };
            for (i, step_result) in steps.into_iter().enumerate() {
                if i < task.steps.len() {
                    task.steps[i].status = step_result.status;
                    task.steps[i].result = step_result.result;
                    task.steps[i].error = step_result.error;
                }
            }
        }

        Ok(result)
    }

    /// 检查依赖
    fn check_dependencies(&self, dependencies: &[String]) -> bool {
        // 简化实现: 假设所有依赖都满足
        // 实际实现需要检查前置步骤是否完成
        true
    }

    /// 执行单个步骤
    async fn execute_step(&self, step: &TaskStep) -> Result<String> {
        if let Some(ref command) = step.command {
            // 有命令则执行
            self.execute_command(command).await
        } else {
            // 无命令则模拟执行
            Ok(format!("步骤 '{}' 已完成", step.description))
        }
    }

    /// 执行命令
    async fn execute_command(&self, command: &str) -> Result<String> {
        // 这里应该调用实际的命令执行器
        // 目前返回模拟结果
        Ok(format!("命令 '{}' 执行成功", command))
    }

    /// 获取执行历史
    pub fn get_history(&self) -> &[TaskResult] {
        &self.history
    }

    /// 清理已完成的任务
    pub fn cleanup_completed(&mut self) -> usize {
        let before = self.tasks.len();
        self.tasks.retain(|_, t| t.status != TaskStatus::Completed);
        before - self.tasks.len()
    }
}

impl Default for TaskExecutor {
    fn default() -> Self {
        Self::new()
    }
}

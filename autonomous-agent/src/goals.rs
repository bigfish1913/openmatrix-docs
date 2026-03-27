use anyhow::Result;
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::fs;
use tracing::info;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GoalStatus { Pending, InProgress, Completed, Abandoned }

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum GoalPriority { Low, Medium, High, Critical }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Goal {
    pub id: String,
    pub description: String,
    pub parent_id: Option<String>,
    pub sub_goals: Vec<String>,
    pub status: GoalStatus,
    pub priority: GoalPriority,
    pub progress: u8,
    pub created_at: DateTime<Utc>,
    pub deadline: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
}

impl Goal {
    pub fn new(description: String, priority: GoalPriority) -> Self {
        Self { id: Uuid::new_v4().to_string(), description, parent_id: None, sub_goals: Vec::new(),
            status: GoalStatus::Pending, priority, progress: 0, created_at: Utc::now(),
            deadline: None, completed_at: None }
    }

    pub fn update_progress(&mut self, p: u8) {
        self.progress = p.clamp(0, 100);
        self.status = if self.progress == 100 { GoalStatus::Completed } else if self.progress > 0 { GoalStatus::InProgress } else { GoalStatus::Pending };
        if self.status == GoalStatus::Completed { self.completed_at = Some(Utc::now()); }
    }

    pub fn is_overdue(&self) -> bool {
        self.deadline.map(|d| Utc::now() > d && self.status != GoalStatus::Completed).unwrap_or(false)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GoalStore { goals: HashMap<String, Goal> }

impl GoalStore {
    pub fn new() -> Self { Self { goals: HashMap::new() } }
    pub fn add(&mut self, goal: Goal) { let id = goal.id.clone(); self.goals.insert(id, goal); }
    pub fn get(&self, id: &str) -> Option<&Goal> { self.goals.get(id) }
    pub fn get_mut(&mut self, id: &str) -> Option<&mut Goal> { self.goals.get_mut(id) }
    pub fn all(&self) -> Vec<&Goal> { self.goals.values().collect() }
    pub fn active(&self) -> Vec<&Goal> { self.goals.values().filter(|g| g.status == GoalStatus::Pending || g.status == GoalStatus::InProgress).collect() }
}

pub struct GoalManager {
    store: GoalStore,
    current_focus: Option<String>,
    data_dir: std::path::PathBuf,
}

impl GoalManager {
    pub async fn new() -> Result<Self> {
        let data_dir = dirs::data_local_dir().unwrap_or_else(|| "./data".into()).join("autonomous-agent").join("goals");
        fs::create_dir_all(&data_dir).await?;
        let mut m = Self { store: GoalStore::new(), current_focus: None, data_dir };
        m.load().await?;
        Ok(m)
    }

    pub fn create_goal(&mut self, description: String, priority: GoalPriority, deadline: Option<DateTime<Utc>>) -> String {
        let mut goal = Goal::new(description, priority);
        goal.deadline = deadline;
        let id = goal.id.clone();
        self.store.add(goal);
        id
    }

    pub fn set_focus(&mut self, id: &str) -> bool {
        if self.store.get(id).is_some() { self.current_focus = Some(id.to_string()); true } else { false }
    }

    pub fn current_focus(&self) -> Option<&Goal> { self.current_focus.as_ref().and_then(|id| self.store.get(id)) }

    pub fn update_progress(&mut self, id: &str, progress: u8) -> bool {
        if let Some(g) = self.store.get_mut(id) { g.update_progress(progress); true } else { false }
    }

    pub fn active_goals(&self) -> Vec<&Goal> { self.store.active() }
    pub fn overdue_goals(&self) -> Vec<&Goal> { self.store.all().into_iter().filter(|g| g.is_overdue()).collect() }
    pub fn goals_by_priority(&self) -> Vec<&Goal> { let mut v = self.store.all(); v.sort_by(|a, b| b.priority.cmp(&a.priority)); v }

    pub async fn save(&self) -> Result<()> {
        fs::write(self.data_dir.join("goals.json"), serde_json::to_string_pretty(&self.store)?).await?;
        Ok(())
    }

    pub async fn load(&mut self) -> Result<()> {
        let p = self.data_dir.join("goals.json");
        if p.exists() { self.store = serde_json::from_str(&fs::read_to_string(p).await?)?; }
        Ok(())
    }

    pub async fn cleanup_completed(&mut self, days: i64) -> Result<usize> {
        let cutoff = Utc::now() - Duration::days(days);
        let before = self.store.all().len();
        self.store.goals.retain(|_, g| { if g.status == GoalStatus::Completed { g.completed_at.map(|c| c > cutoff).unwrap_or(true) } else { true } });
        let removed = before - self.store.goals.len();
        if removed > 0 { self.save().await?; }
        Ok(removed)
    }
}

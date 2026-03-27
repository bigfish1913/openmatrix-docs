use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use tokio::fs;
use tokio::io::AsyncWriteExt;
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MemoryType {
    ShortTerm,
    LongTerm,
    Session,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Memory {
    pub id: String,
    pub content: String,
    pub memory_type: MemoryType,
    pub importance: u8,
    pub created_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub access_count: u32,
    pub tags: Vec<String>,
    pub session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MemoryStore {
    memories: HashMap<String, Memory>,
    index_by_tag: HashMap<String, Vec<String>>,
}

impl MemoryStore {
    pub fn new() -> Self { Self { memories: HashMap::new(), index_by_tag: HashMap::new() } }

    pub fn add(&mut self, content: String, memory_type: MemoryType, tags: Vec<String>, session_id: Option<String>) -> String {
        let id = hex::encode(Sha256::digest(&content))[..16].to_string();
        let now = Utc::now();
        let memory = Memory { id: id.clone(), content, memory_type, importance: 5, created_at: now, last_accessed: now, access_count: 0, tags, session_id };
        for tag in &memory.tags {
            self.index_by_tag.entry(tag.clone()).or_insert_with(Vec::new).push(id.clone());
        }
        self.memories.insert(id.clone(), memory);
        info!("Added memory: {}", id);
        id
    }

    pub fn get(&self, id: &str) -> Option<&Memory> { self.memories.get(id) }
    pub fn all(&self) -> Vec<&Memory> { self.memories.values().collect() }

    pub fn by_session(&self, session_id: &str) -> Vec<&Memory> {
        self.memories.values().filter(|m| m.session_id.as_ref().map(|s| s == session_id).unwrap_or(false)).collect()
    }

    pub fn remove(&mut self, id: &str) -> Option<Memory> {
        let m = self.memories.remove(id)?;
        for tag in &m.tags {
            if let Some(ids) = self.index_by_tag.get_mut(tag) {
                ids.retain(|i| i != id);
            }
        }
        Some(m)
    }

    pub fn cleanup(&mut self, min: u8) -> usize {
        let before = self.memories.len();
        self.memories.retain(|_, m| m.importance >= min);
        before - self.memories.len()
    }
}

pub struct MemoryManager {
    short_term: MemoryStore,
    long_term: MemoryStore,
    session_memories: HashMap<String, MemoryStore>,
    current_session: String,
    data_dir: std::path::PathBuf,
}

impl MemoryManager {
    pub async fn new() -> Result<Self> {
        let data_dir = std::env::current_dir().unwrap_or_else(|_| "./".into()).join(".memory");
        fs::create_dir_all(&data_dir).await?;

        // Load or create current session ID
        let session_file = data_dir.join("current_session.txt");
        let session_id = if session_file.exists() {
            fs::read_to_string(&session_file).await?.trim().to_string()
        } else {
            Utc::now().format("%Y%m%d_%H%M%S").to_string()
        };

        let mut m = Self {
            short_term: MemoryStore::new(),
            long_term: MemoryStore::new(),
            session_memories: HashMap::new(),
            current_session: session_id,
            data_dir
        };
        m.load().await?;
        m.load_session(&m.current_session.clone()).await?;
        Ok(m)
    }

    pub fn current_session(&self) -> &str {
        &self.current_session
    }

    pub async fn set_session(&mut self, session_id: String) -> Result<()> {
        self.current_session = session_id;
        // Persist the current session ID
        let session_file = self.data_dir.join("current_session.txt");
        fs::write(&session_file, &self.current_session).await?;
        // Load memories for this session
        self.load_session(&self.current_session.clone()).await?;
        Ok(())
    }

    pub fn add_short_term(&mut self, content: String, tags: Vec<String>) -> String {
        self.short_term.add(content, MemoryType::ShortTerm, tags, Some(self.current_session.clone()))
    }

    pub fn add_long_term(&mut self, content: String, tags: Vec<String>) -> String {
        self.long_term.add(content, MemoryType::LongTerm, tags, Some(self.current_session.clone()))
    }

    pub fn add_session_memory(&mut self, content: String, tags: Vec<String>) -> String {
        let store = self.session_memories.entry(self.current_session.clone()).or_insert_with(MemoryStore::new);
        store.add(content, MemoryType::Session, tags, Some(self.current_session.clone()))
    }

    pub fn retrieve(&self, query: &str) -> Vec<&Memory> {
        let q = query.to_lowercase();
        let mut results = Vec::new();
        for m in self.long_term.all() {
            if m.content.to_lowercase().contains(&q) || m.tags.iter().any(|t| t.to_lowercase() == q) {
                results.push(m);
            }
        }
        for m in self.short_term.all() {
            if m.content.to_lowercase().contains(&q) || m.tags.iter().any(|t| t.to_lowercase() == q) {
                results.push(m);
            }
        }
        for (_, store) in &self.session_memories {
            for m in store.all() {
                if m.content.to_lowercase().contains(&q) || m.tags.iter().any(|t| t.to_lowercase() == q) {
                    results.push(m);
                }
            }
        }
        results
    }

    pub fn get_session_memories(&self, session_id: &str) -> Vec<&Memory> {
        self.session_memories.get(session_id).map(|s| s.all()).unwrap_or_default()
    }

    pub async fn save(&self) -> Result<()> {
        fs::write(self.data_dir.join("short_term.md"), self.store_to_md(&self.short_term)).await?;
        fs::write(self.data_dir.join("long_term.md"), self.store_to_md(&self.long_term)).await?;
        // Save current session ID
        fs::write(self.data_dir.join("current_session.txt"), &self.current_session).await?;
        for (session_id, store) in &self.session_memories {
            let path = self.data_dir.join(format!("session_{}.md", session_id));
            fs::write(path, self.store_to_md(store)).await?;
        }
        Ok(())
    }

    fn store_to_md(&self, store: &MemoryStore) -> String {
        let mut md = String::from("# Memories\n\n");
        for m in store.all() {
            md.push_str(&format!("## {}\n\n", m.id));
            md.push_str(&format!("**Type**: {:?}\n\n", m.memory_type));
            md.push_str(&format!("**Created**: {}\n\n", m.created_at.format("%Y-%m-%d %H:%M:%S")));
            md.push_str(&format!("**Tags**: {}\n\n", m.tags.join(", ")));
            md.push_str(&format!("**Content**:\n\n{}\n\n---\n\n", m.content));
        }
        md
    }

    pub async fn load(&mut self) -> Result<()> {
        let st = self.data_dir.join("short_term.md");
        let lt = self.data_dir.join("long_term.md");
        if st.exists() { self.short_term = self.load_from_md(&st).await?; }
        if lt.exists() { self.long_term = self.load_from_md(&lt).await?; }

        let mut session_files = Vec::new();
        let mut entries = tokio::fs::read_dir(&self.data_dir).await?;
        while let Some(entry) = entries.next_entry().await? {
            let name = entry.file_name();
            let name_str = name.to_string_lossy();
            if name_str.starts_with("session_") && name_str.ends_with(".md") {
                session_files.push(entry.path());
            }
        }

        for path in session_files {
            if let Ok(store) = self.load_from_md(&path).await {
                if let Some(session_id) = path.file_stem().and_then(|s| s.to_str()).map(|s| s.trim_start_matches("session_").trim_end_matches(".md").to_string()) {
                    self.session_memories.insert(session_id, store);
                }
            }
        }
        Ok(())
    }

    async fn load_from_md(&self, path: &std::path::Path) -> Result<MemoryStore> {
        let content = fs::read_to_string(path).await?;
        let mut store = MemoryStore::new();
        let mut current_id = String::new();
        let mut current_content = String::new();
        let mut current_type = MemoryType::ShortTerm;
        let mut current_tags = Vec::new();
        let mut current_created = Utc::now();

        let mut save_current = |store: &mut MemoryStore, id: &mut String, content: &mut String, mtype: &mut MemoryType, tags: &mut Vec<String>, created: &mut DateTime<Utc>| {
            if !id.is_empty() && !content.is_empty() {
                store.memories.insert(id.clone(), Memory {
                    id: id.clone(), content: content.clone(), memory_type: mtype.clone(),
                    importance: 5, created_at: *created, last_accessed: Utc::now(),
                    access_count: 0, tags: tags.clone(), session_id: None,
                });
            }
        };

        for line in content.lines() {
            if line.starts_with("## ") && line.len() > 3 {
                save_current(&mut store, &mut current_id, &mut current_content, &mut current_type, &mut current_tags, &mut current_created);
                current_id = line[3..].trim().to_string();
                current_content.clear();
                current_tags.clear();
                current_type = MemoryType::ShortTerm;
                current_created = Utc::now();
            } else if line.starts_with("**Type**:") {
                current_type = match line {
                    l if l.contains("LongTerm") => MemoryType::LongTerm,
                    l if l.contains("Session") => MemoryType::Session,
                    _ => MemoryType::ShortTerm,
                };
            } else if line.starts_with("**Created**:") {
                if let Some(date_str) = line.split(": ").nth(1) {
                    if let Ok(dt) = chrono::NaiveDateTime::parse_from_str(date_str.trim(), "%Y-%m-%d %H:%M:%S") {
                        current_created = DateTime::<Utc>::from_naive_utc_and_offset(dt, Utc);
                    }
                }
            } else if line.starts_with("**Tags**:") {
                if let Some(tags_str) = line.split(": ").nth(1) {
                    current_tags = tags_str.trim().split(", ").map(|s| s.to_string()).collect();
                }
            } else if line.starts_with("**Content**:") || line == "---" || line.is_empty() {
                continue;
            } else if !current_id.is_empty() {
                current_content.push_str(line);
                current_content.push('\n');
            }
        }

        save_current(&mut store, &mut current_id, &mut current_content, &mut current_type, &mut current_tags, &mut current_created);
        Ok(store)
    }

    pub async fn cleanup_old_memories(&mut self) -> Result<usize> {
        let a = self.short_term.cleanup(3);
        let b = self.long_term.cleanup(2);
        self.save().await?;
        Ok(a + b)
    }

    pub async fn load_session(&mut self, session_id: &str) -> Result<()> {
        let path = self.data_dir.join(format!("session_{}.md", session_id));
        if path.exists() {
            if let Ok(store) = self.load_from_md(&path).await {
                self.session_memories.insert(session_id.to_string(), store);
            }
        }
        Ok(())
    }
}

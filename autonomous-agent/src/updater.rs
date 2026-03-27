use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use tracing::{info, warn, error};
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub download_url: String,
    pub file_hash: String,
    pub release_notes: String,
}

pub struct SelfUpdater {
    current_version: String,
    app_path: PathBuf,
    update_dir: PathBuf,
    repo: String,
}

impl SelfUpdater {
    pub fn new(current_version: &str) -> Result<Self> {
        let app_path = std::env::current_exe()?;
        let update_dir = dirs::data_local_dir().unwrap_or_else(|| "./data".into()).join("autonomous-agent").join("updates");
        std::fs::create_dir_all(&update_dir)?;
        Ok(Self { current_version: current_version.to_string(), app_path, update_dir, repo: "bigfish1913/autonomous-agent".into() })
    }

    pub async fn check_for_updates(&self) -> Result<Option<UpdateInfo>> {
        let client = reqwest::Client::new();
        let url = format!("https://api.github.com/repos/{}/releases/latest", self.repo);
        let resp = client.get(&url).header("User-Agent", "autonomous-agent").send().await?;
        if !resp.status().is_success() { return Ok(None); }
        let release: serde_json::Value = resp.json().await?;
        let latest = release["tag_name"].as_str().unwrap_or("v0.0.0").trim_start_matches('v');
        if !Self::is_newer(&self.current_version, latest) { return Ok(None); }
        let download_url = release["assets"].as_array()
            .and_then(|a| a.iter().find(|x| x["name"].as_str().map(|n| n.contains("windows") || n.ends_with(".tar.gz")).unwrap_or(false)))
            .and_then(|x| x["browser_download_url"].as_str()).map(|s| s.to_string()).unwrap_or_default();
        Ok(Some(UpdateInfo { version: latest.into(), download_url, file_hash: "".into(), release_notes: release["body"].as_str().unwrap_or("").into() }))
    }

    pub async fn download_update(&self, info: &UpdateInfo) -> Result<PathBuf> {
        let bytes = reqwest::Client::new().get(&info.download_url).send().await?.bytes().await?;
        let path = self.update_dir.join(format!("update-{}", Utc::now().timestamp()));
        std::fs::write(&path, &bytes)?;
        Ok(path)
    }

    pub async fn update(&self) -> Result<bool> {
        match self.check_for_updates().await? {
            Some(info) => {
                println!("\nNew version: {}", info.version);
                print!("Update now? [y/N] ");
                let mut input = String::new();
                std::io::stdin().read_line(&mut input)?;
                if input.trim().to_lowercase() == "y" {
                    self.download_update(&info).await?;
                    println!("Downloaded. Restart to apply.");
                    Ok(true)
                } else { Ok(false) }
            }
            None => { println!("Already latest: {}", self.current_version); Ok(false) }
        }
    }

    fn is_newer(current: &str, latest: &str) -> bool {
        let c: Vec<u32> = current.split('.').filter_map(|x| x.parse().ok()).collect();
        let l: Vec<u32> = latest.split('.').filter_map(|x| x.parse().ok()).collect();
        for (i, &lv) in l.iter().enumerate() {
            let cv = c.get(i).copied().unwrap_or(0);
            if lv > cv { return true; } else if lv < cv { return false; }
        }
        false
    }
}

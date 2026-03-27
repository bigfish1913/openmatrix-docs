use anyhow::{Result, Context};
use serde::{Deserialize, Serialize};
use std::process::Command;
use tokio::process::Command as AsyncCommand;
use tracing::{info, warn};

/// 执行器类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExecutorType {
    Cmd,
    PowerShell,
    Wsl,
    Shell,
}

/// 命令执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
    pub command: String,
    pub executor: String,
}

/// 命令执行器
pub struct CommandExecutor {
    auto_executor: ExecutorType,
    wsl_distro: Option<String>,
}

impl CommandExecutor {
    pub fn new() -> Result<Self> {
        let auto_executor = Self::detect_executor();
        info!("Detected executor: {:?}", auto_executor);
        Ok(Self { auto_executor, wsl_distro: None })
    }

    pub fn set_wsl_distro(&mut self, distro: String) {
        self.wsl_distro = Some(distro);
    }

    fn detect_executor() -> ExecutorType {
        #[cfg(target_os = "windows")]
        {
            if Self::is_wsl_available() {
                return ExecutorType::Wsl;
            }
            if Self::is_powershell_available() {
                return ExecutorType::PowerShell;
            }
            ExecutorType::Cmd
        }
        #[cfg(not(target_os = "windows"))]
        {
            ExecutorType::Shell
        }
    }

    #[cfg(target_os = "windows")]
    fn is_wsl_available() -> bool {
        Command::new("wsl").arg("--version").output().map(|o| o.status.success()).unwrap_or(false)
    }

    #[cfg(target_os = "windows")]
    fn is_powershell_available() -> bool {
        Command::new("powershell").arg("-Command").arg("$true").output().map(|o| o.status.success()).unwrap_or(false)
    }

    pub async fn execute(&self, command: &str) -> Result<CommandResult> {
        self.execute_with_executor(command, self.auto_executor.clone()).await
    }

    pub async fn execute_with_executor(&self, command: &str, executor: ExecutorType) -> Result<CommandResult> {
        info!("Executing '{}' with {:?}", command, executor);

        let (shell, args) = match executor {
            ExecutorType::Cmd => ("cmd".to_string(), vec!["/C".to_string(), command.to_string()]),
            ExecutorType::PowerShell => ("powershell".to_string(), vec!["-Command".to_string(), command.to_string()]),
            ExecutorType::Wsl => {
                let mut args = vec![command.to_string()];
                if let Some(ref d) = self.wsl_distro {
                    args.insert(0, d.clone());
                    args.insert(0, "-d".to_string());
                }
                ("wsl".to_string(), args)
            }
            ExecutorType::Shell => ("bash".to_string(), vec!["-c".to_string(), command.to_string()]),
        };

        let output = AsyncCommand::new(&shell)
            .args(&args)
            .output()
            .await
            .context(format!("Failed to execute with {}", shell))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let exit_code = output.status.code().map(|c| c as i32);
        let success = output.status.success();

        Ok(CommandResult { success, stdout, stderr, exit_code, command: command.to_string(), executor: format!("{:?}", executor) })
    }

    pub async fn execute_with_stream(&self, command: &str) -> Result<CommandResult> {
        // Simplified - just use regular execute for now
        self.execute(command).await
    }

    pub fn current_executor(&self) -> &ExecutorType {
        &self.auto_executor
    }

    pub fn can_use_wsl(&self) -> bool {
        matches!(self.auto_executor, ExecutorType::Wsl)
    }

    pub async fn test_all_executors(&self) -> Vec<(String, bool)> {
        let mut results = Vec::new();

        #[cfg(target_os = "windows")]
        {
            let r = self.execute_with_executor("echo CMD", ExecutorType::Cmd).await;
            results.push(("CMD".into(), r.map(|x| x.success).unwrap_or(false)));

            let r = self.execute_with_executor("Write-Host PS", ExecutorType::PowerShell).await;
            results.push(("PowerShell".into(), r.map(|x| x.success).unwrap_or(false)));

            let r = self.execute_with_executor("echo WSL", ExecutorType::Wsl).await;
            results.push(("WSL".into(), r.map(|x| x.success).unwrap_or(false)));
        }

        #[cfg(not(target_os = "windows"))]
        {
            let r = self.execute_with_executor("echo Shell", ExecutorType::Shell).await;
            results.push(("Bash".into(), r.map(|x| x.success).unwrap_or(false)));
        }

        results
    }
}

impl Default for CommandExecutor {
    fn default() -> Self {
        Self::new().expect("Failed to create executor")
    }
}

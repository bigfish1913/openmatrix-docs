//! 数据分析引擎
//!
//! 分析推广效果，生成报告和建议

use anyhow::Result;
use chrono::{DateTime, Utc, Duration};
use std::collections::HashMap;

use super::types::{AnalyticsReport, Metrics, Platform, GeneratedContent, PublishResult, InteractionRecord};

/// 数据分析引擎
pub struct AnalyticsEngine {
    /// 内容存储
    contents: Vec<GeneratedContent>,
    /// 发布记录
    publish_records: Vec<PublishResult>,
    /// 互动记录
    interactions: Vec<InteractionRecord>,
    /// 平台指标缓存
    platform_metrics: HashMap<String, Metrics>,
}

impl AnalyticsEngine {
    pub fn new() -> Self {
        Self {
            contents: Vec::new(),
            publish_records: Vec::new(),
            interactions: Vec::new(),
            platform_metrics: HashMap::new(),
        }
    }

    /// 添加内容记录
    pub fn add_content(&mut self, content: GeneratedContent) {
        self.contents.push(content);
    }

    /// 添加发布记录
    pub fn add_publish_record(&mut self, record: PublishResult) {
        self.platform_metrics
            .entry(record.platform.name().to_string())
            .or_insert_with(Metrics::default);
        self.publish_records.push(record);
    }

    /// 添加互动记录
    pub fn add_interaction(&mut self, record: InteractionRecord) {
        self.interactions.push(record);
    }

    /// 生成分析报告
    pub fn generate_report(&self, period_days: i64) -> Result<AnalyticsReport> {
        let end = Utc::now();
        let start = end - Duration::days(period_days);

        let mut report = AnalyticsReport::new(start, end);

        // 统计内容
        report.total_content = self.contents.iter()
            .filter(|c| c.created_at >= start && c.created_at <= end)
            .count() as u32;

        // 统计互动
        report.total_interactions = self.interactions.iter()
            .filter(|i| i.created_at >= start && i.created_at <= end)
            .count() as u32;

        // 汇总指标
        for metrics in self.platform_metrics.values() {
            report.metrics.views += metrics.views;
            report.metrics.likes += metrics.likes;
            report.metrics.comments += metrics.comments;
            report.metrics.shares += metrics.shares;
            report.metrics.stars += metrics.stars;
            report.metrics.forks += metrics.forks;
        }

        // 平台分布
        report.platform_breakdown = self.platform_metrics.clone();

        // 找出热门内容
        report.top_content = self.find_top_content(5);

        // 生成建议
        report.recommendations = self.generate_recommendations(&report);

        Ok(report)
    }

    /// 找出热门内容
    fn find_top_content(&self, limit: usize) -> Vec<String> {
        // 简化实现：返回最近的内容
        self.contents.iter()
            .rev()
            .take(limit)
            .map(|c| c.title.clone())
            .collect()
    }

    /// 生成推广建议
    fn generate_recommendations(&self, report: &AnalyticsReport) -> Vec<String> {
        let mut recommendations = Vec::new();

        // 基于内容数量
        if report.total_content < 5 {
            recommendations.push("建议增加内容发布频率，目标每周至少 2 篇".to_string());
        }

        // 基于互动
        if report.metrics.comments < report.metrics.views / 10 {
            recommendations.push("内容互动率较低，建议增加话题性和互动引导".to_string());
        }

        // 基于平台分布
        if report.platform_breakdown.len() < 3 {
            recommendations.push("建议扩展到更多平台，增加曝光度".to_string());
        }

        // 基于时间
        if report.total_content > 0 && report.total_interactions < report.total_content {
            recommendations.push("建议加强社区互动，及时回复评论和反馈".to_string());
        }

        // 默认建议
        if recommendations.is_empty() {
            recommendations.push("推广效果良好，继续保持！".to_string());
            recommendations.push("可以尝试新的内容形式，如视频教程".to_string());
        }

        recommendations
    }

    /// 获取平台排名
    pub fn get_platform_ranking(&self) -> Vec<(String, u64)> {
        let mut ranking: Vec<(String, u64)> = self.platform_metrics.iter()
            .map(|(name, metrics)| {
                let score = metrics.views + metrics.likes * 2 + metrics.shares * 3;
                (name.clone(), score)
            })
            .collect();

        ranking.sort_by(|a, b| b.1.cmp(&a.1));
        ranking
    }

    /// 获取最佳发布时间建议
    pub fn get_best_posting_times(&self) -> Vec<String> {
        // 基于一般经验的建议
        vec![
            "工作日 9:00-10:00 (早间通勤)".to_string(),
            "工作日 12:00-13:00 (午休)".to_string(),
            "工作日 20:00-22:00 (晚间活跃)".to_string(),
            "周末 10:00-12:00 (周末休闲)".to_string(),
        ]
    }

    /// 预测增长趋势
    pub fn predict_growth(&self, days: i64) -> GrowthPrediction {
        let current_content = self.contents.len() as f64;
        let daily_rate = current_content / 30.0; // 假设 30 天数据

        let predicted_content = (daily_rate * days as f64) as u32;
        let predicted_views = (predicted_content as f64 * 100.0) as u64; // 假设每篇 100 浏览

        GrowthPrediction {
            days,
            predicted_content,
            predicted_views,
            confidence: if current_content > 10.0 { 0.8 } else { 0.5 },
        }
    }

    /// 导出报告为 Markdown
    pub fn export_report_markdown(&self, report: &AnalyticsReport) -> String {
        let mut md = String::new();

        md.push_str(&format!(
            "# OpenMatrix 推广分析报告\n\n"
        ));
        md.push_str(&format!(
            "**报告周期**: {} 至 {}\n\n",
            report.period_start.format("%Y-%m-%d"),
            report.period_end.format("%Y-%m-%d")
        ));

        md.push_str("## 📊 总体指标\n\n");
        md.push_str(&format!("- 📝 发布内容: {}\n", report.total_content));
        md.push_str(&format!("- 💬 社区互动: {}\n", report.total_interactions));
        md.push_str(&format!("- 👁️ 浏览量: {}\n", report.metrics.views));
        md.push_str(&format!("- ❤️ 点赞数: {}\n", report.metrics.likes));
        md.push_str(&format!("- 💬 评论数: {}\n", report.metrics.comments));
        md.push_str(&format!("- 🔄 分享数: {}\n\n", report.metrics.shares));

        md.push_str("## 🏆 平台排名\n\n");
        for (i, (platform, score)) in self.get_platform_ranking().iter().enumerate() {
            md.push_str(&format!("{}. {} - 得分: {}\n", i + 1, platform, score));
        }
        md.push_str("\n");

        md.push_str("## 📈 热门内容\n\n");
        for (i, title) in report.top_content.iter().enumerate() {
            md.push_str(&format!("{}. {}\n", i + 1, title));
        }
        md.push_str("\n");

        md.push_str("## 💡 建议\n\n");
        for rec in &report.recommendations {
            md.push_str(&format!("- {}\n", rec));
        }
        md.push_str("\n");

        md.push_str(&format!(
            "---\n*报告生成时间: {}*\n",
            report.generated_at.format("%Y-%m-%d %H:%M:%S")
        ));

        md
    }
}

impl Default for AnalyticsEngine {
    fn default() -> Self {
        Self::new()
    }
}

/// 增长预测
#[derive(Debug, Clone)]
pub struct GrowthPrediction {
    pub days: i64,
    pub predicted_content: u32,
    pub predicted_views: u64,
    pub confidence: f64,
}

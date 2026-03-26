# OpenMatrix Discord 社区搭建指南
## 服务器创建
### 基本信息
- **服务器名称**: OpenMatrix
- **描述**: AI 原生任务编排框架 - 社区支持与讨论
- **区域**: 美国 (推荐) 或欧洲
- **图标**: OpenMatrix Logo
### 服务器设置
```
社区规则: 保持友善和尊重
验证级别: Medium (邮箱验证)
默认通知: 仅 @mentions
```
## 频道结构
### 分类
| 分类 | 频道 | 用途 |
|------|------|------|
| **信息** | #welcome | 欢迎信息和规则 |
| | #announcements | 产品更新和公告 |
| | #roadmap | 产品路线图 |
| **支持** | #help | 使用帮助 |
| | #bug-reports | Bug 报告 |
| | #feature-requests | 功能请求 |
| **讨论** | #general | 一般讨论 |
| | #showcase | 项目展示 |
| | #off-topic | 非主题讨论 |
| **开发** | #contributing | 贡献讨论 |
| | #core-dev | 核心开发讨论 |
| | #documentation | 文档讨论 |
### 频道详细设置
#### #welcome
```
频道名: 🎉-welcome
主题: 欢迎来到 OpenMatrix 社区！
说明: |
  👋 欢迎来到 OpenMatrix 社区！

  OpenMatrix 是一个 AI 原生任务编排框架。

  在这里你可以:
  • 获取使用帮助
  • 分享你的项目
  • 参与开发讨论
  • 结识其他开发者

  请先阅读 #community-rules 了解社区规则。
  然后 #introduce-yourself 介绍一下自己！

  有问题？在 #help 频道提问。
```
#### #announcements
```
频道名: 📢-announcements
主题: OpenMatrix 公告
权限: 仅管理员可发言
说明: |
  📢 OpenMatrix 官方公告

  这里发布:
  • 产品更新
  • 重要通知
  • 社区活动

  @everyone 会被用于重要公告。
```
#### #help
```
频道名: 🆘-help
主题: 获取帮助
说明: |
  🆘 需要帮助？

  提问前请:
  1. 查看 FAQ: openmatrix.ai/docs/faq
  2. 搜索历史问题
  3. 提供详细信息

  提问格式:
  • OpenMatrix 版本:
  • 操作系统:
  • 问题描述:
  • 已尝试的解决方案:

  社区成员会尽力帮助！
```
#### #showcase
```
频道名: 🎨-showcase
主题: 展示你的项目
说明: |
  🎨 展示你用 OpenMatrix 构建的项目！

  分享格式:
  • 项目名称:
  • 项目描述:
  • GitHub 链接:
  • 使用 OpenMatrix 的体验:

  我们很想看到你的作品！
```
## 角色设置
### 自动角色
| 角色 | 获取条件 | 权限 |
|------|----------|------|
| @everyone | 加入服务器 | 查看频道、发言 |
| @Verified | 验证邮箱 | 创建话题、添加反应 |
| @Contributor | 提交过 PR | 特殊频道访问 |
| @Core Team | 核心团队成员 | 管理权限 |
### 机器人角色
#### 1. OpenMatrix Bot
- **功能**: 自动回复、FAQ、欢迎消息
- **命令**:
  - `/help` - 获取帮助
  - `/faq` - 常见问题
  - `/docs` - 文档链接
  - `/github` - GitHub 链接
  - `/bug` - Bug 报告模板
#### 2. MEE6
- **功能**: 会议和投票
- **命令**:
  - `/poll` - 创建投票
  - `/schedule` - 安排会议
#### 3. Carl-bot
- **功能**: 日志和欢迎
- **命令**:
  - `/welcome` - 欢迎消息
  - `/logs` - 查看日志
## 自动化设置
### 欢迎机器人
```javascript
// 新用户加入时自动发送欢迎消息
module.exports = {
  name: 'openmatrix-welcome',
  triggers: ['guildMemberAdd'],
  execute: async (member) => {
    const welcomeChannel = member.guild.channels.cache.find(
      ch => ch.name === '🎉-welcome'
    );

    if (welcomeChannel) {
      await welcomeChannel.send(`
👋 欢迎 ${member} 加入 OpenMatrix 社区！

请查看 #rules 了解社区规则
在 #introduce-yourself 介绍自己
有问题在 #help 提问
      `);
    }
  }
};
```
### FAQ 机器人
```javascript
// 自动回复常见问题
const faqs = {
  'how to install': '使用 npm: `npm install -g openmatrix`',
  'how to start': '运行 `npx openmatrix start "你的任务"`',
  'is it free': '是的！OpenMatrix 是开源的，采用 MIT 许可证。',
};
module.exports = {
  name: 'openmatrix-faq',
  triggers: ['messageCreate'],
  execute: async (message) => {
    if (message.content.startsWith('!faq ')) {
      const question = message.content.slice(5).trim().toLowerCase();
      const answer = faqs[question];
      if (answer) {
        await message.reply(answer);
      }
    }
  }
};
```
## 社区活动规划
### 寏周活动
| 活动 | 时间 | 频道 |
|------|------|------|
| Office Hours | 周三 18:00 UTC | #general |
| Community Showcase | 周五 19:00 UTC | #showcase |
| Dev Talk | 周日 20:00 UTC | #general |
### 每月活动
| 活动 | 时间 | 描述 |
|------|------|------|
| 社区 AMA | 第一个周六 | 问答活动 |
| 贡献者感谢 | 月末 | 感谢贡献者 |
| 功能投票 | 月初 | 新功能投票 |
## 社区增长策略
### 邀请策略
- **GitHub**: 在 README 中添加 Discord 链接
- **Twitter**: 定期分享社区链接
- **博客**: 在文章中提及社区
### 留存策略
- **活跃氛围**: 定期举办活动
- **快速响应**: 及时回答问题
- **认可贡献**: 感谢活跃成员
## 指标
| 指标 | 目标 | 测量方式 |
|------|------|---------|
| 成员数 | 1,000+ | Discord Analytics |
| 日活跃 | 100+ | 日消息数 |
| 周活跃 | 50+ | 周活跃成员 |
| 响应时间 | <1 小时 | 平均响应时间 |

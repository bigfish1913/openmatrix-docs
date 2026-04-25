# CSDN 自动推广工具

自动发布博客文章到 CSDN，支持定时发布、数据统计等功能。

## 功能特性

- 📝 **自动发布** - 自动发布 Markdown 格式的博客文章
- 🔐 **持久登录** - 保存浏览器状态，无需重复登录
- 📊 **数据统计** - 查看文章浏览、点赞、评论等数据
- ⏰ **定时发布** - 设置发布计划，自动定时发布
- 📚 **内容管理** - 内容库管理，批量导入文章

## 安装

```bash
npm install
```

## 使用方法

### 登录

```bash
npm run csdn:login
```

在浏览器中完成登录（支持扫码或账号密码登录），登录状态会自动保存。

### 发布文章

**交互模式：**

```bash
npm run csdn:post
```

**从文件发布：**

```bash
npm run csdn:post -f article.md --title "文章标题"
```

如果 Markdown 文件第一行是 `# 标题`，会自动提取标题。

### 查看状态

```bash
npm run csdn:status
```

### 数据统计

```bash
npm run csdn:stats          # 查看总览
npm run csdn:stats --today  # 今日数据
npm run csdn:stats --best   # 最佳文章
npm run csdn:stats --export stats.json  # 导出数据
```

### 内容管理

```bash
npm run csdn:add            # 添加内容到库
npm run csdn:add -f article.md  # 从文件添加
npm run csdn:list           # 查看待发布内容
npm run csdn:list --all     # 查看所有内容
npm run csdn:import content.json  # 批量导入
```

### 定时发布

```bash
npm run csdn:schedule       # 启动定时服务
npm run csdn:schedule --stop  # 停止服务
npm run csdn:schedule:status  # 查看状态
```

默认配置：
- 每日最多发布 3 篇
- 发布间隔 60 分钟
- 发布时间段 9:00 - 21:00

## 内容格式

### Markdown 文件

```markdown
# 文章标题

文章正文内容...

## 二级标题

更多内容...
```

### JSON 批量导入格式

```json
[
  {
    "title": "文章标题",
    "content": "Markdown 格式的正文内容",
    "tags": ["标签1", "标签2"],
    "type": "original"
  }
]
```

## 配置

数据存储位置：`~/.csdn/`

- `browser-data/` - 浏览器状态（登录信息）
- `content-library.json` - 内容库
- `scheduler-state.json` - 定时任务状态

## 注意事项

1. 请遵守 CSDN 内容规范，不要发布违规内容
2. 建议每日发布不超过 3 篇，避免被判定为刷屏
3. 文章标题建议控制在 50 字以内
4. 登录状态有效期约 7 天，过期后需重新登录
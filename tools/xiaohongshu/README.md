# 小红书自动发帖工具

一个简单易用的小红书自动发帖命令行工具，支持扫码登录、自动发布和**定时发帖**。

## 功能特点

- 🔐 **扫码登录** - 一次登录，Cookie 持久化保存
- 📝 **图文发布** - 支持文字+图片笔记发布
- 🤖 **AI 配图** - 使用小红书内置文字配图功能
- ⏰ **定时发帖** - 每天 2-3 篇自动发布
- 📚 **内容库** - 管理待发布内容
- 🔒 **安全存储** - Cookie 本地加密存储

## 安装

```bash
# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install chromium
```

## 快速开始

### 1. 登录

首次使用需要扫码登录：

```bash
npm run xhs:login
```

### 2. 添加内容到内容库

```bash
# 交互式添加
npm run xhs:add

# 或批量导入
npm run xhs:import content.json
```

### 3. 启动定时发帖

```bash
npm run xhs:schedule
```

定时服务会在 **9:00、14:00、20:00** 自动发布内容库中的笔记。

## 命令列表

| 命令 | 说明 |
|------|------|
| `npm run xhs:login` | 扫码登录 |
| `npm run xhs:post` | 手动发布笔记 |
| `npm run xhs:status` | 查看登录状态 |
| `npm run xhs:schedule` | 启动定时发帖服务 |
| `npm run xhs:add` | 添加内容到内容库 |
| `npm run xhs:list` | 查看内容库 |
| `npm run xhs:import <file>` | 批量导入内容 |

## 定时发帖配置

默认发布时间：**9:00、14:00、20:00**（每天 3 篇）

内容库位置：`~/.xhs/content.json`

### 内容格式

```json
[
  {
    "title": "笔记标题",
    "content": "笔记正文...",
    "tags": ["标签1", "标签2"],
    "useTextToImage": true
  }
]
```

## 示例内容

参考 `content-example.json` 文件。

## 注意事项

1. 请合理使用，避免频繁发布造成账号风险
2. 建议发布间隔大于 5 分钟
3. 正文最长 1000 字，标题最长 20 字
4. 定时服务需要保持运行

## License

MIT

# 小红书自动发帖工具

一个简单易用的小红书自动发帖命令行工具，支持扫码登录和自动发布图文笔记。

## 功能特点

- 🔐 **扫码登录** - 一次登录，Cookie 持久化保存
- 📝 **图文发布** - 支持文字+图片笔记发布
- 🏷️ **话题标签** - 自动添加话题标签
- 🔒 **安全存储** - Cookie 本地加密存储

## 安装

```bash
# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install chromium
```

## 使用方法

### 1. 登录

首次使用需要扫码登录：

```bash
npm run xhs:login
```

系统会打开浏览器窗口，使用小红书 App 扫码登录。登录成功后，Cookie 会自动保存到本地。

### 2. 发布笔记

```bash
# 交互式发布（推荐）
npm run xhs:post

# 命令行参数发布
npx ts-node tools/xiaohongshu/cli.ts post \
  --title "笔记标题" \
  --content "笔记正文内容" \
  --images ./image1.jpg ./image2.jpg \
  --tags 标签1 标签2
```

### 3. 查看状态

检查当前登录状态：

```bash
npm run xhs:status
```

### 4. 登出

清除本地登录信息：

```bash
npm run xhs:logout
```

## 项目结构

```
tools/xiaohongshu/
├── index.ts      # 主入口
├── types.ts      # 类型定义
├── store.ts      # Cookie 存储
├── login.ts      # 登录模块
├── poster.ts     # 发帖模块
└── cli.ts        # 命令行工具
```

## 安全说明

- Cookie 存储在用户主目录 `.xhs/cookies.json`
- 文件权限设置为 0600（仅所有者可读写）
- **请勿将 Cookie 文件提交到版本控制**

## 注意事项

1. 请合理使用，避免频繁发布造成账号风险
2. 建议发布间隔大于 5 分钟
3. 图片支持 JPG/PNG 格式，最多 18 张
4. 正文最长 1000 字，标题最长 20 字

## 开发

```bash
# 运行测试
npm test

# 构建
npm run build
```

## License

MIT
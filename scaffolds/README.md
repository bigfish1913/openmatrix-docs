# OpenMatrix Scaffolds

OpenMatrix 脚手架工具 - 快速创建自动化工具项目

## 快速开始

### 创建新项目

```bash
# 运行脚手架（当前目录）
npm run scaffold

# 创建新的 xiaohongshu 工具
npm run scaffold create xiaohongshu-poster my-xhs-tool
```

## 可用的脚手架模板

### xiaohongshu-poster

小红书自动发帖 CLI 工具。

**功能：**
- 扫码登录，Cookie 持久化保存
- 图文笔记发布
- AI 文字配图（自动生成封面）
- 话题标签管理

**使用方法：**
```bash
cd my-xhs-tool
npm install
npm run login    # 扫码登录
npm run post     # 发布笔记
npm run status   # 查看登录状态
```

## 项目结构

```
openmatrix-docs/
├── tools/
│   ├── xiaohongshu/     # 小红书工具源码（可直接运行）
│   └── scaffold/        # 脚手架生成器
├── scaffolds/
│   └── xiaohongshu-poster/  # 脚手架模板
│       └── src/
│           ├── cli.ts      # CLI 入口
│           ├── index.ts    # 主模块
│           ├── types.ts    # 类型定义
│           ├── login.ts    # 登录模块
│           ├── poster.ts   # 发帖模块
│           └── store.ts    # Cookie 存储
└── tests/
    └── ...
```

## 开发新的脚手架

1. 在 `scaffolds/` 目录下创建新模板
2. 在 `tools/scaffold/cli.ts` 中注册模板
3. 运行 `npm run scaffold` 测试

## License

MIT

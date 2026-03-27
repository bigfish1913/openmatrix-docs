# OpenMatrix 目录结构规范

本文档定义了 OpenMatrix 项目的目录结构规范，确保项目组织清晰、易于维护。

## 当前目录结构

```
openmatrix-docs/
├── .github/              # GitHub 配置（Actions、ISSUE 模板等）
├── .openmatrix/          # OpenMatrix 本地状态（已忽略）
├── .playwright-mcp/      # Playwright 日志（已忽略）
├── autonomous-agent/     # Agent CLI 工具（Rust 项目）
├── brand/                # 品牌资产（Logo、视觉规范等）
├── content/              # 内容营销素材
│   ├── blog/             # 博客文章
│   ├── community/        # 社区内容
│   ├── growth/           # 增长相关内容
│   └── social/           # 社交媒体内容
├── deploy/               # 部署脚本和配置
├── github/               # GitHub 相关脚本和配置
├── scaffolds/            # 脚手架模板
│   ├── README.md         # 脚手架使用说明
│   └── xiaohongshu-poster/
│       └── src/          # 模板源代码
├── tools/                # 工具脚本和 CLI
│   ├── scaffold/         # 脚手架生成器
│   │   └── src/          # 源代码
│   ├── xiaohongshu/      # 小红书自动发帖工具
│   │   └── src/          # 源代码
│   └── tests/            # 测试代码
│       ├── e2e/          # 端到端测试
│       └── unit/         # 单元测试
├── website/              # 官方网站
│   └── docs/             # 文档页面
├── .gitignore            # Git 忽略规则
├── LICENSE               # 开源许可证
├── README.md             # 项目说明
├── CONTRIBUTING.md       # 贡献指南
└── PROJECT_STRUCTURE.md  # 目录结构规范（本文档）
```

## 目录用途说明

### 核心目录

| 目录 | 用途 | 是否提交 |
|------|------|----------|
| `autonomous-agent/` | Agent CLI 工具（Rust 项目） | ✅ 是 |
| `brand/` | 品牌资产、Logo、视觉规范 | ✅ 是 |
| `content/` | 内容营销素材、博客、社交媒体内容 | ✅ 是 |
| `deploy/` | 部署脚本、CI/CD 配置 | ✅ 是 |
| `github/` | GitHub 相关配置 | ✅ 是 |
| `scaffolds/` | 脚手架模板，用于快速创建新项目 | ✅ 是 |
| `tools/` | 工具脚本、CLI 工具、测试代码 | ✅ 是 |
| `website/` | 官方网站代码 | ✅ 是 |

### 隐藏目录

| 目录 | 用途 | 是否提交 |
|------|------|----------|
| `.github/` | GitHub Actions、Issue 模板 | ✅ 是 |
| `.openmatrix/` | OpenMatrix 本地运行状态 | ❌ 否（已忽略） |
| `.playwright-mcp/` | Playwright 日志文件 | ❌ 否（已忽略） |
| `node_modules/` | npm 依赖 | ❌ 否（已忽略） |
| `dist/` | 构建输出 | ❌ 否（已忽略） |

## 文件命名规范

### 目录命名
- 全部使用 **小写字母**
- 多个单词使用 **连字符 `-`** 分隔
- 例如：`xiaohongshu-poster/`、`autonomous-agent/`

### 源代码文件
- **TypeScript**: `.ts` 扩展名
- **模块入口**: `index.ts`
- **命令行工具**: `cli.ts`
- **类型定义**: `types.ts`

### 测试文件
- **单元测试**: `*.test.ts`
- **E2E 测试**: `*.e2e.test.ts`

### 配置文件
- `*.config.js` 或 `*.config.ts`
- `tsconfig.json`
- `package.json`

## 工具项目结构规范

每个工具（`tools/` 目录下）应包含：

```
tools/<tool-name>/
├── src/
│   ├── cli.ts        # CLI 入口文件
│   ├── index.ts      # 主模块入口
│   ├── types.ts      # TypeScript 类型定义
│   └── *.ts          # 其他模块
├── package.json      # 依赖配置
├── tsconfig.json     # TypeScript 配置
└── README.md         # 工具使用说明（可选）
```

## 脚手架模板结构规范

每个脚手架模板（`scaffolds/` 目录下）应包含：

```
scaffolds/<template-name>/
├── src/              # 模板源代码
├── package.json      # 项目配置（含模板变量）
└── tsconfig.json     # TypeScript 配置
```

### 模板变量

在 `package.json` 等文件中可使用模板变量：

- `${name}` - 项目名称
- `${description}` - 项目描述

## 测试文件规范

测试代码统一放在 `tools/tests/` 目录下：

```
tools/tests/
├── unit/             # 单元测试
│   └── *.test.ts
└── e2e/              # 端到端测试
    └── *.e2e.test.ts
```

## 内容目录规范

`content/` 目录用于存放内容营销素材：

```
content/
├── blog/             # 博客文章（Markdown 格式）
├── community/        # 社区分享内容
├── growth/           # 增长黑客相关内容
└── social/           # 社交媒体文案
```

## 网站目录规范

`website/` 目录用于存放官方网站代码：

```
website/
├── docs/             # 文档页面
├── index.html        # 主页
├── *.js              # 脚本文件
└── *.svg             # 图片资源
```

## 禁止事项

1. ❌ 不要在根目录创建零散的 `.ts` 或 `.js` 文件
2. ❌ 不要在根目录创建新的顶级目录（先讨论）
3. ❌ 不要提交 `node_modules/`、`dist/` 等构建产物
4. ❌ 不要提交 `.openmatrix/`、`.playwright-mcp/` 等本地状态
5. ❌ 不要在代码中硬编码路径，使用相对路径或环境变量
6. ❌ 不要将测试文件放在根目录，统一放到 `tools/tests/`

## 新增目录流程

1. 在 PR 中说明新增目录的用途
2. 确保 `.gitignore` 已正确配置（如需要）
3. 更新本文档

---

最后更新：2026-03-27

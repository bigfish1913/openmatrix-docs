---
name: openmatrix-docs-full-update
description: 全面更新 openmatrix-docs 文档站点，同步 v0.2.17~v0.2.23 版本内容
type: project
---

# 全面更新 openmatrix-docs 文档站点

日期: 2026-04-25

## 核心目标

- 五篇版本更新文章（路由优化、测试生成、意图驱动、任务阻塞、部署优化）
- README 内容同步主项目核心功能
- 官网首页功能介绍更新
- 完整部署到 matrix.laofu.online

## 版本功能节点

| 功能节点 | 版本范围 | 主要变化 |
|---------|---------|---------|
| 路由优化 | v0.2.17~v0.2.19 | om:brainstorm 自动路由、AI推荐模式、语义优先判断 |
| 测试生成 | v0.2.20 | /om:test 指令、CLI/分析器/生成器模块 |
| 意图驱动 | v0.2.21 | 全部 skill 意图触发机制、部署验证强化 |
| 任务阻塞 | v0.2.22 | 任务阻塞机制、状态转换图表 |
| 部署优化 | v0.2.23 | 慢源检测、国内镜像推荐、TodoWrite 追踪 |

## 交付物清单

1. `content/blog/openmatrix-v0.2.17-v0.2.19-routing-update.md` - 路由优化文章
2. `content/blog/openmatrix-v0.2.20-test-command.md` - 测试生成文章
3. `content/blog/openmatrix-v0.2.21-intent-driven.md` - 意图驱动文章
4. `content/blog/openmatrix-v0.2.22-task-blocking.md` - 任务阻塞文章
5. `content/blog/openmatrix-v0.2.23-deploy-optimization.md` - 部署优化文章
6. `README.md` 同步主项目核心功能
7. `website/index.html` 首页功能介绍更新
8. 部署验证（网站可访问）

## 文章格式规范

- Hexo Frontmatter: title、description、author、date
- 结构: 功能介绍 → 使用方式 → 适用场景 → 安装升级
- 语言: 中文为主
- 参考: `content/blog/openmatrix-v0.2.16-update.md` 格式

## 约束

- 需先提交现有未追踪文件（v0.2.16 文章等）
- 参考主项目 CLAUDE.md 和 README.md 的功能描述
- 保持与现有文档风格一致

## 验收标准

- 五篇文章内容完整、格式正确
- README 同步主项目最新功能
- 首页展示最新版本号和核心功能
- 部署后网站可访问（HTTP 200）
# 贡献指南

感谢你考虑为 OpenMatrix 做贡献！

## 行为准则

本项目采用贡献者公约作为行为准则。参与此项目即表示你同意遵守其条款。请阅读 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) 了解详情。

## 我可以如何贡献？

### 报告 Bug

如果你发现了 bug，请创建一个 [Issue](https://github.com/openmatrix/openmatrix/issues/new?template=bug_report.md)，包含：

- 清晰的标题和描述
- 重现步骤
- 预期行为和实际行为
- 你的环境信息（OS, Node.js 版本等）
- 相关的日志或截图

### 建议新功能

如果你有新功能的想法，请创建一个 [Issue](https://github.com/openmatrix/openmatrix/issues/new?template=feature_request.md)，包含：

- 清晰的标题和描述
- 使用场景和动机
- 可能的实现方案（可选）

### 提交代码

1. **Fork 项目**

   ```bash
   git clone https://github.com/your-username/openmatrix.git
   cd openmatrix
   ```

2. **创建分支**

   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **安装依赖**

   ```bash
   npm install
   ```

4. **进行更改**

   - 遵循现有的代码风格
   - 添加必要的测试
   - 更新相关文档

5. **运行测试**

   ```bash
   npm test
   npm run lint
   ```

6. **提交更改**

   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   ```

   遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式（不影响功能）
   - `refactor:` 代码重构
   - `test:` 测试相关
   - `chore:` 构建/工具相关

7. **推送分支**

   ```bash
   git push origin feature/your-feature-name
   ```

8. **创建 Pull Request**

   - 填写 PR 模板中的所有必要信息
   - 关联相关的 Issue
   - 等待代码审查

## 开发指南

### 代码风格

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

```bash
npm run lint
npm run format
```

### 测试

- 所有新功能必须有测试
- Bug 修复应该包含回归测试
- 保持测试覆盖率 > 80%

```bash
npm test
npm run test:coverage
```

### 文档

- 更新 README.md（如果需要）
- 更新 API 文档（如果需要）
- 添加 JSDoc 注释

## 项目结构

```
openmatrix-docs/
├── autonomous-agent/     # Agent CLI 工具
├── brand/                # 品牌资产
├── content/              # 内容营销素材
├── deploy/               # 部署脚本
├── scaffolds/            # 脚手架模板
├── tools/                # 工具和测试代码
│   ├── scaffold/         # 脚手架生成器
│   ├── xiaohongshu/      # 小红书工具
│   └── tests/            # 测试代码
├── website/              # 官方网站
└── *.md                  # 项目文档
```

## 发布流程

1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建 Git 标签
4. 发布到 npm
5. 创建 GitHub Release

## 获取帮助

- [GitHub Discussions](https://github.com/openmatrix/openmatrix/discussions)
- [Discord](https://discord.gg/openmatrix)

## 许可证

通过贡献代码，你同意你的代码将在 MIT 许可证下发布。

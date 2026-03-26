# 贡献指南

感谢你考虑为 OpenMatrix 做贡献！

请阅读 [行为准则](CODE_OF_CONDUCT.md) 了解详情。

## 我可以如何贡献？

### 报告 Bug

如果你发现了 bug，请先查看是否已有 [Issue](https://github.com/openmatrix/openmatrix/issues) 报告。 bug 已经存在，请创建新的 Issue。

### 巻加新功能
如果你有新功能的想法，请创建一个 [Feature Request](https://github.com/openmatrix/openmatrix/issues/new?feature)。
### 提交代码
请先 Fork 项目，创建分支，进行更改，然后提交 Pull Request。

## 开发环境

### 设置开发环境

```bash
# 安装依赖
npm install
```

### 运行测试
确保所有测试通过：
```bash
npm test
```
```

### 代码风格
我们使用 ESLint 和 Prettier 来保持代码风格一致。

```bash
npm run lint
npm run format
```

### 提交更改
```bash
git add .
git commit -m "feat: 添加新功能"
```
```
请确保你的提交信息清晰且关联相关 Issue。

```

### 运行 lint
```bash
npm run lint
```

**如果有错误，请修复它们错误并继续。**
`` ```
bash
git push origin feature/your-feature-name
        ```

9. **创建 Pull Request**

访问 GitHub 并创建 Pull Request。填写模板中的所有必要信息并关联相关的 Issue。


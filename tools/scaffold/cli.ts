#!/usr/bin/env node

/**
 * OpenMatrix 脚手架工具
 *
 * 用法:
 *   om-scaffold create <template> <name> - 创建新项目
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// 可用的脚手架模板
const TEMPLATES = {
  'xiaohongshu-poster': {
    name: '小红书自动发帖工具',
    description: '基于 Playwright 的小红书自动发帖 CLI 工具',
    source: path.join(__dirname, '../../scaffolds/xiaohongshu-poster')
  }
};

program
  .name('om-scaffold')
  .description('OpenMatrix 脚手架工具')
  .version('1.0.0');

program
  .command('create <template> [name]')
  .description('基于模板创建新项目')
  .action(async (template: string, name?: string) => {
    // 检查模板是否存在
    if (!TEMPLATES[template as keyof typeof TEMPLATES]) {
      console.log(chalk.red(`❌ 模板 "${template}" 不存在`));
      console.log(chalk.gray(`   可用模板：${Object.keys(TEMPLATES).join(', ')}`));
      return;
    }

    // 如果没有提供项目名称，进入交互模式
    if (!name) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '项目名称:',
          default: `xhs-${Date.now()}`,
          validate: (input: string) => {
            if (!input) return '请输入项目名称';
            if (!/^[a-z][a-z0-9-_]*$/i.test(input)) {
              return '项目名称只能包含字母、数字、横线和下划线，且必须以字母开头';
            }
            return true;
          }
        }
      ]);
      name = answer.projectName;
    }

    const targetDir = path.resolve(process.cwd(), name!);

    // 检查目录是否已存在
    if (fs.existsSync(targetDir)) {
      console.log(chalk.red(`❌ 目录 "${name}" 已存在`));
      return;
    }

    const templateInfo = TEMPLATES[template as keyof typeof TEMPLATES];
    console.log(chalk.blue(`\n📦 正在创建 ${templateInfo.name}...`));
    console.log(chalk.gray(`   目标目录：${targetDir}\n`));

    // 复制模板文件
    await copyTemplate(templateInfo.source, targetDir, name!, template);

    console.log(chalk.green(`\n✅ 项目创建成功!\n`));
    console.log(chalk.gray('接下来，运行以下命令：\n'));
    console.log(chalk.white(`   cd ${name}`));
    console.log(chalk.white('   npm install'));
    console.log(chalk.white('   npm run build'));
    console.log(chalk.white('   npm run login\n'));
  });

program
  .command('list')
  .description('列出可用的脚手架模板')
  .action(() => {
    console.log(chalk.blue('\n可用的脚手架模板:\n'));

    for (const [key, info] of Object.entries(TEMPLATES)) {
      console.log(chalk.green(`  ● ${key}`));
      console.log(chalk.gray(`    ${info.description}\n`));
    }
  });

async function copyTemplate(source: string, target: string, name: string, template: string) {
  // 创建目标目录
  fs.mkdirSync(target, { recursive: true });

  // 复制文件
  const files = await fs.promises.readdir(source);

  for (const file of files) {
    // 跳过 .gitignore，在根目录统一创建
    if (file === '.gitignore') continue;

    const srcFile = path.join(source, file);
    const destFile = path.join(target, file);
    const stat = await fs.promises.stat(srcFile);

    if (stat.isDirectory()) {
      await copyTemplate(srcFile, destFile, name, template);
    } else {
      let content = await fs.promises.readFile(srcFile, 'utf-8');

      // 替换模板变量
      if (file.endsWith('.json')) {
        content = content.replace(/\$\{name\}/g, name);
        content = content.replace(/\$\{description\}/g, `${name} - 基于 OpenMatrix 脚手架`);
      }

      await fs.promises.writeFile(destFile, content);
    }
  }

  // 创建 .gitignore
  const gitignore = `node_modules/
dist/
*.log
.env
`;
  await fs.promises.writeFile(path.join(target, '.gitignore'), gitignore);
}

program.parse();

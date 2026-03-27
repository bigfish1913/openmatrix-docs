#!/usr/bin/env node

/**
 * 小红书自动发帖命令行工具
 *
 * 用法:
 *   xhs login    - 扫码登录
 *   xhs post     - 发布笔记
 *   xhs status   - 查看登录状态
 *   xhs logout   - 登出
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { Xiaohongshu } from './index';

const program = new Command();
const xhs = new Xiaohongshu();

program
  .name('xhs')
  .description('小红书自动发帖工具')
  .version('1.0.0');

// 登录命令
program
  .command('login')
  .description('扫码登录小红书')
  .action(async () => {
    console.log(chalk.blue('=== 小红书登录 ===\n'));

    const result = await xhs.login();

    if (result.success) {
      console.log(chalk.green('\n✅ ' + result.message));
      if (result.userId) {
        console.log(chalk.gray(`   用户ID: ${result.userId}`));
      }
    } else {
      console.log(chalk.red('\n❌ ' + result.message));
    }
  });

// 发布命令
program
  .command('post')
  .description('发布图文笔记')
  .option('-t, --title <title>', '笔记标题')
  .option('-c, --content <content>', '笔记正文')
  .option('-i, --images <images...>', '图片路径')
  .option('--tags <tags...>', '话题标签')
  .option('--text-to-image', '使用小红书AI文字配图')
  .option('--image-prompt <prompt>', '文字配图提示词')
  .action(async (options) => {
    console.log(chalk.blue('=== 发布笔记 ===\n'));

    // 检查登录状态
    const status = await xhs.getStatus();
    if (!status.isLoggedIn) {
      console.log(chalk.red('❌ 未登录或登录已过期，请先运行 xhs login'));
      return;
    }

    console.log(chalk.gray(`当前登录用户: ${status.username || status.userId}`));

    // 如果没有提供参数，进入交互模式
    let postOptions = options;

    if (!options.title || !options.content) {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: '笔记标题:',
            default: options.title,
            validate: (input: string) => input.length > 0 || '请输入标题'
          },
          {
            type: 'editor',
            name: 'content',
            message: '笔记正文 (将打开编辑器):',
            default: options.content
          },
          {
            type: 'input',
            name: 'images',
            message: '图片路径 (多个用逗号分隔):',
            default: options.images?.join(','),
            filter: (input: string) => input.split(',').map(s => s.trim()).filter(Boolean)
          },
          {
            type: 'input',
            name: 'tags',
            message: '话题标签 (多个用逗号分隔):',
            default: options.tags?.join(','),
            filter: (input: string) => input.split(',').map(s => s.trim()).filter(Boolean)
          }
        ]);

        postOptions = answers;
      } catch (error) {
        console.log(chalk.yellow('\n已取消发布'));
        return;
      }
    }

    // 验证图片
    if (postOptions.images && postOptions.images.length > 0) {
      for (const imgPath of postOptions.images) {
        const fullPath = path.isAbsolute(imgPath) ? imgPath : path.resolve(process.cwd(), imgPath);
        if (!fs.existsSync(fullPath)) {
          console.log(chalk.red(`❌ 图片不存在: ${imgPath}`));
          return;
        }
      }
    }

    console.log(chalk.gray('\n正在发布...\n'));

    const result = await xhs.post({
      title: postOptions.title,
      content: postOptions.content,
      images: postOptions.images || [],
      tags: postOptions.tags || [],
      useTextToImage: postOptions.textToImage,
      imagePrompt: postOptions.imagePrompt
    });

    if (result.success) {
      console.log(chalk.green('✅ ' + result.message));
      if (result.postUrl) {
        console.log(chalk.blue(`   链接: ${result.postUrl}`));
      }
    } else {
      console.log(chalk.red('❌ ' + result.message));
    }
  });

// 状态命令
program
  .command('status')
  .description('查看登录状态')
  .action(async () => {
    console.log(chalk.blue('=== 登录状态 ===\n'));

    const status = await xhs.getStatus();

    if (status.isLoggedIn) {
      console.log(chalk.green('✅ 已登录'));
      if (status.userId) {
        console.log(chalk.gray(`   用户ID: ${status.userId}`));
      }
      if (status.username) {
        console.log(chalk.gray(`   用户名: ${status.username}`));
      }
      if (status.lastLogin) {
        console.log(chalk.gray(`   上次登录: ${status.lastLogin.toLocaleString()}`));
      }
      if (status.cookieExpiry) {
        const isExpired = status.cookieExpiry < new Date();
        console.log(chalk[isExpired ? 'red' : 'gray'](
          `   Cookie过期: ${status.cookieExpiry.toLocaleString()}`
        ));
      }
    } else {
      console.log(chalk.yellow('❌ 未登录或登录已过期'));
      console.log(chalk.gray('   请运行 xhs login 进行登录'));
    }
  });

// 登出命令
program
  .command('logout')
  .description('清除登录信息')
  .action(async () => {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '确定要清除登录信息吗？',
        default: false
      }
    ]);

    if (answer.confirm) {
      await xhs.logout();
      console.log(chalk.green('✅ 已登出'));
    } else {
      console.log(chalk.gray('已取消'));
    }
  });

// 解析命令行参数
program.parse();
#!/usr/bin/env node

/**
 * CSDN 自动推广命令行工具
 *
 * 用法:
 *   csdn login    - 登录 CSDN
 *   csdn post     - 发布文章
 *   csdn status   - 查看登录状态
 *   csdn logout   - 登出
 *   csdn schedule - 启动定时发布
 *   csdn add      - 添加内容到库
 *   csdn list     - 查看内容库
 *   csdn stats    - 查看数据统计
 *   csdn import   - 批量导入内容
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { CSDN } from './index';
import { CsdnScheduler } from './scheduler';

const program = new Command();
const csdn = new CSDN();
const scheduler = new CsdnScheduler();

program
  .name('csdn')
  .description('CSDN 自动推广工具')
  .version('1.0.0');

// 登录命令
program
  .command('login')
  .description('登录 CSDN')
  .action(async () => {
    console.log(chalk.blue('=== CSDN 登录 ===\n'));

    const result = await csdn.login();

    if (result.success) {
      console.log(chalk.green('\n✅ ' + result.message));
      if (result.userId) {
        console.log(chalk.gray(`   用户ID: ${result.userId}`));
      }
      if (result.username) {
        console.log(chalk.gray(`   用户名: ${result.username}`));
      }
    } else {
      console.log(chalk.red('\n❌ ' + result.message));
    }
  });

// 发布命令
program
  .command('post')
  .description('发布博客文章')
  .option('-t, --title <title>', '文章标题')
  .option('-c, --content <content>', '文章正文')
  .option('--tags <tags>', '话题标签（逗号分隔）')
  .option('--category <category>', '文章分类')
  .option('--type <type>', '文章类型: original, repost, translation')
  .option('-f, --file <file>', '从文件读取内容（Markdown 格式）')
  .action(async (options) => {
    console.log(chalk.blue('=== 发布文章 ===\n'));

    // 检查登录状态
    const status = await csdn.getStatus();
    if (!status.isLoggedIn) {
      console.log(chalk.red('❌ 未登录或登录已过期，请先运行 csdn login'));
      return;
    }

    // 从文件读取内容
    if (options.file) {
      const filePath = path.resolve(process.cwd(), options.file);
      if (!fs.existsSync(filePath)) {
        console.log(chalk.red(`❌ 文件不存在: ${options.file}`));
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // 解析 Markdown 文件
      const lines = fileContent.split('\n');
      let title = options.title;
      let content = '';

      // 尝试从文件中提取标题（第一行如果是 # 开头）
      if (!title && lines[0]?.startsWith('#')) {
        title = lines[0].replace(/^#+\s*/, '').trim();
        content = lines.slice(1).join('\n').trim();
      } else {
        content = fileContent;
      }

      if (!title) {
        console.log(chalk.red('❌ 未找到标题，请使用 --title 参数或在文件第一行使用 # 标题'));
        return;
      }

      console.log(chalk.gray(`标题: ${title}`));
      console.log(chalk.gray(`内容长度: ${content.length} 字`));

      const result = await csdn.post({
        title,
        content,
        tags: options.tags?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
        category: options.category,
        type: options.type as 'original' | 'repost' | 'translation' || 'original'
      });

      if (result.success) {
        console.log(chalk.green('\n✅ ' + result.message));
        if (result.postUrl) {
          console.log(chalk.blue(`   链接: ${result.postUrl}`));
        }
      } else {
        console.log(chalk.red('\n❌ ' + result.message));
      }
      return;
    }

    // 交互模式
    let postOptions = options;

    if (!options.title || !options.content) {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: '文章标题:',
            default: options.title,
            validate: (input: string) => input.length > 0 || '请输入标题'
          },
          {
            type: 'editor',
            name: 'content',
            message: '文章正文 (Markdown 格式，将打开编辑器):',
            default: options.content
          },
          {
            type: 'input',
            name: 'tags',
            message: '话题标签 (多个用逗号分隔):',
            default: options.tags,
            filter: (input: string) => input.split(',').map((s: string) => s.trim()).filter(Boolean)
          },
          {
            type: 'list',
            name: 'type',
            message: '文章类型:',
            choices: ['original', 'repost', 'translation'],
            default: options.type || 'original'
          }
        ]);

        postOptions = answers;
      } catch (error) {
        console.log(chalk.yellow('\n已取消发布'));
        return;
      }
    }

    console.log(chalk.gray('\n正在发布...\n'));

    const result = await csdn.post({
      title: postOptions.title,
      content: postOptions.content,
      tags: postOptions.tags || [],
      category: postOptions.category,
      type: postOptions.type as 'original' | 'repost' | 'translation' || 'original'
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

    const status = await csdn.getStatus();

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
    } else {
      console.log(chalk.yellow('❌ 未登录或登录已过期'));
      console.log(chalk.gray('   请运行 csdn login 进行登录'));
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
      await csdn.logout();
      console.log(chalk.green('✅ 已登出'));
    } else {
      console.log(chalk.gray('已取消'));
    }
  });

// 数据统计命令
program
  .command('stats')
  .description('查看文章数据统计')
  .option('--today', '只看今日数据')
  .option('--best', '显示表现最好的文章')
  .option('--export <file>', '导出数据到 JSON 文件')
  .action(async (options) => {
    console.log(chalk.blue('=== 文章数据统计 ===\n'));

    try {
      const overview = await csdn.getOverview();

      if (overview.totalBlogs === 0) {
        console.log(chalk.yellow('暂无文章数据'));
        return;
      }

      if (options.export) {
        const blogs = await csdn.getBlogStats();
        const exportPath = path.resolve(process.cwd(), options.export);
        fs.writeFileSync(exportPath, JSON.stringify(blogs, null, 2), 'utf-8');
        console.log(chalk.green(`✅ 数据已导出到: ${options.export}`));
        return;
      }

      // 总览
      console.log(chalk.cyan('📊 总览'));
      console.log(chalk.white(`  文章总数: ${overview.totalBlogs}`));
      console.log(chalk.white(`  总浏览量: ${overview.totalViews}`));
      console.log(chalk.white(`  总点赞数: ${overview.totalLikes}`));
      console.log(chalk.white(`  总评论数: ${overview.totalComments}`));
      console.log(chalk.white(`  总收藏数: ${overview.totalCollects}`));
      console.log(chalk.white(`  总粉丝数: ${overview.totalFans}`));

      // 周数据
      console.log(chalk.cyan('\n📈 本周增长'));
      console.log(chalk.white(`  浏览增长: +${overview.weeklyStats.viewsIncrease}`));
      console.log(chalk.white(`  粉丝增长: +${overview.weeklyStats.fansIncrease}`));
      console.log(chalk.white(`  点赞增长: +${overview.weeklyStats.likesIncrease}`));
      if (overview.weeklyStats.ranking) {
        console.log(chalk.white(`  博客排名: #${overview.weeklyStats.ranking}`));
      }

      // 今日数据
      if (options.today || overview.todayBlogs.length > 0) {
        console.log(chalk.cyan('\n📅 今日文章'));
        if (overview.todayBlogs.length === 0) {
          console.log(chalk.gray('  今日暂无发布'));
        } else {
          overview.todayBlogs.forEach(blog => {
            console.log(chalk.white(`  ${blog.title}`));
            console.log(chalk.gray(`    浏览:${blog.views} 点赞:${blog.likes} 评论:${blog.comments} 收藏:${blog.collects}`));
          });
        }
      }

      // 最佳文章
      if (options.best && overview.bestPerformer) {
        const best = overview.bestPerformer;
        console.log(chalk.cyan('\n🏆 最佳文章'));
        console.log(chalk.white(`  ${best.title}`));
        console.log(chalk.gray(`    浏览:${best.views} 点赞:${best.likes} 评论:${best.comments} 收藏:${best.collects}`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ ${error instanceof Error ? error.message : '读取数据失败'}`));
    }
  });

// 定时任务命令
program
  .command('schedule')
  .description('启动定时发布服务')
  .option('--stop', '停止定时服务')
  .option('--max <n>', '每日最大发布数', '3')
  .option('--interval <n>', '发布间隔（分钟）', '60')
  .action(async (options) => {
    if (options.stop) {
      scheduler.stop();
      return;
    }

    console.log(chalk.blue('=== 定时发布服务 ===\n'));

    // 检查登录状态
    const status = await csdn.getStatus();
    if (!status.isLoggedIn) {
      console.log(chalk.red('❌ 未登录，请先运行 csdn login'));
      return;
    }

    const state = scheduler.getStatus();
    console.log(chalk.gray(`今日已发布: ${state.todayPosts} 篇`));
    console.log(chalk.gray(`待发布内容: ${state.pending} 篇`));
    console.log(chalk.gray(`下次发布时间: ${state.nextPost || '无'}`));

    scheduler.start();
  });

// 查看定时任务状态
program
  .command('schedule:status')
  .description('查看定时任务状态')
  .action(() => {
    const state = scheduler.getStatus();
    console.log(chalk.blue('\n=== 定时任务状态 ===\n'));
    console.log(`运行状态: ${state.isRunning ? '运行中' : '已停止'}`);
    console.log(`今日已发布: ${state.todayPosts} 篇`);
    console.log(`待发布内容: ${state.pending} 篇`);
    console.log(`下次发布: ${state.nextPost || '无计划'}`);
  });

// 添加内容到库
program
  .command('add')
  .description('添加内容到内容库')
  .option('-t, --title <title>', '标题')
  .option('-c, --content <content>', '正文')
  .option('--tags <tags>', '标签（逗号分隔）')
  .option('-f, --file <file>', '从文件读取内容')
  .action(async (options) => {
    console.log(chalk.blue('=== 添加内容 ===\n'));

    let postOptions = options;

    // 从文件读取
    if (options.file) {
      const filePath = path.resolve(process.cwd(), options.file);
      if (!fs.existsSync(filePath)) {
        console.log(chalk.red(`❌ 文件不存在: ${options.file}`));
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n');
      let title = options.title;
      let content = '';

      if (!title && lines[0]?.startsWith('#')) {
        title = lines[0].replace(/^#+\s*/, '').trim();
        content = lines.slice(1).join('\n').trim();
      } else {
        content = fileContent;
      }

      postOptions = { ...options, title, content };
    }

    // 交互模式
    if (!postOptions.title || !postOptions.content) {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: '文章标题:',
            validate: (input: string) => input.length > 0 || '请输入标题'
          },
          {
            type: 'editor',
            name: 'content',
            message: '文章正文 (Markdown 格式):'
          },
          {
            type: 'input',
            name: 'tags',
            message: '话题标签 (多个用逗号分隔):',
            filter: (input: string) => input.split(',').map((s: string) => s.trim()).filter(Boolean)
          },
          {
            type: 'list',
            name: 'type',
            message: '文章类型:',
            choices: ['original', 'repost', 'translation'],
            default: 'original'
          }
        ]);
        postOptions = answers;
      } catch (error) {
        console.log(chalk.yellow('\n已取消'));
        return;
      }
    }

    const item = scheduler.addContent({
      title: postOptions.title,
      content: postOptions.content,
      tags: postOptions.tags || [],
      type: postOptions.type as 'original' | 'repost' | 'translation' || 'original'
    });

    console.log(chalk.green(`\n✅ 已添加: ${item.title}`));
    console.log(chalk.gray(`   ID: ${item.id}`));
  });

// 查看内容库
program
  .command('list')
  .description('查看内容库')
  .option('--all', '显示所有内容（包括已发布）')
  .action((options) => {
    console.log(chalk.blue('\n=== 内容库 ===\n'));

    const library = scheduler.loadContentLibrary();
    const pending = library.filter(i => !i.published);
    const published = library.filter(i => i.published);

    if (options.all) {
      console.log(chalk.green(`待发布 (${pending.length}):`));
      pending.forEach((item, i) => {
        console.log(chalk.white(`  ${i + 1}. ${item.title}`));
        console.log(chalk.gray(`     ID: ${item.id}`));
      });

      console.log(chalk.gray(`\n已发布 (${published.length}):`));
      published.forEach((item, i) => {
        console.log(chalk.gray(`  ${i + 1}. ${item.title} - ${item.publishedAt}`));
      });
    } else {
      if (pending.length === 0) {
        console.log(chalk.yellow('暂无待发布内容'));
        console.log(chalk.gray('使用 csdn add 添加内容'));
      } else {
        console.log(chalk.green(`待发布 (${pending.length}):`));
        pending.forEach((item, i) => {
          console.log(chalk.white(`  ${i + 1}. ${item.title}`));
          console.log(chalk.gray(`     ${item.content.substring(0, 50)}...`));
        });
      }
    }
  });

// 批量导入内容
program
  .command('import')
  .description('批量导入内容')
  .argument('<file>', 'JSON 文件路径')
  .action((file) => {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      console.log(chalk.red(`❌ 文件不存在: ${file}`));
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      const items = scheduler.addBatchContent(data);
      console.log(chalk.green(`\n✅ 已导入 ${items.length} 条内容`));
    } catch (e) {
      console.log(chalk.red('❌ 导入失败: 文件格式错误'));
    }
  });

// 解析命令行参数
program.parse();
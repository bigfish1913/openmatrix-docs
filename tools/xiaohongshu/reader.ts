/**
 * 小红书数据读取模块
 *
 * 功能：
 * - 读取笔记管理页面的所有笔记数据（浏览、点赞、评论、收藏、转发）
 * - 获取数据概览（总量、最佳笔记、今日数据）
 * - 支持导出 JSON
 */

import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { NoteStats, DataOverview } from './types';

export class XhsReader {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private userDataDir: string;

  constructor() {
    this.userDataDir = path.join(os.homedir(), '.xhs', 'browser-data-v2');
  }

  private async initBrowser(): Promise<boolean> {
    if (!fs.existsSync(this.userDataDir)) {
      return false;
    }

    this.context = await chromium.launchPersistentContext(this.userDataDir, {
      headless: false,
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'zh-CN',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const pages = this.context.pages();
    this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
    return true;
  }

  /**
   * 读取所有笔记统计数据
   */
  async getNotesStats(): Promise<NoteStats[]> {
    try {
      const initialized = await this.initBrowser();
      if (!initialized || !this.page) {
        throw new Error('未登录，请先运行 xhs login');
      }

      console.log('正在访问笔记管理页面...');
      await this.page.goto('https://creator.xiaohongshu.com/new/note-manager', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 等待笔记列表加载
      await this.page.waitForTimeout(3000);

      // 检查登录状态
      if (this.page.url().includes('login') || this.page.url().includes('passport')) {
        await this.close();
        throw new Error('登录已过期，请先运行 xhs login');
      }

      console.log('正在解析笔记数据...');

      // 滚动加载所有笔记
      await this.scrollToLoadAll();

      // 从 DOM 解析笔记数据
      const notes = await this.parseNotesFromPage();

      await this.close();
      return notes;
    } catch (error) {
      await this.close();
      throw error;
    }
  }

  /**
   * 获取数据概览
   */
  async getOverview(): Promise<DataOverview> {
    const notes = await this.getNotesStats();

    // 筛选今日笔记
    const now = new Date();
    const todayStr = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
    const todayNotes = notes.filter(n => n.publishDate.includes(todayStr));

    const totalViews = notes.reduce((sum, n) => sum + n.views, 0);
    const totalLikes = notes.reduce((sum, n) => sum + n.likes, 0);
    const totalComments = notes.reduce((sum, n) => sum + n.comments, 0);
    const totalCollects = notes.reduce((sum, n) => sum + n.collects, 0);
    const totalShares = notes.reduce((sum, n) => sum + n.shares, 0);

    const bestPerformer = notes.length > 0
      ? notes.reduce((best, n) => n.views > best.views ? n : best, notes[0])
      : null;

    return {
      totalNotes: notes.length,
      totalViews,
      totalLikes,
      totalComments,
      totalCollects,
      totalShares,
      bestPerformer,
      todayNotes,
    };
  }

  /**
   * 滚动页面加载所有笔记
   */
  private async scrollToLoadAll(): Promise<void> {
    if (!this.page) return;

    let prevHeight = 0;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === prevHeight) break;

      prevHeight = currentHeight;
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.page.waitForTimeout(1500);
      attempts++;
    }
  }

  /**
   * 从页面 DOM 解析笔记数据
   *
   * 笔记管理页面结构（已验证）：
   * 每个笔记卡片包含：
   *   - 标题文本
   *   - 发布日期
   *   - 5个统计数据（浏览、点赞、评论、收藏、转发）
   */
  private async parseNotesFromPage(): Promise<NoteStats[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const notes: NoteStats[] = [];

      // 查找所有笔记卡片 - 每个卡片内包含标题、日期和统计数据
      const allElements = document.querySelectorAll('*');
      const noteData: { title: string; date: string; stats: number[] }[] = [];

      // 查找包含"发布于"文本的元素，这是笔记卡片的关键标志
      const dateElements = document.querySelectorAll('*');
      dateElements.forEach(el => {
        const text = el.textContent?.trim() || '';
        if (text.includes('发布于 20') && text.includes('日')) {
          // 这是日期元素，向上找父容器
          const card = el.closest('[class*="item"], [class*="card"], [class*="row"], [class*="note"]');
          if (card) {
            // 从卡片中提取数据
            const titleEl = card.querySelector('[class*="title"], [class*="name"]');
            const title = titleEl?.textContent?.trim() || '';

            // 提取日期
            const dateMatch = text.match(/发布于\s*(\d{4}年\d{1,2}月\d{1,2}日\s*\d{1,2}:\d{2})/);
            const date = dateMatch ? dateMatch[1] : '';

            // 提取统计数字 - 找卡片内所有纯数字文本
            const statNums: number[] = [];
            const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
            let node: Node | null;
            while (node = walker.nextNode()) {
              const num = parseInt(node.textContent?.trim() || '', 10);
              if (!isNaN(num) && node.textContent?.trim() === String(num)) {
                statNums.push(num);
              }
            }

            if (title) {
              noteData.push({ title, date, stats: statNums });
            }
          }
        }
      });

      // 将提取的数据转为 NoteStats
      noteData.forEach(data => {
        notes.push({
          title: data.title,
          publishDate: data.date,
          views: data.stats[0] || 0,
          likes: data.stats[1] || 0,
          comments: data.stats[2] || 0,
          collects: data.stats[3] || 0,
          shares: data.stats[4] || 0,
        });
      });

      return notes;
    });
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close().catch(() => {});
      this.page = null;
    }
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
  }
}

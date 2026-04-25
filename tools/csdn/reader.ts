/**
 * CSDN 数据读取模块
 *
 * 读取博客文章统计数据
 */

import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { BlogStats, DataOverview, WeeklyStats } from './types';

export class CsdnReader {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private userDataDir: string;

  constructor() {
    this.userDataDir = path.join(os.homedir(), '.csdn', 'browser-data');
  }

  private async initBrowser(): Promise<boolean> {
    if (!fs.existsSync(this.userDataDir)) {
      return false;
    }

    this.context = await chromium.launchPersistentContext(this.userDataDir, {
      headless: false,
      viewport: { width: 1280, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'zh-CN',
      args: [
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const pages = this.context.pages();
    this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
    return true;
  }

  /**
   * 获取文章统计数据
   */
  async getBlogStats(): Promise<BlogStats[]> {
    try {
      const initialized = await this.initBrowser();
      if (!initialized || !this.page) {
        return [];
      }

      // 访问管理中心
      await this.page.goto('https://mp.csdn.net/mp_blog/manage/article', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      await this.page.waitForTimeout(3000);

      // 提取文章列表数据
      const stats = await this.page.evaluate(() => {
        const articles: BlogStats[] = [];

        // 尝试从文章列表中提取数据
        const rows = Array.from(document.querySelectorAll('.article-item, .article-row, tr[data-article]'));

        for (const row of rows) {
          const titleEl = row.querySelector('.article-title, .title, td:first-child a');
          const title = titleEl?.textContent?.trim() || '';

          const viewsEl = row.querySelector('.views, [data-views], td:nth-child(2)');
          const views = parseInt(viewsEl?.textContent?.trim() || '0', 10);

          const likesEl = row.querySelector('.likes, [data-likes], td:nth-child(3)');
          const likes = parseInt(likesEl?.textContent?.trim() || '0', 10);

          const commentsEl = row.querySelector('.comments, [data-comments], td:nth-child(4)');
          const comments = parseInt(commentsEl?.textContent?.trim() || '0', 10);

          const collectsEl = row.querySelector('.collects, [data-collects], td:nth-child(5)');
          const collects = parseInt(collectsEl?.textContent?.trim() || '0', 10);

          const sharesEl = row.querySelector('.shares, [data-shares], td:nth-child(6)');
          const shares = parseInt(sharesEl?.textContent?.trim() || '0', 10);

          const urlEl = row.querySelector('a[href*="article"], a[href*="details"]');
          const url = urlEl?.getAttribute('href') || '';

          const dateEl = row.querySelector('.publish-date, .date, td:nth-child(7)');
          const publishDate = dateEl?.textContent?.trim() || '';

          if (title) {
            articles.push({
              title,
              views,
              likes,
              comments,
              collects,
              shares,
              url,
              publishDate
            });
          }
        }

        return articles;
      });

      await this.close();
      return stats;
    } catch (error) {
      await this.close();
      return [];
    }
  }

  /**
   * 获取数据概览
   */
  async getOverview(): Promise<DataOverview> {
    try {
      const initialized = await this.initBrowser();
      if (!initialized || !this.page) {
        return this.getDefaultOverview();
      }

      // 访问数据中心
      await this.page.goto('https://mp.csdn.net/mp_blog/datacenter', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      await this.page.waitForTimeout(3000);

      // 提取概览数据
      const data = await this.page.evaluate(() => {
        // 总览数据
        const totalBlogs = parseInt(
          document.querySelector('.total-articles, [data-total-articles]')?.textContent?.trim() || '0',
          10
        );
        const totalViews = parseInt(
          document.querySelector('.total-views, [data-total-views]')?.textContent?.trim() || '0',
          10
        );
        const totalLikes = parseInt(
          document.querySelector('.total-likes, [data-total-likes]')?.textContent?.trim() || '0',
          10
        );
        const totalComments = parseInt(
          document.querySelector('.total-comments, [data-total-comments]')?.textContent?.trim() || '0',
          10
        );
        const totalCollects = parseInt(
          document.querySelector('.total-collects, [data-total-collects]')?.textContent?.trim() || '0',
          10
        );
        const totalShares = parseInt(
          document.querySelector('.total-shares, [data-total-shares]')?.textContent?.trim() || '0',
          10
        );
        const totalFans = parseInt(
          document.querySelector('.total-fans, [data-total-fans], .fans-count')?.textContent?.trim() || '0',
          10
        );

        // 周数据
        const weeklyViews = parseInt(
          document.querySelector('.weekly-views, [data-weekly-views]')?.textContent?.trim() || '0',
          10
        );
        const weeklyFans = parseInt(
          document.querySelector('.weekly-fans, [data-weekly-fans]')?.textContent?.trim() || '0',
          10
        );
        const weeklyLikes = parseInt(
          document.querySelector('.weekly-likes, [data-weekly-likes]')?.textContent?.trim() || '0',
          10
        );

        // 排名
        const rankingText = document.querySelector('.ranking, [data-ranking]')?.textContent?.trim() || '';
        const ranking = rankingText ? parseInt(rankingText, 10) : undefined;

        return {
          totalBlogs,
          totalViews,
          totalLikes,
          totalComments,
          totalCollects,
          totalShares,
          totalFans,
          weeklyStats: {
            viewsIncrease: weeklyViews,
            fansIncrease: weeklyFans,
            likesIncrease: weeklyLikes,
            ranking
          }
        };
      });

      // 获取文章详情列表
      const blogStats = await this.getBlogStatsFromDataCenter();

      // 计算最佳文章
      const bestPerformer = blogStats.length > 0
        ? blogStats.reduce((best, current) =>
            current.views > best.views ? current : best
          )
        : null;

      // 今日文章
      const today = new Date().toISOString().split('T')[0];
      const todayBlogs = blogStats.filter(blog =>
        blog.publishDate.includes(today) || blog.publishDate.includes('今天')
      );

      await this.close();

      return {
        ...data,
        bestPerformer,
        todayBlogs
      };
    } catch (error) {
      await this.close();
      return this.getDefaultOverview();
    }
  }

  /**
   * 从数据中心获取文章列表
   */
  private async getBlogStatsFromDataCenter(): Promise<BlogStats[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const articles: BlogStats[] = [];

      // 尝试从数据表格中提取
      const rows = Array.from(document.querySelectorAll('.data-row, .article-row, tbody tr'));

      for (const row of rows) {
        const title = row.querySelector('.article-title, td:first-child')?.textContent?.trim() || '';
        const views = parseInt(row.querySelector('.views, td:nth-child(2)')?.textContent?.trim() || '0', 10);
        const likes = parseInt(row.querySelector('.likes, td:nth-child(3)')?.textContent?.trim() || '0', 10);
        const comments = parseInt(row.querySelector('.comments, td:nth-child(4)')?.textContent?.trim() || '0', 10);
        const collects = parseInt(row.querySelector('.collects, td:nth-child(5)')?.textContent?.trim() || '0', 10);
        const url = row.querySelector('a')?.getAttribute('href') || '';
        const publishDate = row.querySelector('.date, td:last-child')?.textContent?.trim() || '';

        if (title) {
          articles.push({ title, views, likes, comments, collects, shares: 0, url, publishDate });
        }
      }

      return articles;
    });
  }

  /**
   * 获取默认概览数据
   */
  private getDefaultOverview(): DataOverview {
    return {
      totalBlogs: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalCollects: 0,
      totalShares: 0,
      totalFans: 0,
      bestPerformer: null,
      todayBlogs: [],
      weeklyStats: {
        viewsIncrease: 0,
        fansIncrease: 0,
        likesIncrease: 0
      }
    };
  }

  /**
   * 关闭浏览器
   */
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
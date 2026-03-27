/**
 * 小红书登录模块
 *
 * 使用 Playwright 持久化上下文实现扫码登录
 */

import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as os from 'os';
import { XhsConfig, LoginResult } from './types';

export class XhsLogin {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: XhsConfig;
  private userDataDir: string;

  constructor(config: XhsConfig) {
    this.config = config;
    this.userDataDir = path.join(os.homedir(), '.xhs', 'browser-data-v2');
  }

  /**
   * 执行扫码登录
   */
  async login(): Promise<LoginResult> {
    try {
      console.log('正在打开浏览器...');

      // 使用持久化上下文，保存完整的浏览器状态
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

      // 获取或创建页面
      const pages = this.context.pages();
      this.page = pages.length > 0 ? pages[0] : await this.context.newPage();

      // 访问创作者中心
      console.log('正在访问创作者中心...');
      await this.page.goto('https://creator.xiaohongshu.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      await this.page.waitForTimeout(2000);

      // 检查是否需要登录
      const currentUrl = this.page.url();
      if (currentUrl.includes('login') || currentUrl.includes('passport')) {
        console.log('请在浏览器中扫码登录...');
        console.log(`等待时间: ${this.config.loginTimeout / 1000} 秒`);

        // 等待登录成功
        try {
          await this.page.waitForURL(/creator\.xiaohongshu\.com\/(?!login)/, {
            timeout: this.config.loginTimeout
          });

          // 额外等待确保状态稳定
          await this.page.waitForTimeout(3000);

          console.log('✅ 登录成功！');
        } catch {
          await this.close();
          return { success: false, message: '登录超时，请重试' };
        }
      } else {
        console.log('✅ 已登录！');
      }

      // 提取用户信息
      let userId: string | undefined;
      try {
        const cookies = await this.context.cookies();
        const userCookie = cookies.find(c => c.name === 'webId');
        if (userCookie) {
          userId = userCookie.value;
        }
      } catch {
        // 忽略
      }

      await this.close();

      return {
        success: true,
        message: '登录成功，浏览器状态已保存',
        userId
      };
    } catch (error) {
      await this.close();
      return {
        success: false,
        message: `登录失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
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
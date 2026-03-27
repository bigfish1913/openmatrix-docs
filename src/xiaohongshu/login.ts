/**
 * 小红书登录模块
 *
 * 使用 Playwright 实现扫码登录
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { CookieStore } from './store';
import { XhsConfig, LoginResult } from './types';

export class XhsLogin {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private cookieStore: CookieStore;
  private config: XhsConfig;

  constructor(config: XhsConfig, cookieStore: CookieStore) {
    this.config = config;
    this.cookieStore = cookieStore;
  }

  /**
   * 初始化浏览器
   */
  private async initBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false, // 显示浏览器窗口供用户扫码
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    // 尝试加载已有的 Cookie
    const savedData = await this.cookieStore.loadCookies();

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'zh-CN'
    });

    // 如果有保存的 Cookie，先加载
    if (savedData && savedData.cookies.length > 0) {
      await this.context.addCookies(savedData.cookies);
    }

    this.page = await this.context.newPage();
  }

  /**
   * 执行扫码登录
   */
  async login(): Promise<LoginResult> {
    try {
      await this.initBrowser();

      if (!this.page) {
        return { success: false, message: '浏览器初始化失败' };
      }

      // 访问小红书登录页
      console.log('正在打开小红书登录页面...');
      await this.page.goto('https://www.xiaohongshu.com/', {
        waitUntil: 'networkidle'
      });

      // 检查是否已登录
      const isLoggedIn = await this.checkLoginStatus();
      if (isLoggedIn) {
        console.log('检测到已登录状态，正在保存 Cookie...');
        const result = await this.saveCurrentSession();
        await this.close();
        return result;
      }

      // 等待用户扫码登录
      console.log('请在浏览器中扫码登录...');
      console.log(`等待时间: ${this.config.loginTimeout / 1000} 秒`);

      // 等待登录成功（检测页面变化）
      const loginSuccess = await this.waitForLogin();

      if (loginSuccess) {
        const result = await this.saveCurrentSession();
        await this.close();
        return result;
      } else {
        await this.close();
        return { success: false, message: '登录超时，请重试' };
      }
    } catch (error) {
      await this.close();
      return {
        success: false,
        message: `登录失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 检查当前登录状态
   */
  private async checkLoginStatus(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // 检查是否存在登录后才有的元素
      const userAvatar = await this.page.$('.user-avatar, .avatar-wrapper, [class*="avatar"]');
      return userAvatar !== null;
    } catch {
      return false;
    }
  }

  /**
   * 等待用户完成登录
   */
  private async waitForLogin(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // 等待登录成功的标志（URL 变化或特定元素出现）
      await this.page.waitForURL(/xiaohongshu\.com/, {
        timeout: this.config.loginTimeout
      });

      // 等待用户头像出现（登录成功的标志）
      await this.page.waitForSelector('.user-avatar, .avatar-wrapper, [class*="avatar"]', {
        timeout: this.config.loginTimeout
      });

      // 额外等待确保 Cookie 设置完成
      await this.page.waitForTimeout(2000);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 保存当前会话
   */
  private async saveCurrentSession(): Promise<LoginResult> {
    if (!this.context) {
      return { success: false, message: '无法获取浏览器上下文' };
    }

    const cookies = await this.context.cookies();

    // 提取用户信息
    let userId: string | undefined;
    let username: string | undefined;

    // 从 Cookie 中提取用户信息
    const userInfoCookie = cookies.find(c => c.name === 'customer-sso-sig');
    if (userInfoCookie) {
      try {
        const decoded = decodeURIComponent(userInfoCookie.value);
        const match = decoded.match(/"userId":"(\w+)"/);
        if (match) {
          userId = match[1];
        }
      } catch {
        // 忽略解析错误
      }
    }

    // 保存 Cookie
    await this.cookieStore.saveCookies(cookies, userId, username);

    console.log('✅ Cookie 已保存');

    return {
      success: true,
      message: '登录成功，Cookie 已保存',
      userId,
      username
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
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}
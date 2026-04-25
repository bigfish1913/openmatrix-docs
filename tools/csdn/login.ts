/**
 * CSDN 登录模块
 *
 * 使用 Playwright 持久化上下文实现登录
 * 支持扫码登录和账号密码登录
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// document 和 window 在 page.evaluate 回调中可用，TypeScript 无法识别

import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as os from 'os';
import { CsdnConfig, LoginResult } from './types';

export class CsdnLogin {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: CsdnConfig;
  private userDataDir: string;

  constructor(config: CsdnConfig) {
    this.config = config;
    this.userDataDir = path.join(os.homedir(), '.csdn', 'browser-data');
  }

  /**
   * 执行登录（优先扫码）
   */
  async login(): Promise<LoginResult> {
    try {
      console.log('正在打开浏览器...');

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

      console.log('正在访问 CSDN...');
      await this.page.goto('https://www.csdn.net/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      await this.page.waitForTimeout(2000);

      // 检查是否已登录
      const isLoggedIn = await this.checkLoginStatus();

      if (!isLoggedIn) {
        console.log('请在浏览器中登录（支持扫码或账号密码）...');
        console.log(`等待时间: ${this.config.loginTimeout / 1000} 秒`);

        // 等待登录成功
        try {
          await this.page.waitForFunction(
            () => {
              // 检查是否出现用户头像或用户名
              const userAvatar = document.querySelector('.avatar, .user-avatar, img[data-report-click*="avatar"]');
              const userName = document.querySelector('.username, .user-name, .nickname');
              const loginBtn = document.querySelector('.login-btn, .btn-login');
              return (userAvatar || userName) && !loginBtn?.textContent?.includes('登录');
            },
            { timeout: this.config.loginTimeout }
          );

          await this.page.waitForTimeout(3000);
          console.log('登录成功！');
        } catch {
          await this.close();
          return { success: false, message: '登录超时，请重试' };
        }
      } else {
        console.log('已登录！');
      }

      // 提取用户信息
      const userInfo = await this.extractUserInfo();

      await this.close();

      return {
        success: true,
        message: '登录成功，浏览器状态已保存',
        userId: userInfo.userId,
        username: userInfo.username
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
   * 检查登录状态
   */
  private async checkLoginStatus(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // 检查页面是否有登录按钮（未登录状态）
      const loginBtn = await this.page.$('text=登录');
      if (loginBtn) {
        // 点击登录按钮打开登录弹窗
        await loginBtn.click();
        await this.page.waitForTimeout(2000);
        return false;
      }

      // 检查是否有用户头像（已登录状态）
      const userAvatar = await this.page.$('.avatar, .user-avatar, img[class*="avatar"]');
      return !!userAvatar;
    } catch {
      return false;
    }
  }

  /**
   * 提取用户信息
   */
  private async extractUserInfo(): Promise<{ userId?: string; username?: string }> {
    if (!this.page) return {};

    try {
      // 尝试从页面提取用户名
      const username = await this.page.evaluate(() => {
        const el = document.querySelector('.username, .user-name, .nickname, [class*="username"]');
        return el?.textContent?.trim() || '';
      });

      // 尝试从 cookies 提取用户 ID
      const cookies = await this.context!.cookies();
      const uuidCookie = cookies.find(c => c.name === 'uuid_tt_dd');
      const userId = uuidCookie?.value;

      return { userId, username };
    } catch {
      return {};
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
/**
 * 小红书自动发帖主入口
 */

import * as path from 'path';
import * as os from 'os';
import { XhsConfig, PostContent, LoginResult, PostResult, SessionStatus } from './types';
import { CookieStore } from './store';
import { XhsLogin } from './login';
import { XhsPoster } from './poster';

export class Xiaohongshu {
  private config: XhsConfig;
  private cookieStore: CookieStore;
  private loginModule: XhsLogin;
  private posterModule: XhsPoster;

  constructor(customConfig?: Partial<XhsConfig>) {
    // 默认配置
    this.config = {
      cookiePath: customConfig?.cookiePath ||
        path.join(os.homedir(), '.xhs', 'cookies.json'),
      loginTimeout: customConfig?.loginTimeout || 180000, // 3分钟
      maxRetries: customConfig?.maxRetries || 3,
      ...customConfig
    };

    this.cookieStore = new CookieStore(this.config);
    this.loginModule = new XhsLogin(this.config, this.cookieStore);
    this.posterModule = new XhsPoster(this.config, this.cookieStore);
  }

  /**
   * 执行登录
   */
  async login(): Promise<LoginResult> {
    return this.loginModule.login();
  }

  /**
   * 发布笔记
   */
  async post(content: PostContent): Promise<PostResult> {
    return this.posterModule.post(content);
  }

  /**
   * 获取会话状态
   */
  async getStatus(): Promise<SessionStatus> {
    return this.cookieStore.getCookieStatus();
  }

  /**
   * 登出（清除 Cookie）
   */
  async logout(): Promise<void> {
    await this.cookieStore.clearCookies();
    console.log('✅ 已清除登录信息');
  }
}

// 导出所有模块
export * from './types';
export * from './store';
export * from './login';
export * from './poster';
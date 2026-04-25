/**
 * CSDN 自动推广主入口
 */

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import {
  CsdnConfig,
  BlogContent,
  LoginResult,
  PostResult,
  SessionStatus,
  BlogStats,
  DataOverview
} from './types';
import { CsdnLogin } from './login';
import { CsdnPoster } from './poster';
import { CsdnReader } from './reader';

export class CSDN {
  private config: CsdnConfig;
  private loginModule: CsdnLogin;
  private posterModule: CsdnPoster;
  private readerModule: CsdnReader;
  private userDataDir: string;

  constructor(customConfig?: Partial<CsdnConfig>) {
    this.config = {
      cookiePath: customConfig?.cookiePath ||
        path.join(os.homedir(), '.csdn', 'cookies.json'),
      loginTimeout: customConfig?.loginTimeout || 180000,
      maxRetries: customConfig?.maxRetries || 3,
      ...customConfig
    };

    this.userDataDir = path.join(os.homedir(), '.csdn', 'browser-data');
    this.loginModule = new CsdnLogin(this.config);
    this.posterModule = new CsdnPoster(this.config);
    this.readerModule = new CsdnReader();
  }

  /**
   * 执行登录
   */
  async login(): Promise<LoginResult> {
    return this.loginModule.login();
  }

  /**
   * 发布博客文章
   */
  async post(content: BlogContent): Promise<PostResult> {
    return this.posterModule.post(content);
  }

  /**
   * 获取文章统计数据
   */
  async getBlogStats(): Promise<BlogStats[]> {
    return this.readerModule.getBlogStats();
  }

  /**
   * 获取数据概览
   */
  async getOverview(): Promise<DataOverview> {
    return this.readerModule.getOverview();
  }

  /**
   * 获取会话状态
   */
  async getStatus(): Promise<SessionStatus> {
    if (!fs.existsSync(this.userDataDir)) {
      return { isLoggedIn: false };
    }

    try {
      const files = fs.readdirSync(this.userDataDir);
      if (files.length === 0) {
        return { isLoggedIn: false };
      }

      const stats = fs.statSync(this.userDataDir);

      return {
        isLoggedIn: true,
        lastLogin: stats.mtime
      };
    } catch {
      return { isLoggedIn: false };
    }
  }

  /**
   * 登出（清除浏览器数据）
   */
  async logout(): Promise<void> {
    if (fs.existsSync(this.userDataDir)) {
      fs.rmSync(this.userDataDir, { recursive: true, force: true });
    }

    // 清除内容库
    const contentLibPath = path.join(os.homedir(), '.csdn', 'content-library.json');
    if (fs.existsSync(contentLibPath)) {
      fs.unlinkSync(contentLibPath);
    }

    console.log('已清除登录信息');
  }
}

// 导出所有模块
export * from './types';
export * from './login';
export * from './poster';
export * from './reader';
export * from './store';
export * from './scheduler';
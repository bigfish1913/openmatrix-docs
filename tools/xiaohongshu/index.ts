/**
 * 小红书自动发帖主入口
 */

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { XhsConfig, PostContent, LoginResult, PostResult, SessionStatus, NoteStats, DataOverview } from './types';
import { XhsLogin } from './login';
import { XhsPoster } from './poster';
import { XhsReader } from './reader';

export class Xiaohongshu {
  private config: XhsConfig;
  private loginModule: XhsLogin;
  private posterModule: XhsPoster;
  private readerModule: XhsReader;
  private userDataDir: string;

  constructor(customConfig?: Partial<XhsConfig>) {
    this.config = {
      cookiePath: customConfig?.cookiePath ||
        path.join(os.homedir(), '.xhs', 'cookies.json'),
      loginTimeout: customConfig?.loginTimeout || 180000,
      maxRetries: customConfig?.maxRetries || 3,
      ...customConfig
    };

    this.userDataDir = path.join(os.homedir(), '.xhs', 'browser-data-v2');
    this.loginModule = new XhsLogin(this.config);
    this.posterModule = new XhsPoster(this.config);
    this.readerModule = new XhsReader();
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
   * 获取笔记数据
   */
  async getNotesStats(): Promise<NoteStats[]> {
    return this.readerModule.getNotesStats();
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
    console.log('已清除登录信息');
  }
}

// 导出所有模块
export * from './types';
export * from './login';
export * from './poster';
export * from './reader';

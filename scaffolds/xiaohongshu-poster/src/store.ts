/**
 * Cookie 存储管理
 *
 * 安全地存储和读取小红书登录 Cookie
 */

import * as fs from 'fs';
import * as path from 'path';
import { XhsConfig, SessionStatus } from './types';

export class CookieStore {
  private config: XhsConfig;

  constructor(config: XhsConfig) {
    this.config = config;
    this.ensureStoreDirectory();
  }

  /**
   * 确保存储目录存在
   */
  private ensureStoreDirectory(): void {
    const dir = path.dirname(this.config.cookiePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 保存 Cookie 到本地
   */
  async saveCookies(cookies: any[], userId?: string, username?: string): Promise<void> {
    const data = {
      cookies,
      metadata: {
        userId,
        username,
        savedAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    fs.writeFileSync(
      this.config.cookiePath,
      JSON.stringify(data, null, 2),
      { encoding: 'utf-8', mode: 0o600 } // 仅所有者可读写
    );
  }

  /**
   * 读取本地 Cookie
   */
  async loadCookies(): Promise<{ cookies: any[]; metadata: any } | null> {
    if (!fs.existsSync(this.config.cookiePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.config.cookiePath, 'utf-8');
      const data = JSON.parse(content);
      return {
        cookies: data.cookies || [],
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('读取 Cookie 失败:', error);
      return null;
    }
  }

  /**
   * 检查 Cookie 是否有效
   */
  async getCookieStatus(): Promise<SessionStatus> {
    const data = await this.loadCookies();

    if (!data || !data.cookies || data.cookies.length === 0) {
      return { isLoggedIn: false };
    }

    const { metadata } = data;

    // 检查关键 Cookie 是否存在
    const hasAuthCookie = data.cookies.some(
      (c: any) => c.name === 'web_session' || c.name === 'webId'
    );

    if (!hasAuthCookie) {
      return { isLoggedIn: false };
    }

    // 检查 Cookie 过期时间
    const expiryDate = data.cookies.reduce((latest: Date | null, cookie: any) => {
      if (cookie.expires && cookie.expires !== -1) {
        const expires = new Date(cookie.expires * 1000);
        if (!latest || expires > latest) {
          return expires;
        }
      }
      return latest;
    }, null);

    const now = new Date();
    const isExpired = expiryDate && expiryDate < now;

    return {
      isLoggedIn: !isExpired,
      userId: metadata.userId,
      username: metadata.username,
      lastLogin: metadata.savedAt ? new Date(metadata.savedAt) : undefined,
      cookieExpiry: expiryDate || undefined
    };
  }

  /**
   * 清除本地 Cookie
   */
  async clearCookies(): Promise<void> {
    if (fs.existsSync(this.config.cookiePath)) {
      fs.unlinkSync(this.config.cookiePath);
    }
  }
}
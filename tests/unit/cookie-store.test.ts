/**
 * Cookie 存储模块测试
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CookieStore } from '../../src/xiaohongshu/store';
import { XhsConfig } from '../../src/xiaohongshu/types';

describe('CookieStore', () => {
  let store: CookieStore;
  let testCookiePath: string;
  let testConfig: XhsConfig;

  beforeEach(() => {
    // 使用临时目录
    testCookiePath = path.join(os.tmpdir(), `xhs-test-${Date.now()}`, 'cookies.json');
    testConfig = {
      cookiePath: testCookiePath,
      loginTimeout: 180000,
      maxRetries: 3
    };
    store = new CookieStore(testConfig);
  });

  afterEach(() => {
    // 清理测试文件
    const dir = path.dirname(testCookiePath);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('saveCookies', () => {
    it('应该成功保存 Cookie 到文件', async () => {
      const cookies = [
        { name: 'web_session', value: 'test-value', domain: '.xiaohongshu.com' }
      ];

      await store.saveCookies(cookies, 'user123', 'testuser');

      expect(fs.existsSync(testCookiePath)).toBe(true);

      const content = fs.readFileSync(testCookiePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.cookies).toHaveLength(1);
      expect(data.cookies[0].name).toBe('web_session');
      expect(data.metadata.userId).toBe('user123');
      expect(data.metadata.username).toBe('testuser');
    });

    it('应该创建不存在的目录', async () => {
      const cookies = [{ name: 'test', value: 'value', domain: '.example.com' }];

      await store.saveCookies(cookies);

      expect(fs.existsSync(path.dirname(testCookiePath))).toBe(true);
    });
  });

  describe('loadCookies', () => {
    it('文件不存在时应该返回 null', async () => {
      const result = await store.loadCookies();

      expect(result).toBeNull();
    });

    it('应该正确加载已保存的 Cookie', async () => {
      const cookies = [
        { name: 'web_session', value: 'test-value', domain: '.xiaohongshu.com' }
      ];
      await store.saveCookies(cookies, 'user123');

      const result = await store.loadCookies();

      expect(result).not.toBeNull();
      expect(result!.cookies).toHaveLength(1);
      expect(result!.metadata.userId).toBe('user123');
    });

    it('无效 JSON 文件应该返回 null', async () => {
      // 创建无效文件
      fs.mkdirSync(path.dirname(testCookiePath), { recursive: true });
      fs.writeFileSync(testCookiePath, 'invalid json');

      const result = await store.loadCookies();

      expect(result).toBeNull();
    });
  });

  describe('getCookieStatus', () => {
    it('没有 Cookie 时应该返回未登录状态', async () => {
      const status = await store.getCookieStatus();

      expect(status.isLoggedIn).toBe(false);
    });

    it('有效的 Cookie 应该返回登录状态', async () => {
      const cookies = [
        { name: 'web_session', value: 'test', domain: '.xiaohongshu.com', expires: -1 }
      ];
      await store.saveCookies(cookies);

      const status = await store.getCookieStatus();

      expect(status.isLoggedIn).toBe(true);
    });

    it('过期的 Cookie 应该返回未登录状态', async () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1小时前
      const cookies = [
        { name: 'web_session', value: 'test', domain: '.xiaohongshu.com', expires: pastTimestamp }
      ];
      await store.saveCookies(cookies);

      const status = await store.getCookieStatus();

      expect(status.isLoggedIn).toBe(false);
    });
  });

  describe('clearCookies', () => {
    it('应该删除 Cookie 文件', async () => {
      await store.saveCookies([{ name: 'test', value: 'value', domain: '.example.com' }]);
      expect(fs.existsSync(testCookiePath)).toBe(true);

      await store.clearCookies();

      expect(fs.existsSync(testCookiePath)).toBe(false);
    });

    it('文件不存在时应该不报错', async () => {
      await expect(store.clearCookies()).resolves.not.toThrow();
    });
  });
});
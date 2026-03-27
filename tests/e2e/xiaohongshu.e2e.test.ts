/**
 * 小红书自动发帖 E2E 测试
 *
 * 注意: 这些测试需要真实的浏览器和可能的登录状态
 * 运行前请确保:
 * 1. 已安装 playwright 浏览器: npx playwright install chromium
 * 2. 已设置测试账号环境变量 (可选)
 */

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { Xiaohongshu } from '../../src/xiaohongshu';

describe('Xiaohongshu E2E', () => {
  let xhs: Xiaohongshu;
  let testCookiePath: string;

  beforeAll(() => {
    // 使用临时目录
    testCookiePath = path.join(os.tmpdir(), `xhs-e2e-test-${Date.now()}`, 'cookies.json');
    xhs = new Xiaohongshu({
      cookiePath: testCookiePath,
      loginTimeout: 60000,
      maxRetries: 1
    });
  });

  afterAll(() => {
    // 清理测试文件
    const dir = path.dirname(testCookiePath);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('状态检查', () => {
    it('未登录时应该返回未登录状态', async () => {
      const status = await xhs.getStatus();

      expect(status.isLoggedIn).toBe(false);
    });
  });

  describe('登录流程', () => {
    it.skip('应该成功打开登录页面 (需要人工扫码)', async () => {
      // 这个测试需要人工参与
      // 运行时会打开浏览器窗口等待扫码
      const result = await xhs.login();

      expect(result.success).toBe(true);
    });
  });

  describe('发布流程', () => {
    it('未登录时发布应该返回错误', async () => {
      const result = await xhs.post({
        title: '测试标题',
        content: '测试内容',
        images: []
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('未登录');
    });

    it.skip('登录后应该能发布笔记 (需要先登录)', async () => {
      // 这个测试需要先登录
      // 创建测试图片
      const testImagePath = path.join(os.tmpdir(), 'test-image.jpg');
      fs.writeFileSync(testImagePath, Buffer.from('fake image content'));

      try {
        const result = await xhs.post({
          title: '自动化测试笔记',
          content: '这是一条自动化测试笔记，请勿在意',
          images: [testImagePath],
          tags: ['测试']
        });

        expect(result.success).toBe(true);
      } finally {
        fs.unlinkSync(testImagePath);
      }
    });
  });

  describe('登出流程', () => {
    it('应该成功清除登录信息', async () => {
      await xhs.logout();

      const status = await xhs.getStatus();
      expect(status.isLoggedIn).toBe(false);
    });
  });
});
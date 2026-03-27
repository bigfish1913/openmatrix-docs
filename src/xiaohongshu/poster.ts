/**
 * 小红书发帖模块
 *
 * 自动发布图文笔记
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { CookieStore } from './store';
import { XhsConfig, PostContent, PostResult } from './types';

export class XhsPoster {
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
   * 初始化浏览器并加载 Cookie
   */
  private async initBrowser(): Promise<boolean> {
    // 加载保存的 Cookie
    const savedData = await this.cookieStore.loadCookies();
    if (!savedData || savedData.cookies.length === 0) {
      return false;
    }

    this.browser = await chromium.launch({
      headless: true, // 发帖时使用无头模式
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'zh-CN'
    });

    // 加载 Cookie
    await this.context.addCookies(savedData.cookies);

    this.page = await this.context.newPage();
    return true;
  }

  /**
   * 发布笔记
   */
  async post(content: PostContent): Promise<PostResult> {
    let retries = 0;

    while (retries < this.config.maxRetries) {
      try {
        const initialized = await this.initBrowser();
        if (!initialized) {
          return { success: false, message: '未登录或 Cookie 已过期，请先运行登录命令' };
        }

        if (!this.page) {
          return { success: false, message: '浏览器初始化失败' };
        }

        // 访问创作中心
        console.log('正在访问创作中心...');
        await this.page.goto('https://creator.xiaohongshu.com/publish/publish', {
          waitUntil: 'networkidle'
        });

        // 检查是否跳转到登录页
        if (this.page.url().includes('login')) {
          await this.close();
          return { success: false, message: '登录已过期，请重新登录' };
        }

        // 上传图片
        if (content.images && content.images.length > 0) {
          await this.uploadImages(content.images);
        }

        // 填写标题
        console.log('填写标题...');
        await this.page.waitForSelector('input[placeholder*="标题"], input[placeholder*="填写标题"]', {
          timeout: 10000
        });
        await this.page.fill('input[placeholder*="标题"], input[placeholder*="填写标题"]', content.title);

        // 填写正文
        console.log('填写正文...');
        await this.page.waitForSelector('#post-textarea, [contenteditable="true"]', {
          timeout: 10000
        });
        await this.page.fill('#post-textarea', content.content);

        // 添加话题标签
        if (content.tags && content.tags.length > 0) {
          await this.addTags(content.tags);
        }

        // 等待一下让内容稳定
        await this.page.waitForTimeout(1000);

        // 点击发布按钮
        console.log('发布中...');
        const publishBtn = await this.page.waitForSelector(
          'button:has-text("发布"), button:has-text("立即发布")',
          { timeout: 10000 }
        );
        await publishBtn.click();

        // 等待发布成功
        const result = await this.waitForPublishResult();

        await this.close();
        return result;
      } catch (error) {
        retries++;
        console.error(`发布失败 (尝试 ${retries}/${this.config.maxRetries}):`, error);

        if (retries < this.config.maxRetries) {
          await this.close();
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          await this.close();
          return {
            success: false,
            message: `发布失败: ${error instanceof Error ? error.message : '未知错误'}`
          };
        }
      }
    }

    return { success: false, message: '发布失败，已达到最大重试次数' };
  }

  /**
   * 上传图片
   */
  private async uploadImages(imagePaths: string[]): Promise<void> {
    if (!this.page) return;

    console.log(`上传 ${imagePaths.length} 张图片...`);

    // 点击上传按钮或拖拽区域
    const uploadBtn = await this.page.waitForSelector(
      'input[type="file"], .upload-input, [class*="upload"]',
      { timeout: 10000 }
    );

    // 处理文件输入
    const inputElement = await this.page.$('input[type="file"]');
    if (inputElement) {
      // 转换为绝对路径
      const absolutePaths = imagePaths.map(p =>
        path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)
      );

      // 验证文件存在
      for (const imgPath of absolutePaths) {
        if (!fs.existsSync(imgPath)) {
          throw new Error(`图片不存在: ${imgPath}`);
        }
      }

      await inputElement.setInputFiles(absolutePaths);

      // 等待上传完成
      await this.page.waitForTimeout(3000);

      console.log('图片上传完成');
    }
  }

  /**
   * 添加话题标签
   */
  private async addTags(tags: string[]): Promise<void> {
    if (!this.page) return;

    console.log(`添加 ${tags.length} 个话题标签...`);

    for (const tag of tags) {
      try {
        // 输入 # 触发话题选择
        await this.page.type('#post-textarea', ` #${tag}`);

        // 等待话题选择面板出现
        await this.page.waitForTimeout(500);

        // 点击匹配的话题
        const tagOption = await this.page.$(`text=/${tag}/`);
        if (tagOption) {
          await tagOption.click();
        }
      } catch {
        console.log(`话题 "${tag}" 添加失败，跳过`);
      }
    }
  }

  /**
   * 等待发布结果
   */
  private async waitForPublishResult(): Promise<PostResult> {
    if (!this.page) {
      return { success: false, message: '页面不存在' };
    }

    try {
      // 等待成功提示或错误提示
      await this.page.waitForSelector(
        'text=发布成功, text=已发布, text=审核中, .success, [class*="success"]',
        { timeout: 30000 }
      );

      // 尝试获取笔记链接
      let postUrl: string | undefined;
      try {
        const link = await this.page.$('a[href*="/explore/"], a[href*="/discovery/item/"]');
        if (link) {
          postUrl = await link.getAttribute('href') || undefined;
        }
      } catch {
        // 忽略获取链接失败
      }

      console.log('✅ 发布成功！');

      return {
        success: true,
        message: '发布成功，等待审核',
        postUrl
      };
    } catch {
      // 检查是否有错误提示
      const errorElement = await this.page.$('.error, [class*="error"], text=发布失败');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        return { success: false, message: `发布失败: ${errorText || '未知错误'}` };
      }

      return { success: true, message: '发布请求已提交，请检查创作者中心确认状态' };
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
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}
/**
 * 小红书发帖模块 - 改进版
 *
 * 支持：
 * - 上传本地图片
 * - 使用小红书文字配图功能
 */

import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { XhsConfig, PostContent, PostResult } from './types';

export class XhsPoster {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: XhsConfig;
  private userDataDir: string;

  constructor(config: XhsConfig) {
    this.config = config;
    this.userDataDir = path.join(os.homedir(), '.xhs', 'browser-data-v2');
  }

  private async initBrowser(): Promise<boolean> {
    if (!fs.existsSync(this.userDataDir)) {
      return false;
    }

    this.context = await chromium.launchPersistentContext(this.userDataDir, {
      headless: false,
      viewport: { width: 1280, height: 800 },
      locale: 'zh-CN',
      args: ['--disable-blink-features=AutomationControlled']
    });

    const pages = this.context.pages();
    this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
    return true;
  }

  async post(content: PostContent): Promise<PostResult> {
    try {
      const initialized = await this.initBrowser();
      if (!initialized) {
        return { success: false, message: '未登录，请先运行登录命令' };
      }

      if (!this.page) {
        return { success: false, message: '浏览器初始化失败' };
      }

      console.log('正在访问创作者中心...');
      await this.page.goto('https://creator.xiaohongshu.com/publish/publish', {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // 检查登录状态
      if (this.page.url().includes('login')) {
        await this.close();
        return { success: false, message: '需要重新登录' };
      }

      console.log('等待编辑器加载...');
      await this.page.waitForTimeout(3000);

      // 处理图片
      if (content.useTextToImage) {
        // 使用小红书文字配图
        await this.useTextToImage(content.imagePrompt || content.title);
      } else if (content.images && content.images.length > 0) {
        // 上传本地图片
        await this.uploadImages(content.images);
      }

      // 等待图片处理
      await this.page.waitForTimeout(2000);

      // 填写标题
      console.log('填写标题...');
      const titleInput = await this.page.$('input[placeholder*="标题"], input[placeholder*="填写标题"]');
      if (titleInput) {
        await titleInput.fill(content.title);
      }

      // 填写正文
      console.log('填写正文...');
      const contentArea = await this.page.$('#post-textarea, div[contenteditable="true"], .content-input');
      if (contentArea) {
        await contentArea.click();
        await this.page.keyboard.type(content.content, { delay: 30 });
      }

      // 添加标签
      if (content.tags && content.tags.length > 0) {
        for (const tag of content.tags) {
          await this.page.keyboard.type(` #${tag}`, { delay: 30 });
          await this.page.waitForTimeout(300);
        }
      }

      await this.page.waitForTimeout(1000);

      // 发布
      console.log('发布中...');
      const publishBtn = await this.page.$('button:has-text("发布")');
      if (publishBtn) {
        await publishBtn.click();
      } else {
        await this.page.keyboard.press('Control+Enter');
      }

      // 等待结果
      await this.page.waitForTimeout(5000);

      // 检查是否发布成功
      const currentUrl = this.page.url();
      if (currentUrl.includes('published=true')) {
        console.log('✅ 发布成功！');
        await this.close();
        return { success: true, message: '发布成功' };
      }

      console.log('✅ 发布请求已提交！');
      await this.close();

      return { success: true, message: '发布请求已提交，请检查创作者中心' };
    } catch (error) {
      await this.close();
      return {
        success: false,
        message: `发布失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 使用小红书文字配图功能
   */
  private async useTextToImage(prompt: string): Promise<void> {
    if (!this.page) return;

    console.log('使用文字配图功能...');

    // 点击"文字配图"按钮
    const textToImageBtn = await this.page.$('button:has-text("文字配图"), text=文字配图');
    if (textToImageBtn) {
      await textToImageBtn.click();
      await this.page.waitForTimeout(1000);

      // 输入提示词
      const promptInput = await this.page.$('textarea, input[placeholder*="描述"], input[placeholder*="输入"]');
      if (promptInput) {
        await promptInput.fill(prompt);
        await this.page.waitForTimeout(500);

        // 点击生成按钮
        const generateBtn = await this.page.$('button:has-text("生成"), button:has-text("确定")');
        if (generateBtn) {
          await generateBtn.click();
          console.log('等待图片生成...');
          await this.page.waitForTimeout(5000); // 等待AI生成图片
        }
      }
    } else {
      console.log('未找到文字配图按钮，跳过');
    }
  }

  private async uploadImages(imagePaths: string[]): Promise<void> {
    if (!this.page) return;

    console.log(`上传 ${imagePaths.length} 张图片...`);

    const inputElement = await this.page.$('input[type="file"]');
    if (inputElement) {
      const absolutePaths = imagePaths.map(p =>
        path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)
      );

      for (const imgPath of absolutePaths) {
        if (!fs.existsSync(imgPath)) {
          throw new Error(`图片不存在: ${imgPath}`);
        }
      }

      await inputElement.setInputFiles(absolutePaths);
      await this.page.waitForTimeout(3000);
      console.log('图片上传完成');
    }
  }

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
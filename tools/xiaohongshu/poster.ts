/**
 * 小红书发帖模块 - 基于实际 UI 流程验证
 *
 * 实际流程：
 * 1. 打开发布页面（上传图文模式）
 * 2. 点击"文字配图"
 * 3. 输入配图文字 → 生成图片
 * 4. 选择卡片风格 → 下一步
 * 5. 填写标题（20字以内）和正文
 * 6. 点击发布
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
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'zh-CN',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const pages = this.context.pages();
    this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
    return true;
  }

  /**
   * 发布笔记
   */
  async post(content: PostContent): Promise<PostResult> {
    try {
      const initialized = await this.initBrowser();
      if (!initialized) {
        return { success: false, message: '未登录，请先运行 xhs login' };
      }

      if (!this.page) {
        return { success: false, message: '浏览器初始化失败' };
      }

      // 标题长度检查
      if (content.title.length > 20) {
        await this.close();
        return { success: false, message: `标题超过20字限制（当前${content.title.length}字）：${content.title}` };
      }

      // Step 1: 打开发布页面（直接进入图文模式）
      console.log('正在打开发布页面...');
      await this.page.goto('https://creator.xiaohongshu.com/publish/publish?from=menu&target=image', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      await this.page.waitForTimeout(2000);

      // 检查登录状态
      if (this.page.url().includes('login') || this.page.url().includes('passport')) {
        await this.close();
        return { success: false, message: '登录已过期，请先运行 xhs login' };
      }

      if (content.useTextToImage) {
        // Step 2-4: 文字配图流程
        const imageResult = await this.generateTextImage(content.imagePrompt || content.title);
        if (!imageResult) {
          await this.close();
          return { success: false, message: '文字配图生成失败' };
        }
      } else if (content.images && content.images.length > 0) {
        // 上传本地图片
        await this.uploadImages(content.images);
      } else {
        // 默认使用文字配图
        const imageResult = await this.generateTextImage(content.imagePrompt || content.title);
        if (!imageResult) {
          await this.close();
          return { success: false, message: '文字配图生成失败' };
        }
      }

      // Step 5: 填写标题
      console.log('填写标题...');
      const titleInput = await this.page.$('input[placeholder*="标题"], input[placeholder*="填写标题"]');
      if (titleInput) {
        await titleInput.fill(content.title);
      } else {
        console.log('未找到标题输入框，尝试其他选择器...');
        // 在编辑页面中，标题可能有不同的选择器
        await this.page.evaluate((title: string) => {
          const inputs = document.querySelectorAll('input[type="text"]');
          for (const input of inputs) {
            if (input.getAttribute('placeholder')?.includes('标题')) {
              (input as HTMLInputElement).value = title;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              break;
            }
          }
        }, content.title);
      }

      // Step 6: 填写正文 - 使用 innerHTML 设置，支持换行
      console.log('填写正文...');
      await this.setContent(content.content, content.tags);

      await this.page.waitForTimeout(1000);

      // Step 7: 点击发布
      console.log('发布中...');
      const publishBtn = await this.page.$('button:has-text("发布")');
      if (publishBtn) {
        await publishBtn.click();
      } else {
        // 备用：用 JS 点击
        await this.page.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.textContent?.includes('发布')) {
              (btn as HTMLElement).click();
              break;
            }
          }
        });
      }

      // 等待发布结果
      await this.page.waitForTimeout(5000);

      const currentUrl = this.page.url();
      if (currentUrl.includes('published=true') || currentUrl.includes('success')) {
        console.log('发布成功！');
        await this.close();
        return { success: true, message: '发布成功' };
      }

      console.log('发布请求已提交');
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
   * 文字配图流程
   */
  private async generateTextImage(prompt: string): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Step 2: 点击"文字配图"按钮
      console.log('使用文字配图功能...');

      // 先确保在上传图文模式下
      const imageTab = await this.page.$('text=上传图文');
      if (imageTab) {
        await imageTab.click();
        await this.page.waitForTimeout(1000);
      }

      // 点击文字配图按钮
      const textToImageBtn = await this.page.$('button:has-text("文字配图")');
      if (!textToImageBtn) {
        console.log('未找到文字配图按钮');
        return false;
      }
      await textToImageBtn.click();
      await this.page.waitForTimeout(1500);

      // Step 3: 输入配图文字
      console.log('输入配图文字...');
      const textbox = await this.page.$('textbox, [role="textbox"], [contenteditable="true"], textarea');
      if (!textbox) {
        console.log('未找到文字输入框');
        return false;
      }
      await textbox.click();
      await textbox.fill(prompt);
      await this.page.waitForTimeout(500);

      // 点击"生成图片"
      const generateBtn = await this.page.$('text=生成图片');
      if (!generateBtn) {
        console.log('未找到生成图片按钮');
        return false;
      }
      await generateBtn.click();
      console.log('等待图片生成...');

      // 等待图片生成完成（"图片生成中"消失）
      try {
        await this.page.waitForFunction(
          () => !document.body.textContent?.includes('图片生成中'),
          { timeout: 30000 }
        );
      } catch {
        // 超时也继续，可能已经生成完成
        console.log('图片生成等待超时，继续...');
      }

      await this.page.waitForTimeout(1000);

      // Step 4: 选择卡片风格（默认"科技"）并点击下一步
      console.log('选择卡片风格...');

      // 点击"科技"风格
      const techStyle = await this.page.$('div:has(> :text("科技"))');
      if (techStyle) {
        await techStyle.click();
        await this.page.waitForTimeout(500);
      }

      // 点击"下一步"
      const nextBtn = await this.page.$('button:has-text("下一步")');
      if (nextBtn) {
        await nextBtn.click();
        await this.page.waitForTimeout(2000);
      }

      return true;
    } catch (error) {
      console.log(`文字配图失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return false;
    }
  }

  /**
   * 设置正文内容（使用 innerHTML 方式，支持换行）
   */
  private async setContent(content: string, tags?: string[]): Promise<void> {
    if (!this.page) return;

    // 构建 HTML 内容，每个段落用 <p> 标签
    const paragraphs = content.split('\n').filter(Boolean);
    let html = paragraphs.map(p => `<p>${p}</p>`).join('');

    // 添加标签
    if (tags && tags.length > 0) {
      html += '<p><br></p><p>' + tags.map(t => `#${t}`).join(' ') + '</p>';
    }

    await this.page.evaluate((htmlContent: string) => {
      // 查找正文编辑器（contenteditable div）
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor) {
        editor.innerHTML = htmlContent;
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, html);
  }

  /**
   * 上传本地图片
   */
  private async uploadImages(imagePaths: string[]): Promise<void> {
    if (!this.page) return;

    console.log(`上传 ${imagePaths.length} 张图片...`);

    // 确保在上传图文模式下
    const imageTab = await this.page.$('text=上传图文');
    if (imageTab) {
      await imageTab.click();
      await this.page.waitForTimeout(1000);
    }

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

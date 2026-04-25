/**
 * CSDN 发帖模块
 *
 * 自动发布博客文章到 CSDN
 */

import { chromium, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { CsdnConfig, BlogContent, PostResult } from './types';

export class CsdnPoster {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: CsdnConfig;
  private userDataDir: string;

  constructor(config: CsdnConfig) {
    this.config = config;
    this.userDataDir = path.join(os.homedir(), '.csdn', 'browser-data');
  }

  private async initBrowser(): Promise<boolean> {
    if (!fs.existsSync(this.userDataDir)) {
      return false;
    }

    this.context = await chromium.launchPersistentContext(this.userDataDir, {
      headless: false,
      viewport: { width: 1280, height: 900 },
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
   * 发布博客文章
   */
  async post(content: BlogContent): Promise<PostResult> {
    try {
      const initialized = await this.initBrowser();
      if (!initialized) {
        return { success: false, message: '未登录，请先运行 csdn login' };
      }

      if (!this.page) {
        return { success: false, message: '浏览器初始化失败' };
      }

      // Step 1: 打开写文章页面
      console.log('正在打开写文章页面...');
      await this.page.goto('https://mp.csdn.net/mp_blog/creation/editor', {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // 等待编辑器加载完成
      await this.page.waitForTimeout(5000);

      // 检查登录状态
      if (this.page.url().includes('login') || this.page.url().includes('passport')) {
        await this.close();
        return { success: false, message: '登录已过期，请先运行 csdn login' };
      }

      // 等待标题输入框出现
      try {
        await this.page.waitForSelector('input, [class*="title"], textarea', { timeout: 10000 });
      } catch {
        console.log('等待编辑器元素超时，继续尝试...');
      }

      // Step 2: 填写标题
      console.log('填写标题...');
      await this.fillTitle(content.title);

      // Step 3: 填写内容（使用 Markdown 编辑器）
      console.log('填写正文...');
      await this.fillContent(content.content);

      await this.page.waitForTimeout(1000);

      // Step 4: 设置文章属性
      console.log('设置文章属性...');
      await this.setArticleProperties(content);

      // Step 5: 发布
      console.log('发布文章...');
      const result = await this.publish();

      await this.close();
      return result;
    } catch (error) {
      await this.close();
      return {
        success: false,
        message: `发布失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 填写标题
   */
  private async fillTitle(title: string): Promise<void> {
    if (!this.page) return;

    try {
      // 尝试多种选择器
      const selectors = [
        'input[class*="title"]',
        'input[placeholder*="标题"]',
        'input[placeholder*="请输入文章标题"]',
        '.article-title-input input',
        '#title-input',
        'input[type="text"][class*="input"]'
      ];

      for (const selector of selectors) {
        const titleInput = await this.page.$(selector);
        if (titleInput) {
          try {
            await titleInput.waitForElementState('visible', { timeout: 5000 });
            await titleInput.click();
            await titleInput.fill(title);
            console.log(`使用选择器 ${selector} 填写标题成功`);
            return;
          } catch {
            continue;
          }
        }
      }

      // 备用方案：使用 evaluate 直接操作 DOM
      console.log('尝试备用方案填写标题...');
      await this.page.evaluate((t: string) => {
        // 查找所有可能的标题输入框
        const inputs = Array.from(document.querySelectorAll('input'));
        for (const input of inputs) {
          const placeholder = input.getAttribute('placeholder') || '';
          const className = input.className || '';
          if (placeholder.includes('标题') || placeholder.includes('输入') ||
              className.includes('title') || className.includes('Title')) {
            (input as HTMLInputElement).value = t;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('标题已填写');
            break;
          }
        }
      }, title);

    } catch (error) {
      console.log(`填写标题出错: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 填写正文内容
   */
  private async fillContent(content: string): Promise<void> {
    if (!this.page) return;

    // 等待编辑器加载
    await this.page.waitForTimeout(2000);

    // CSDN 使用 Markdown 编辑器，尝试切换到 Markdown 模式
    const markdownBtn = await this.page.$('text=Markdown, button:has-text("Markdown")');
    if (markdownBtn) {
      await markdownBtn.click();
      await this.page.waitForTimeout(1000);
    }

    // 查找编辑器输入区域
    const editor = await this.page.$('.editor-input, .markdown-editor textarea, [contenteditable="true"]');
    if (editor) {
      await editor.click();
      await editor.fill(content);
    } else {
      // 备用方案：直接注入内容
      await this.page.evaluate((c: string) => {
        // 尝试找到 CodeMirror 或其他编辑器
        const textarea = document.querySelector('textarea.markdown-source, .cm-content, textarea');
        if (textarea) {
          (textarea as HTMLTextAreaElement).value = c;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, content);
    }
  }

  /**
   * 设置文章属性（标签、分类等）
   */
  private async setArticleProperties(content: BlogContent): Promise<void> {
    if (!this.page) return;

    // 添加标签
    if (content.tags && content.tags.length > 0) {
      console.log('添加标签...');
      const tagInput = await this.page.$('.tag-input input, input[placeholder*="标签"]');
      if (tagInput) {
        for (const tag of content.tags) {
          await tagInput.fill(tag);
          await this.page.waitForTimeout(500);
          // 添加标签（可能需要按回车或点击添加按钮）
          await this.page.keyboard.press('Enter');
          await this.page.waitForTimeout(300);
        }
      }
    }

    // 设置文章类型
    if (content.type) {
      console.log('设置文章类型...');
      const typeSelector = await this.page.$('.article-type-selector, .type-select');
      if (typeSelector) {
        await typeSelector.click();
        await this.page.waitForTimeout(500);

        const typeOption = await this.page.$(`text=${content.type === 'original' ? '原创' : content.type === 'repost' ? '转载' : '翻译'}`);
        if (typeOption) {
          await typeOption.click();
        }
      }
    }

    // 设置分类
    if (content.category) {
      console.log('设置分类...');
      const categoryBtn = await this.page.$('.category-select, button:has-text("分类")');
      if (categoryBtn) {
        await categoryBtn.click();
        await this.page.waitForTimeout(500);

        const categoryOption = await this.page.$(`text=${content.category}`);
        if (categoryOption) {
          await categoryOption.click();
        }
      }
    }
  }

  /**
   * 发布文章
   */
  private async publish(): Promise<PostResult> {
    if (!this.page) return { success: false, message: '页面未初始化' };

    // 点击发布按钮
    const publishBtn = await this.page.$('button:has-text("发布"), .publish-btn, button[class*="publish"]');
    if (publishBtn) {
      await publishBtn.click();
    } else {
      // 备用方案
      await this.page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const btn of btns) {
          if (btn.textContent?.includes('发布')) {
            (btn as HTMLElement).click();
            break;
          }
        }
      });
    }

    // 等待发布完成
    await this.page.waitForTimeout(5000);

    // 检查是否发布成功
    const currentUrl = this.page.url();
    if (currentUrl.includes('article') || currentUrl.includes('details')) {
      // 提取文章 URL
      const articleUrl = currentUrl;
      return {
        success: true,
        message: '发布成功',
        postUrl: articleUrl
      };
    }

    // 检查是否有成功提示
    const successMsg = await this.page.$('text=发布成功, .success-message');
    if (successMsg) {
      return { success: true, message: '发布成功' };
    }

    // 检查是否有错误提示
    const errorMsg = await this.page.$('.error-message, .toast-error');
    if (errorMsg) {
      const errorText = await errorMsg.textContent() || '未知错误';
      return { success: false, message: `发布失败: ${errorText}` };
    }

    return { success: true, message: '发布请求已提交，请检查发布结果' };
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
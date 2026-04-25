/**
 * CSDN 发布脚本 - 使用 Playwright 直接发布
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function publishArticle() {
  const userDataDir = path.join(os.homedir(), '.csdn', 'browser-data');

  // 读取文章内容
  const articlePath = path.resolve(process.cwd(), 'tools/csdn/articles/openmatrix-architecture.md');
  const content = fs.readFileSync(articlePath, 'utf-8');

  // 提取标题（第一行 # 开头）
  const lines = content.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim();
  const body = lines.slice(1).join('\n');

  console.log('标题:', title);
  console.log('内容长度:', body.length);

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1400, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = browser.pages()[0] || await browser.newPage();

  try {
    console.log('打开编辑器页面...');
    await page.goto('https://mp.csdn.net/mp_blog/creation/editor', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // 等待页面加载
    await page.waitForTimeout(5000);

    // 截图查看页面状态
    await page.screenshot({ path: 'csdn-editor.png', fullPage: false });
    console.log('截图保存: csdn-editor.png');

    // 检查 URL
    console.log('当前 URL:', page.url());

    if (page.url().includes('login') || page.url().includes('passport')) {
      console.log('需要登录！请在浏览器中登录后重新运行。');
      await browser.close();
      return;
    }

    // 尝试找到标题输入框并填写
    console.log('查找标题输入框...');

    // 等待编辑器加载
    await page.waitForSelector('.editor-container, .markdown-editor, [class*="editor"], textarea', {
      timeout: 30000
    }).catch(() => console.log('编辑器元素等待超时'));

    await page.waitForTimeout(3000);

    // 尝试多种方式填写标题
    const titleSelectors = [
      'input[class*="title"]',
      'input[placeholder*="标题"]',
      'input[placeholder*="输入"]',
      '.article-title input',
      '#article-title',
      'input[type="text"]'
    ];

    let titleFilled = false;
    for (const selector of titleSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          await input.fill(title);
          console.log(`标题填写成功 (使用: ${selector})`);
          titleFilled = true;
          break;
        }
      } catch (e) {
        console.log(`选择器 ${selector} 失败`);
      }
    }

    if (!titleFilled) {
      // 使用 DOM 操作
      await page.evaluate((t: string) => {
        const allInputs = Array.from(document.querySelectorAll('input'));
        for (const input of allInputs) {
          if (input.offsetWidth > 0 && input.offsetHeight > 0) {
            (input as HTMLInputElement).value = t;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }, title);
      console.log('标题填写 (DOM 方式)');
    }

    await page.waitForTimeout(2000);

    // 填写正文 - 找到编辑器
    console.log('填写正文...');

    // 尝试切换到 Markdown 模式
    const mdBtn = await page.$('text=Markdown, button:has-text("Markdown"), [class*="markdown"]');
    if (mdBtn) {
      await mdBtn.click();
      await page.waitForTimeout(1000);
      console.log('切换到 Markdown 模式');
    }

    // 找编辑器并填写内容
    const editorSelectors = [
      'textarea[class*="editor"]',
      'textarea[placeholder*="内容"]',
      '.markdown-editor textarea',
      '[contenteditable="true"]',
      '.editor-content textarea'
    ];

    let contentFilled = false;
    for (const selector of editorSelectors) {
      try {
        const editor = await page.$(selector);
        if (editor) {
          await editor.fill(body.substring(0, 5000)); // 先填一部分
          contentFilled = true;
          console.log(`正文填写成功 (使用: ${selector})`);
          break;
        }
      } catch (e) {
        console.log(`编辑器选择器 ${selector} 失败`);
      }
    }

    if (!contentFilled) {
      // 使用 clipboard 粘贴
      await page.evaluate((c: string) => {
        const editableElements = Array.from(document.querySelectorAll('[contenteditable="true"], textarea'));
        for (const el of editableElements) {
          const htmlEl = el as HTMLElement;
          if (htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0) {
            htmlEl.focus();
            htmlEl.innerHTML = c.substring(0, 5000);
          }
        }
      }, body);
      console.log('正文填写 (DOM 方式)');
    }

    await page.waitForTimeout(3000);

    // 截图查看填写结果
    await page.screenshot({ path: 'csdn-filled.png', fullPage: false });
    console.log('截图保存: csdn-filled.png');

    console.log('\n请在浏览器中手动完成发布操作。');
    console.log('文章内容已填写，点击发布按钮即可。');

    // 保持浏览器打开，让用户手动完成
    // await browser.close();

  } catch (error) {
    console.log('错误:', error instanceof Error ? error.message : '未知错误');
    await page.screenshot({ path: 'csdn-error.png', fullPage: false });
    // await browser.close();
  }
}

publishArticle();
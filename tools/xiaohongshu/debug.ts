/**
 * 调试脚本 - 查看创作者中心页面结构
 */

import { chromium } from 'playwright';
import * as path from 'path';
import * as os from 'os';

async function debug() {
  const userDataDir = path.join(os.homedir(), '.xhs', 'browser-data');

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 800 },
    locale: 'zh-CN'
  });

  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();

  console.log('访问创作者中心...');
  await page.goto('https://creator.xiaohongshu.com/publish/publish', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(5000);

  console.log('当前URL:', page.url());

  // 截图
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('截图已保存: debug-screenshot.png');

  // 打印页面标题
  const title = await page.title();
  console.log('页面标题:', title);

  // 查找输入框
  const inputs = await page.$$('input');
  console.log('找到 input 元素:', inputs.length);

  const editables = await page.$$('div[contenteditable="true"]');
  console.log('找到可编辑 div:', editables.length);

  const textareas = await page.$$('textarea');
  console.log('找到 textarea:', textareas.length);

  // 获取页面 HTML 结构
  const body = await page.$('body');
  if (body) {
    const html = await body.innerHTML();
    console.log('\n页面部分结构:');
    console.log(html.substring(0, 2000));
  }

  // 保持浏览器打开
  console.log('\n浏览器保持打开，按 Ctrl+C 退出');
}

debug().catch(console.error);
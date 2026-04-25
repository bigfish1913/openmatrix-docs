/**
 * CSDN 数据存储模块
 *
 * 管理内容库和发布状态
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ContentItem, ContentLibrary } from './types';

export class CsdnStore {
  private dataDir: string;
  private contentLibPath: string;

  constructor() {
    this.dataDir = path.join(os.homedir(), '.csdn');
    this.contentLibPath = path.join(this.dataDir, 'content-library.json');

    // 确保目录存在
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 加载内容库
   */
  loadContentLibrary(): ContentLibrary {
    if (!fs.existsSync(this.contentLibPath)) {
      return { items: [] };
    }

    try {
      const data = fs.readFileSync(this.contentLibPath, 'utf-8');
      return JSON.parse(data) as ContentLibrary;
    } catch {
      return { items: [] };
    }
  }

  /**
   * 保存内容库
   */
  saveContentLibrary(library: ContentLibrary): void {
    fs.writeFileSync(
      this.contentLibPath,
      JSON.stringify(library, null, 2),
      'utf-8'
    );
  }

  /**
   * 添加内容
   */
  addContent(item: Omit<ContentItem, 'id' | 'createdAt' | 'published'>): ContentItem {
    const library = this.loadContentLibrary();

    const newItem: ContentItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      published: false
    };

    library.items.push(newItem);
    this.saveContentLibrary(library);

    return newItem;
  }

  /**
   * 批量添加内容
   */
  addBatchContent(items: Array<Omit<ContentItem, 'id' | 'createdAt' | 'published'>>): ContentItem[] {
    const library = this.loadContentLibrary();

    const newItems = items.map(item => ({
      ...item,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      published: false
    }));

    library.items.push(...newItems);
    this.saveContentLibrary(library);

    return newItems;
  }

  /**
   * 标记内容为已发布
   */
  markAsPublished(id: string, publishedAt: string): void {
    const library = this.loadContentLibrary();

    const item = library.items.find(i => i.id === id);
    if (item) {
      item.published = true;
      item.publishedAt = publishedAt;
      this.saveContentLibrary(library);
    }
  }

  /**
   * 获取待发布内容
   */
  getPendingContent(): ContentItem[] {
    const library = this.loadContentLibrary();
    return library.items.filter(i => !i.published);
  }

  /**
   * 获取已发布内容
   */
  getPublishedContent(): ContentItem[] {
    const library = this.loadContentLibrary();
    return library.items.filter(i => i.published);
  }

  /**
   * 删除内容
   */
  deleteContent(id: string): boolean {
    const library = this.loadContentLibrary();
    const index = library.items.findIndex(i => i.id === id);

    if (index !== -1) {
      library.items.splice(index, 1);
      this.saveContentLibrary(library);
      return true;
    }

    return false;
  }

  /**
   * 清除所有内容
   */
  clearAll(): void {
    this.saveContentLibrary({ items: [] });
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `csdn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
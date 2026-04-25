/**
 * CSDN 定时调度模块
 *
 * 定时发布文章和管理发布计划
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ContentItem, BlogContent } from './types';
import { CsdnStore } from './store';
import { CSDN } from './index';

export interface SchedulerState {
  isRunning: boolean;
  todayPosts: number;
  pending: number;
  nextPost: string | null;
  lastPost: string | null;
}

export interface SchedulerConfig {
  /** 每日最大发布数 */
  maxDailyPosts: number;
  /** 发布间隔（分钟） */
  postInterval: number;
  /** 发布时间段（开始小时） */
  postHourStart: number;
  /** 发布时间段（结束小时） */
  postHourEnd: number;
}

export class CsdnScheduler {
  private store: CsdnStore;
  private csdn: CSDN;
  private statePath: string;
  private config: SchedulerConfig;
  private isRunning: boolean;
  private timerId: NodeJS.Timeout | null = null;

  constructor(customConfig?: Partial<SchedulerConfig>) {
    this.store = new CsdnStore();
    this.csdn = new CSDN();

    this.config = {
      maxDailyPosts: customConfig?.maxDailyPosts || 3,
      postInterval: customConfig?.postInterval || 60,
      postHourStart: customConfig?.postHourStart || 9,
      postHourEnd: customConfig?.postHourEnd || 21,
      ...customConfig
    };

    const dataDir = path.join(os.homedir(), '.csdn');
    this.statePath = path.join(dataDir, 'scheduler-state.json');

    this.isRunning = false;
    this.loadState();
  }

  /**
   * 启动定时服务
   */
  start(): void {
    if (this.isRunning) {
      console.log('定时服务已在运行');
      return;
    }

    this.isRunning = true;
    this.saveState();

    console.log(`定时服务已启动`);
    console.log(`每日最大发布: ${this.config.maxDailyPosts} 篇`);
    console.log(`发布间隔: ${this.config.postInterval} 分钟`);
    console.log(`发布时间段: ${this.config.postHourStart}:00 - ${this.config.postHourEnd}:00`);

    // 定时检查
    this.timerId = setInterval(() => {
      this.checkAndPost();
    }, 60000); // 每分钟检查一次

    // 立即检查一次
    this.checkAndPost();
  }

  /**
   * 停止定时服务
   */
  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.isRunning = false;
    this.saveState();

    console.log('定时服务已停止');
  }

  /**
   * 检查并发布
   */
  private async checkAndPost(): Promise<void> {
    const now = new Date();
    const hour = now.getHours();

    // 检查是否在发布时间段内
    if (hour < this.config.postHourStart || hour >= this.config.postHourEnd) {
      return;
    }

    // 检查今日发布数量
    const state = this.getState();
    if (state.todayPosts >= this.config.maxDailyPosts) {
      return;
    }

    // 检查发布间隔
    if (state.lastPost) {
      const lastPostTime = new Date(state.lastPost);
      const elapsed = (now.getTime() - lastPostTime.getTime()) / 60000;
      if (elapsed < this.config.postInterval) {
        return;
      }
    }

    // 获取待发布内容
    const pending = this.store.getPendingContent();
    if (pending.length === 0) {
      return;
    }

    // 取第一篇发布
    const item = pending[0];
    console.log(`正在发布: ${item.title}`);

    try {
      const result = await this.csdn.post({
        title: item.title,
        content: item.content,
        tags: item.tags,
        category: item.category,
        type: item.type
      });

      if (result.success) {
        this.store.markAsPublished(item.id, now.toISOString());

        // 更新状态
        const newState = this.getState();
        newState.todayPosts++;
        newState.lastPost = now.toISOString();
        newState.pending = this.store.getPendingContent().length;
        this.saveState(newState);

        console.log(`发布成功: ${item.title}`);
      } else {
        console.log(`发布失败: ${result.message}`);
      }
    } catch (error) {
      console.log(`发布异常: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取调度状态
   */
  getState(): SchedulerState {
    try {
      if (!fs.existsSync(this.statePath)) {
        return this.getDefaultState();
      }

      const data = fs.readFileSync(this.statePath, 'utf-8');
      const state = JSON.parse(data) as SchedulerState;

      // 检查是否是新的一天，重置今日发布数
      const today = new Date().toISOString().split('T')[0];
      const lastPostDay = state.lastPost?.split('T')[0];

      if (lastPostDay !== today) {
        state.todayPosts = 0;
      }

      return state;
    } catch {
      return this.getDefaultState();
    }
  }

  /**
   * 保存状态
   */
  private saveState(state?: SchedulerState): void {
    const currentState = state || this.getState();
    currentState.isRunning = this.isRunning;
    currentState.pending = this.store.getPendingContent().length;

    fs.writeFileSync(
      this.statePath,
      JSON.stringify(currentState, null, 2),
      'utf-8'
    );
  }

  /**
   * 加载状态
   */
  private loadState(): void {
    const state = this.getState();
    this.isRunning = state.isRunning;
  }

  /**
   * 获取默认状态
   */
  private getDefaultState(): SchedulerState {
    return {
      isRunning: false,
      todayPosts: 0,
      pending: this.store.getPendingContent().length,
      nextPost: null,
      lastPost: null
    };
  }

  /**
   * 添加内容到库
   */
  addContent(item: Omit<ContentItem, 'id' | 'createdAt' | 'published'>): ContentItem {
    const newItem = this.store.addContent(item);
    this.saveState();
    return newItem;
  }

  /**
   * 批量添加内容
   */
  addBatchContent(items: Array<Omit<ContentItem, 'id' | 'createdAt' | 'published'>>): ContentItem[] {
    const newItems = this.store.addBatchContent(items);
    this.saveState();
    return newItems;
  }

  /**
   * 加载内容库
   */
  loadContentLibrary(): ContentItem[] {
    const library = this.store.loadContentLibrary();
    return library.items;
  }

  /**
   * 获取调度器状态信息
   */
  getStatus(): SchedulerState {
    const state = this.getState();
    state.pending = this.store.getPendingContent().length;

    // 计算下次发布时间
    if (state.pending > 0 && state.todayPosts < this.config.maxDailyPosts) {
      const now = new Date();
      let nextPostTime: Date;

      if (state.lastPost) {
        const lastPostTime = new Date(state.lastPost);
        nextPostTime = new Date(lastPostTime.getTime() + this.config.postInterval * 60000);
      } else {
        nextPostTime = now;
      }

      // 确保在发布时间段内
      if (nextPostTime.getHours() < this.config.postHourStart) {
        nextPostTime.setHours(this.config.postHourStart, 0, 0, 0);
      } else if (nextPostTime.getHours() >= this.config.postHourEnd) {
        nextPostTime.setDate(nextPostTime.getDate() + 1);
        nextPostTime.setHours(this.config.postHourStart, 0, 0, 0);
      }

      state.nextPost = nextPostTime.toLocaleString('zh-CN');
    }

    return state;
  }
}
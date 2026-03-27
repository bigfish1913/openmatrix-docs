/**
 * 小红书定时发帖模块
 *
 * 功能：
 * - 每天定时发布 2-3 篇笔记
 * - 支持自定义发布时间
 * - 支持内容库管理
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Xiaohongshu } from './index';

// 内容库类型
export interface PostItem {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  useTextToImage?: boolean;
  imagePrompt?: string;
  published?: boolean;
  publishedAt?: string;
}

// 调度配置
export interface ScheduleConfig {
  // 每天发布时间（小时，24小时制）
  postTimes: number[];
  // 内容库路径
  contentPath: string;
  // 是否启用
  enabled: boolean;
}

// 调度状态
export interface ScheduleState {
  lastCheck: string;
  todayPosts: number;
  lastPostDate: string;
  postedIds: string[];
}

const DEFAULT_CONFIG: ScheduleConfig = {
  postTimes: [9, 14, 20], // 早上9点、下午2点、晚上8点
  contentPath: path.join(os.homedir(), '.xhs', 'content.json'),
  enabled: true
};

export class XhsScheduler {
  private xhs: Xiaohongshu;
  private config: ScheduleConfig;
  private statePath: string;
  private state: ScheduleState;
  private timer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<ScheduleConfig>) {
    this.xhs = new Xiaohongshu();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.statePath = path.join(os.homedir(), '.xhs', 'scheduler-state.json');
    this.state = this.loadState();
  }

  /**
   * 加载调度状态
   */
  private loadState(): ScheduleState {
    try {
      if (fs.existsSync(this.statePath)) {
        const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
        // 如果是新的一天，重置计数
        const today = new Date().toDateString();
        if (data.lastPostDate !== today) {
          return {
            lastCheck: new Date().toISOString(),
            todayPosts: 0,
            lastPostDate: today,
            postedIds: []
          };
        }
        return data;
      }
    } catch (e) {
      console.error('加载状态失败:', e);
    }
    return {
      lastCheck: new Date().toISOString(),
      todayPosts: 0,
      lastPostDate: new Date().toDateString(),
      postedIds: []
    };
  }

  /**
   * 保存调度状态
   */
  private saveState(): void {
    try {
      const dir = path.dirname(this.statePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error('保存状态失败:', e);
    }
  }

  /**
   * 加载内容库
   */
  loadContentLibrary(): PostItem[] {
    try {
      if (fs.existsSync(this.config.contentPath)) {
        return JSON.parse(fs.readFileSync(this.config.contentPath, 'utf-8'));
      }
    } catch (e) {
      console.error('加载内容库失败:', e);
    }
    return [];
  }

  /**
   * 保存内容库
   */
  saveContentLibrary(items: PostItem[]): void {
    try {
      const dir = path.dirname(this.config.contentPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.config.contentPath, JSON.stringify(items, null, 2));
    } catch (e) {
      console.error('保存内容库失败:', e);
    }
  }

  /**
   * 获取待发布内容
   */
  getPendingPosts(): PostItem[] {
    const library = this.loadContentLibrary();
    return library.filter(item => !item.published && !this.state.postedIds.includes(item.id));
  }

  /**
   * 获取今天的发布计划
   */
  getTodayPlan(): { time: Date; post: PostItem | null }[] {
    const now = new Date();
    const pending = this.getPendingPosts();
    const plan: { time: Date; post: PostItem | null }[] = [];

    // 按时间点创建计划
    for (let i = 0; i < this.config.postTimes.length; i++) {
      const hour = this.config.postTimes[i];
      const scheduleTime = new Date(now);
      scheduleTime.setHours(hour, 0, 0, 0);

      // 如果时间已过或者是已经发布的，跳过
      if (scheduleTime <= now || this.state.todayPosts > i) {
        continue;
      }

      plan.push({
        time: scheduleTime,
        post: pending[i] || null
      });
    }

    return plan;
  }

  /**
   * 执行发布
   */
  async publishPost(post: PostItem): Promise<{ success: boolean; message: string }> {
    console.log(`\n📝 正在发布: ${post.title}`);

    const result = await this.xhs.post({
      title: post.title,
      content: post.content,
      tags: post.tags || [],
      useTextToImage: post.useTextToImage,
      imagePrompt: post.imagePrompt
    });

    if (result.success) {
      // 更新状态
      this.state.todayPosts++;
      this.state.postedIds.push(post.id);
      this.state.lastPostDate = new Date().toDateString();
      this.saveState();

      // 更新内容库
      const library = this.loadContentLibrary();
      const item = library.find(i => i.id === post.id);
      if (item) {
        item.published = true;
        item.publishedAt = new Date().toISOString();
        this.saveContentLibrary(library);
      }

      console.log(`✅ 发布成功: ${post.title}`);
    } else {
      console.log(`❌ 发布失败: ${result.message}`);
    }

    return result;
  }

  /**
   * 检查并执行定时任务
   */
  async checkAndPost(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();

    // 检查是否到了发布时间
    const shouldPost = this.config.postTimes.includes(currentHour) &&
                       !this.hasPostedAt(currentHour);

    if (shouldPost) {
      const pending = this.getPendingPosts();
      if (pending.length > 0) {
        // 找到当前时间点对应的帖子
        const timeIndex = this.config.postTimes.indexOf(currentHour);
        const post = pending[timeIndex] || pending[0];

        if (post) {
          await this.publishPost(post);
        }
      }
    }
  }

  /**
   * 检查某个时间点是否已发布
   */
  private hasPostedAt(hour: number): boolean {
    const timeIndex = this.config.postTimes.indexOf(hour);
    return this.state.todayPosts > timeIndex;
  }

  /**
   * 启动定时器（每分钟检查一次）
   */
  start(): void {
    console.log('🚀 定时发帖服务已启动');
    console.log(`📅 发布时间: ${this.config.postTimes.map(h => `${h}:00`).join(', ')}`);
    console.log(`📝 待发布内容: ${this.getPendingPosts().length} 篇`);

    // 立即检查一次
    this.checkAndPost();

    // 每分钟检查一次
    this.timer = setInterval(() => {
      this.checkAndPost();
    }, 60 * 1000);
  }

  /**
   * 停止定时器
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('⏹️ 定时发帖服务已停止');
    }
  }

  /**
   * 获取状态
   */
  getStatus(): ScheduleState & { pending: number; nextPost: string | null } {
    const plan = this.getTodayPlan();
    const nextPost = plan.length > 0
      ? plan[0].time.toLocaleTimeString()
      : null;

    return {
      ...this.state,
      pending: this.getPendingPosts().length,
      nextPost
    };
  }

  /**
   * 添加内容到库
   */
  addContent(post: Omit<PostItem, 'id'>): PostItem {
    const library = this.loadContentLibrary();
    const newItem: PostItem = {
      ...post,
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    library.push(newItem);
    this.saveContentLibrary(library);
    return newItem;
  }

  /**
   * 批量添加内容
   */
  addBatchContent(posts: Array<Omit<PostItem, 'id'>>): PostItem[] {
    const library = this.loadContentLibrary();
    const newItems = posts.map(post => ({
      ...post,
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    library.push(...newItems);
    this.saveContentLibrary(library);
    return newItems;
  }
}

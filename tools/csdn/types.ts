/**
 * CSDN 自动推广工具类型定义
 */

export interface CsdnConfig {
  /** Cookie 存储路径 */
  cookiePath: string;
  /** 登录超时时间 (毫秒) */
  loginTimeout: number;
  /** 发帖重试次数 */
  maxRetries: number;
}

export interface BlogContent {
  /** 文章标题 */
  title: string;
  /** 文章正文（Markdown 格式） */
  content: string;
  /** 文章标签 */
  tags?: string[];
  /** 文章分类 */
  category?: string;
  /** 文章类型：原创、转载、翻译 */
  type?: 'original' | 'repost' | 'translation';
  /** 是否发布到首页推荐 */
  toRecommend?: boolean;
  /** 是否开启评论 */
  enableComment?: boolean;
  /** 是否仅粉丝可见 */
  onlyFans?: boolean;
}

export interface LoginResult {
  success: boolean;
  message: string;
  userId?: string;
  username?: string;
}

export interface PostResult {
  success: boolean;
  message: string;
  postId?: string;
  postUrl?: string;
}

export interface SessionStatus {
  isLoggedIn: boolean;
  userId?: string;
  username?: string;
  lastLogin?: Date;
  cookieExpiry?: Date;
}

// ============ 数据统计相关 ============

export interface BlogStats {
  title: string;
  publishDate: string;
  views: number;
  likes: number;
  comments: number;
  collects: number;
  shares: number;
  url: string;
}

export interface DataOverview {
  totalBlogs: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalCollects: number;
  totalShares: number;
  totalFans: number;
  bestPerformer: BlogStats | null;
  todayBlogs: BlogStats[];
  weeklyStats: WeeklyStats;
}

export interface WeeklyStats {
  viewsIncrease: number;
  fansIncrease: number;
  likesIncrease: number;
  ranking?: number;
}

// ============ 评论/互动相关 ============

export interface CommentOptions {
  /** 评论内容 */
  content: string;
  /** 目标文章 URL */
  articleUrl: string;
  /** 是否为回复某条评论 */
  replyTo?: string;
}

export interface InteractionResult {
  success: boolean;
  message: string;
}

// ============ 内容库相关 ============

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  type: 'original' | 'repost' | 'translation';
  published: boolean;
  publishedAt?: string;
  createdAt: string;
}

export interface ContentLibrary {
  items: ContentItem[];
}
/**
 * 小红书自动发帖模块
 *
 * 功能：
 * 1. 扫码登录并保存 Cookie
 * 2. 自动发布图文笔记
 * 3. 会话状态管理
 */

export interface XhsConfig {
  /** Cookie 存储路径 */
  cookiePath: string;
  /** 登录超时时间 (毫秒) */
  loginTimeout: number;
  /** 发帖重试次数 */
  maxRetries: number;
}

export interface PostContent {
  /** 笔记标题 */
  title: string;
  /** 笔记正文 */
  content: string;
  /** 图片路径列表 */
  images: string[];
  /** 话题标签 */
  tags?: string[];
  /** 使用文字配图（小红书AI生成） */
  useTextToImage?: boolean;
  /** 文字配图提示词 */
  imagePrompt?: string;
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

// ============ 数据读取相关 ============

export interface NoteStats {
  title: string;
  publishDate: string;
  views: number;
  likes: number;
  comments: number;
  collects: number;
  shares: number;
}

export interface DataOverview {
  totalNotes: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalCollects: number;
  totalShares: number;
  bestPerformer: NoteStats | null;
  todayNotes: NoteStats[];
}
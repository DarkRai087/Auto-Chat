// ============================================================
// Session State
// ============================================================

export type SessionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'error';

export type Platform = 'youtube' | 'twitch';

export interface SessionState {
  status: SessionStatus;
  
  youtubeEnabled: boolean;
  twitchEnabled: boolean;
  
  youtubeStreamId: string;
  twitchStreamId: string;
  
  youtubeLiveChatId: string;
  twitchLiveChatId: string;
  
  youtubeTitle: string;
  twitchTitle: string;

  messages: string[];
  delaySeconds: number;
  currentIndex: number;
  countdown: number;
  error: string | null;
  messagesSent: number;
  quotaUsed: number;
}

export const DEFAULT_SESSION_STATE: SessionState = {
  status: 'idle',
  
  youtubeEnabled: false,
  twitchEnabled: false,
  
  youtubeStreamId: '',
  twitchStreamId: '',
  
  youtubeLiveChatId: '',
  twitchLiveChatId: '',
  
  youtubeTitle: '',
  twitchTitle: '',

  messages: [],
  delaySeconds: 10,
  currentIndex: 0,
  countdown: 0,
  error: null,
  messagesSent: 0,
  quotaUsed: 0,
};

// ============================================================
// API Types
// ============================================================

export interface StreamInfo {
  platform: Platform;
  streamId: string;
  title: string;
  isLive: boolean;
  liveChatId: string | null;
  error?: string;
}

export interface YouTubeApiError {
  code: number;
  message: string;
  reason?: string;
}

// ============================================================
// Constants
// ============================================================

export const MIN_DELAY_SECONDS = 10;
export const MAX_DELAY_SECONDS = 3600; // 1 hour
export const QUOTA_PER_INSERT = 50;
export const DAILY_QUOTA_LIMIT = 10_000;
export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

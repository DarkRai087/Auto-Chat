// ============================================================
// Runtime Message Protocol
// ============================================================
// All messages between popup ↔ background ↔ offscreen

import type { SessionState } from './types';

// ---- Popup → Background ----

export interface StartSessionMessage {
  type: 'START_SESSION';
  payload: {
    youtubeStreamId: string;
    twitchStreamId: string;
    messages: string[];
    delaySeconds: number;
  };
}

export interface StopSessionMessage {
  type: 'STOP_SESSION';
}

export interface GetStatusMessage {
  type: 'GET_STATUS';
}

export interface ConnectAuthMessage {
  type: 'CONNECT_AUTH';
  payload: { platform: import('./types').Platform };
}

export interface DisconnectAuthMessage {
  type: 'DISCONNECT_AUTH';
  payload: { platform: import('./types').Platform };
}

export interface CheckStreamMessage {
  type: 'CHECK_STREAM';
  payload: {
    platform: import('./types').Platform;
    streamId: string;
  };
}

// ---- Background → Popup (responses or broadcasts) ----

export interface StatusUpdateMessage {
  type: 'STATUS_UPDATE';
  payload: SessionState;
}

export interface AuthStatusMessage {
  type: 'AUTH_STATUS';
  payload: {
    connected: boolean;
    error?: string;
  };
}

export interface StreamInfoMessage {
  type: 'STREAM_INFO';
  payload: {
    platform: import('./types').Platform;
    streamId: string;
    title: string;
    isLive: boolean;
    liveChatId: string | null;
    error?: string;
  };
}

// ---- Background ↔ Offscreen ----

export interface TimerStartMessage {
  type: 'TIMER_START';
  payload: {
    delaySeconds: number;
  };
}

export interface TimerStopMessage {
  type: 'TIMER_STOP';
}

export interface TimerTickMessage {
  type: 'TIMER_TICK';
  payload: {
    countdown: number;
    shouldSend: boolean;
  };
}

// ---- Union types ----

export type PopupToBackgroundMessage =
  | StartSessionMessage
  | StopSessionMessage
  | GetStatusMessage
  | ConnectAuthMessage
  | DisconnectAuthMessage
  | CheckStreamMessage;

export type BackgroundToPopupMessage =
  | StatusUpdateMessage
  | AuthStatusMessage
  | StreamInfoMessage;

export type OffscreenMessage =
  | TimerStartMessage
  | TimerStopMessage
  | TimerTickMessage;

export type ExtensionMessage =
  | PopupToBackgroundMessage
  | BackgroundToPopupMessage
  | OffscreenMessage;

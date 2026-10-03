// ============================================================
// Background Service Worker
// ============================================================

import type { SessionState, Platform } from '@/lib/types';
import type { ExtensionMessage } from '@/lib/messages';
import { DEFAULT_SESSION_STATE, QUOTA_PER_INSERT, MIN_DELAY_SECONDS, MAX_DELAY_SECONDS } from '@/lib/types';
import { getAuthToken, hasAuthToken, revokeAuth } from '@/lib/auth';
import {
  getVideoInfo,
  sendChatMessage,
  isRateLimitError,
  isChatUnavailableError,
} from '@/lib/youtube-api';
import { getTwitchStreamInfo, sendTwitchChatMessage } from '@/lib/twitch-api';
import type { YouTubeApiError } from '@/lib/types';
import type { TwitchApiError } from '@/lib/twitch-api';

let sessionState: SessionState = { ...DEFAULT_SESSION_STATE };

async function saveState(): Promise<void> {
  await chrome.storage.session.set({ sessionState });
}

async function loadState(): Promise<void> {
  const result = await chrome.storage.session.get('sessionState');
  if (result.sessionState) {
    sessionState = result.sessionState as SessionState;
  }
}

function broadcastStatus(): void {
  chrome.runtime.sendMessage({
    type: 'STATUS_UPDATE',
    payload: { ...sessionState },
  }).catch(() => {
    // Popup may not be open
  });
}

const OFFSCREEN_URL = 'offscreen.html';

async function ensureOffscreen(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });

  if (contexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: [chrome.offscreen.Reason.BLOBS],
      justification: 'Reliable timer for chat message scheduling',
    });
  }
}

async function closeOffscreen(): Promise<void> {
  try {
    await chrome.offscreen.closeDocument();
  } catch {
    // May not exist
  }
}

function startTimerCountdown(delaySeconds: number): void {
  chrome.runtime.sendMessage({
    type: 'TIMER_START',
    payload: { delaySeconds },
  }).catch(() => {
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'TIMER_START',
        payload: { delaySeconds },
      }).catch(() => {});
    }, 500);
  });
}

function stopTimerCountdown(): void {
  chrome.runtime.sendMessage({
    type: 'TIMER_STOP',
  }).catch(() => {});
}

async function startSession(
  youtubeStreamId: string,
  twitchStreamId: string,
  messages: string[],
  delaySeconds: number,
): Promise<void> {
  try {
    // SECURITY: Validate all inputs before processing
    const streamIdPattern = /^[a-zA-Z0-9_-]{0,64}$/;
    if (youtubeStreamId && !streamIdPattern.test(youtubeStreamId)) {
      throw new Error('Invalid YouTube stream ID format.');
    }
    if (twitchStreamId && !streamIdPattern.test(twitchStreamId)) {
      throw new Error('Invalid Twitch stream ID format.');
    }
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      throw new Error('Messages must be an array of 1\u201350 items.');
    }
    for (const msg of messages) {
      if (typeof msg !== 'string' || msg.length === 0 || msg.length > 200) {
        throw new Error('Each message must be a non-empty string of at most 200 characters.');
      }
    }
    if (typeof delaySeconds !== 'number' || !Number.isInteger(delaySeconds) ||
        delaySeconds < MIN_DELAY_SECONDS || delaySeconds > MAX_DELAY_SECONDS) {
      throw new Error(`Delay must be between ${MIN_DELAY_SECONDS} and ${MAX_DELAY_SECONDS} seconds.`);
    }

    let yLiveChatId = '';
    let yTitle = '';
    let tLiveChatId = '';
    let tTitle = '';
    let yEnabled = false;
    let tEnabled = false;

    if (youtubeStreamId) {
      const token = await getAuthToken('youtube', false);
      if (!token) throw new Error('YouTube not authenticated.');
      const videoInfo = await getVideoInfo(youtubeStreamId);
      if (!videoInfo.isLive) throw new Error('YouTube video is not live.');
      if (!videoInfo.liveChatId) throw new Error('YouTube live chat is not available.');
      yTitle = videoInfo.title;
      yLiveChatId = videoInfo.liveChatId;
      yEnabled = true;
    }

    if (twitchStreamId) {
      const token = await getAuthToken('twitch', false);
      if (!token) throw new Error('Twitch not authenticated.');
      const streamInfo = await getTwitchStreamInfo(twitchStreamId);
      if (!streamInfo.isLive) throw new Error('Twitch channel is not live.');
      tTitle = streamInfo.title;
      tLiveChatId = streamInfo.streamId;
      tEnabled = true;
    }

    if (!yEnabled && !tEnabled) {
      throw new Error('Must configure at least one stream.');
    }

    sessionState = {
      status: 'running',
      youtubeEnabled: yEnabled,
      twitchEnabled: tEnabled,
      youtubeStreamId,
      twitchStreamId,
      youtubeLiveChatId: yLiveChatId,
      twitchLiveChatId: tLiveChatId,
      youtubeTitle: yTitle,
      twitchTitle: tTitle,
      messages,
      delaySeconds,
      currentIndex: 0,
      countdown: delaySeconds,
      error: null,
      messagesSent: 0,
      quotaUsed: 0,
    };
    await saveState();
    broadcastStatus();

    await ensureOffscreen();
    startTimerCountdown(delaySeconds);
    chrome.alarms.create('session-keepalive', { periodInMinutes: 0.4 });
  } catch (err) {
    sessionState.status = 'error';
    sessionState.error = err instanceof Error ? err.message : String(err);
    await saveState();
    broadcastStatus();
  }
}

async function stopSession(reason?: string): Promise<void> {
  stopTimerCountdown();
  await closeOffscreen();
  chrome.alarms.clear('session-keepalive');

  sessionState.status = 'stopped';
  sessionState.countdown = 0;
  if (reason) {
    sessionState.error = reason;
  }
  await saveState();
  broadcastStatus();
}

async function handleTimerTick(countdown: number, shouldSend: boolean): Promise<void> {
  if (sessionState.status !== 'running') return;

  sessionState.countdown = countdown;

  if (shouldSend) {
    const messageText = sessionState.messages[sessionState.currentIndex];
    if (!messageText) {
      await stopSession('No message to send. Session ended.');
      return;
    }

    try {
      if (sessionState.youtubeEnabled && sessionState.youtubeLiveChatId) {
        await sendChatMessage(sessionState.youtubeLiveChatId, messageText);
        sessionState.quotaUsed += QUOTA_PER_INSERT;
      }
      if (sessionState.twitchEnabled && sessionState.twitchLiveChatId) {
        await sendTwitchChatMessage(sessionState.twitchLiveChatId, messageText);
        sessionState.quotaUsed += 1;
      }

      sessionState.messagesSent++;
      sessionState.currentIndex =
        (sessionState.currentIndex + 1) % sessionState.messages.length;

      await saveState();
      broadcastStatus();
      startTimerCountdown(sessionState.delaySeconds);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('401')) {
        await stopSession('Authentication expired. Please reconnect.');
      } else {
        // SECURITY: Show user-friendly message, log details for debugging
        console.error('[YT Live Chat Sender] API error:', errMsg);
        await stopSession('Failed to send message. Check console for details.');
      }
    }
  } else {
    await saveState();
    broadcastStatus();
  }
}

export default defineBackground(() => {
  loadState().then(() => {
    if (sessionState.status === 'running') {
      ensureOffscreen().then(() => {
        startTimerCountdown(sessionState.countdown > 0 ? sessionState.countdown : sessionState.delaySeconds);
      });
    }
  });

  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, sender, sendResponse) => {
      // SECURITY: Only accept messages from our own extension
      if (sender.id !== chrome.runtime.id) return;
      const handleAsync = async () => {
        switch (message.type) {
          case 'CONNECT_AUTH': {
            try {
              await getAuthToken(message.payload.platform, true);
              return { type: 'AUTH_STATUS', payload: { connected: true } };
            } catch (err) {
              return {
                type: 'AUTH_STATUS',
                payload: {
                  connected: false,
                  error: err instanceof Error ? err.message : String(err),
                },
              };
            }
          }

          case 'DISCONNECT_AUTH': {
            await revokeAuth(message.payload.platform);
            return { type: 'AUTH_STATUS', payload: { connected: false } };
          }

          case 'CHECK_STREAM': {
            try {
              if (message.payload.platform === 'youtube') {
                const info = await getVideoInfo(message.payload.streamId);
                return {
                  type: 'STREAM_INFO',
                  payload: {
                    platform: 'youtube',
                    streamId: info.streamId,
                    title: info.title,
                    isLive: info.isLive,
                    liveChatId: info.liveChatId,
                  },
                };
              } else {
                const info = await getTwitchStreamInfo(message.payload.streamId);
                return {
                  type: 'STREAM_INFO',
                  payload: {
                    platform: 'twitch',
                    streamId: info.streamId,
                    title: info.title,
                    isLive: info.isLive,
                    liveChatId: info.liveChatId,
                  },
                };
              }
            } catch (err) {
              const apiErr = err as { message?: string };
              return {
                type: 'STREAM_INFO',
                payload: {
                  platform: message.payload.platform,
                  streamId: message.payload.streamId,
                  title: '',
                  isLive: false,
                  liveChatId: null,
                  error: apiErr.message || String(err),
                },
              };
            }
          }

          case 'START_SESSION': {
            await startSession(
              message.payload.youtubeStreamId,
              message.payload.twitchStreamId,
              message.payload.messages,
              message.payload.delaySeconds,
            );
            return { type: 'STATUS_UPDATE', payload: { ...sessionState } };
          }

          case 'STOP_SESSION': {
            await stopSession();
            return { type: 'STATUS_UPDATE', payload: { ...sessionState } };
          }

          case 'GET_STATUS': {
            const ytConnected = await hasAuthToken('youtube');
            const twConnected = await hasAuthToken('twitch');
            return {
              type: 'STATUS_UPDATE',
              payload: { ...sessionState },
              auth: { youtube: ytConnected, twitch: twConnected },
            };
          }

          case 'TIMER_TICK': {
            await handleTimerTick(
              message.payload.countdown,
              message.payload.shouldSend,
            );
            return undefined;
          }

          default:
            return undefined;
        }
      };

      handleAsync().then((response) => {
        sendResponse(response);
      });

      return true;
    },
  );

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'session-keepalive') {
      loadState();
    }
  });
});

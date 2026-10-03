// ============================================================
// YouTube Data API v3 Wrapper
// ============================================================

import { YOUTUBE_API_BASE } from './types';
import type { StreamInfo, YouTubeApiError } from './types';
import { getYoutubeAuthToken, removeYoutubeToken } from './auth';

/**
 * Make an authenticated request to the YouTube API.
 * Automatically handles 401 by clearing the cached token.
 */
async function youtubeApiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getYoutubeAuthToken(false);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // If token is expired/invalid, clear cache so next call re-authenticates
  if (response.status === 401) {
    await removeYoutubeToken(token);
    throw createApiError(401, 'Authentication expired. Please reconnect.');
  }

  return response;
}

/**
 * Get video info and determine if it's a live stream with active chat.
 */
export async function getVideoInfo(streamId: string): Promise<StreamInfo> {
  const url = `${YOUTUBE_API_BASE}/videos?part=snippet,liveStreamingDetails&id=${encodeURIComponent(streamId)}`;
  const response = await youtubeApiFetch(url);

  if (!response.ok) {
    const error = await parseApiError(response);
    throw error;
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw createApiError(404, 'Video not found.');
  }

  const video = data.items[0];
  const snippet = video.snippet || {};
  const liveDetails = video.liveStreamingDetails || {};

  const isLive = snippet.liveBroadcastContent === 'live';
  const liveChatId = liveDetails.activeLiveChatId || null;

  return {
    platform: 'youtube',
    streamId,
    title: snippet.title || 'Unknown',
    isLive,
    liveChatId,
  };
}

/**
 * Send a chat message to a livestream's live chat.
 * Costs 50 quota units per call.
 */
export async function sendChatMessage(
  liveChatId: string,
  messageText: string,
): Promise<void> {
  const url = `${YOUTUBE_API_BASE}/liveChat/messages?part=snippet`;

  const body = {
    snippet: {
      liveChatId,
      type: 'textMessageEvent',
      textMessageDetails: {
        messageText,
      },
    },
  };

  const response = await youtubeApiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    throw error;
  }
}

// ============================================================
// Error Helpers
// ============================================================

function createApiError(code: number, message: string, reason?: string): YouTubeApiError {
  return { code, message, reason };
}

async function parseApiError(response: Response): Promise<YouTubeApiError> {
  try {
    const data = await response.json();
    const error = data.error;

    if (error) {
      const firstError = error.errors?.[0];
      return createApiError(
        error.code || response.status,
        error.message || 'Unknown API error',
        firstError?.reason,
      );
    }
  } catch {
    // JSON parse failed
  }

  return createApiError(
    response.status,
    `HTTP ${response.status}: ${response.statusText}`,
  );
}

/**
 * Check if an API error is a rate limit error.
 */
export function isRateLimitError(error: YouTubeApiError): boolean {
  return (
    error.reason === 'rateLimitExceeded' ||
    error.reason === 'userRateLimitExceeded' ||
    error.reason === 'quotaExceeded' ||
    error.code === 429
  );
}

/**
 * Check if an API error indicates the chat/stream is gone.
 */
export function isChatUnavailableError(error: YouTubeApiError): boolean {
  return (
    error.reason === 'liveChatNotFound' ||
    error.reason === 'liveChatEnded' ||
    error.reason === 'liveChatDisabled' ||
    error.reason === 'forbidden'
  );
}

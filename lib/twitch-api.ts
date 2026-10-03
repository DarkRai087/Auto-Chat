// ============================================================
// Twitch Helix API Wrapper
// ============================================================

import { getTwitchAuthToken, TWITCH_CLIENT_ID } from './auth';
import type { StreamInfo } from './types';

export interface TwitchApiError {
  status: number;
  message: string;
}

const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

/**
 * Make an authenticated request to the Twitch API.
 */
async function twitchApiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getTwitchAuthToken(false);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Client-Id': TWITCH_CLIENT_ID,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    await chrome.storage.session.remove('twitchToken');
    throw { status: 401, message: 'Twitch authentication expired. Please reconnect.' };
  }

  return response;
}

/**
 * Get broadcaster info from their username (login).
 */
export async function getTwitchStreamInfo(channelName: string): Promise<StreamInfo> {
  // 1. Get user ID from username
  const userUrl = `${TWITCH_API_BASE}/users?login=${encodeURIComponent(channelName)}`;
  const userRes = await twitchApiFetch(userUrl);

  if (!userRes.ok) {
    throw await parseTwitchError(userRes);
  }

  const userData = await userRes.json();
  if (!userData.data || userData.data.length === 0) {
    throw { status: 404, message: 'Twitch channel not found.' };
  }

  const broadcasterId = userData.data[0].id;
  const displayName = userData.data[0].display_name;

  // 2. Check if they are live
  const streamUrl = `${TWITCH_API_BASE}/streams?user_id=${broadcasterId}`;
  const streamRes = await twitchApiFetch(streamUrl);
  
  if (!streamRes.ok) {
    throw await parseTwitchError(streamRes);
  }

  const streamData = await streamRes.json();
  const isLive = streamData.data && streamData.data.length > 0;
  const streamTitle = isLive ? streamData.data[0].title : displayName;

  return {
    platform: 'twitch',
    streamId: broadcasterId,
    title: streamTitle,
    isLive,
    liveChatId: broadcasterId, // For Twitch, chat ID is the broadcaster ID
  };
}

/**
 * Send a message to a Twitch chat.
 */
export async function sendTwitchChatMessage(broadcasterId: string, messageText: string): Promise<void> {
  // 1. Get our own user ID (sender)
  // We can cache this in session storage to avoid a request every time
  let senderId = '';
  const result = await chrome.storage.session.get('twitchSenderId');
  
  if (result.twitchSenderId) {
    senderId = result.twitchSenderId as string;
  } else {
    const userRes = await twitchApiFetch(`${TWITCH_API_BASE}/users`);
    if (!userRes.ok) throw await parseTwitchError(userRes);
    const userData = await userRes.json();
    senderId = userData.data[0].id;
    await chrome.storage.session.set({ twitchSenderId: senderId });
  }

  // 2. Send the message
  const url = `${TWITCH_API_BASE}/chat/messages`;
  const body = {
    broadcaster_id: broadcasterId,
    sender_id: senderId,
    message: messageText,
  };

  const response = await twitchApiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseTwitchError(response);
  }
}

// ============================================================
// Error Helpers
// ============================================================

async function parseTwitchError(response: Response): Promise<TwitchApiError> {
  try {
    const data = await response.json();
    return {
      status: response.status,
      message: data.message || 'Unknown Twitch API error',
    };
  } catch {
    return {
      status: response.status,
      message: `HTTP ${response.status}: ${response.statusText}`,
    };
  }
}

// ============================================================
// Authentication (YouTube & Twitch)
// ============================================================
import type { Platform } from './types';

// ⚠️ REPLACE with your Twitch Client ID from Twitch Developer Console
export const TWITCH_CLIENT_ID = '0qs9kbj8zkysrt4yk3c8ghpjz2tcbm';

// ============================================================
// YouTube Auth
// ============================================================

export async function getYoutubeAuthToken(interactive: boolean = true): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!token) {
        reject(new Error('No token returned'));
        return;
      }
      resolve(token);
    });
  });
}

export async function removeYoutubeToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
  });
}

// ============================================================
// Twitch Auth
// ============================================================

export async function getTwitchAuthToken(interactive: boolean = true): Promise<string> {
  // Use session storage to cache the Twitch token
  const result = await chrome.storage.session.get('twitchToken');
  if (result.twitchToken && !interactive) {
    return result.twitchToken as string;
  }

  if (!interactive && !result.twitchToken) {
    throw new Error('Not authenticated');
  }

  const extensionId = chrome.runtime.id;
  const redirectUri = `https://${extensionId}.chromiumapp.org/`;
  const scope = 'user:write:chat';
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}&response_type=token&scope=${encodeURIComponent(scope)}`;

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive },
      async (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          reject(new Error(chrome.runtime.lastError?.message || 'Authentication failed'));
          return;
        }

        // Extract token from fragment: #access_token=abcd&scope=...
        const url = new URL(redirectUrl);
        const params = new URLSearchParams(url.hash.substring(1));
        const token = params.get('access_token');

        if (!token) {
          reject(new Error('No access token returned from Twitch'));
          return;
        }

        await chrome.storage.session.set({ twitchToken: token });
        resolve(token);
      },
    );
  });
}

export async function removeTwitchToken(): Promise<void> {
  await chrome.storage.session.remove('twitchToken');
}

// ============================================================
// Generic Platform Helpers
// ============================================================

export async function getAuthToken(platform: Platform, interactive: boolean = true): Promise<string> {
  if (platform === 'youtube') return getYoutubeAuthToken(interactive);
  return getTwitchAuthToken(interactive);
}

export async function hasAuthToken(platform: Platform): Promise<boolean> {
  try {
    await getAuthToken(platform, false);
    return true;
  } catch {
    return false;
  }
}

export async function revokeAuth(platform: Platform): Promise<void> {
  try {
    const token = await getAuthToken(platform, false);
    if (platform === 'youtube') {
      await removeYoutubeToken(token);
      // SECURITY: Use POST body instead of URL query to avoid token leaking in logs
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `token=${token}`,
      });
    } else {
      await removeTwitchToken();
      await fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${TWITCH_CLIENT_ID}&token=${token}`, {
        method: 'POST',
      });
    }
  } catch (e) {
    console.warn('[YT Live Chat Sender] Revocation failed:', e);
  }
}

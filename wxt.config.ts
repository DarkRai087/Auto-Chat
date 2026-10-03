import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'YT Live Chat Sender',
    description: 'Send scheduled messages to YouTube livestream chat',
    version: '1.0.0',
    permissions: [
      'identity',
      'offscreen',
      'storage',
      'alarms',
    ],
    host_permissions: [
      'https://www.googleapis.com/youtube/v3/*',
      'https://api.twitch.tv/helix/*',
      'https://id.twitch.tv/oauth2/*',
    ],
    oauth2: {
      // ⚠️ REPLACE with your own OAuth Client ID from Google Cloud Console
      // Type: Chrome App, with your extension ID registered
      client_id: '683178846257-6uagbdg9nn0678pvics2norji2qbnbih.apps.googleusercontent.com',
      scopes: [
        'https://www.googleapis.com/auth/youtube',
      ],
    },
    action: {
      default_title: 'Live Stream Chat Sender',
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'none'; base-uri 'self';",
    },
    browser_specific_settings: {
      gecko: {
        id: 'yt-live-chat-sender@your-domain.com',
        strict_min_version: '109.0',
      },
    },
  },
});

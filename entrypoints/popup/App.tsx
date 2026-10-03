import type { SessionStatus } from '../../lib/types';

interface AuthSectionProps {
  platform: Platform;
  connected: boolean;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function AuthSection({
  platform,
  connected,
  loading,
  onConnect,
  onDisconnect,
}: AuthSectionProps) {
  const isTwitch = platform === 'twitch';
  const platformName = isTwitch ? 'Twitch' : 'YouTube';
  const btnColor = isTwitch
    ? 'bg-brand-primary text-white hover:bg-purple-600'
    : 'bg-brand-error text-white hover:bg-red-700';

  const disconnectHover = isTwitch
    ? 'hover:bg-purple-900/30 hover:text-brand-primary'
    : 'hover:bg-red-900/30 hover:text-brand-error';

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-brand-card rounded-lg border border-brand-border">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${connected ? 'bg-brand-success' : 'bg-brand-muted'
            }`}
        />
        <span className="text-xs text-brand-muted">
          {platformName} {connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
      <button
        onClick={connected ? onDisconnect : onConnect}
        disabled={loading}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200
          ${connected
            ? `bg-brand-border text-brand-muted ${disconnectHover}`
            : btnColor
          }
          disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? '...' : connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}

interface ControlsProps {
  status: SessionStatus;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
  isTwitch?: boolean;
}

export function Controls({ status, canStart, onStart, onStop, isTwitch }: ControlsProps) {
  const isRunning = status === 'running';

  const startGradient = isTwitch
    ? 'from-purple-600 to-purple-800 shadow-purple-900/20'
    : 'from-brand-error to-red-600 shadow-red-900/20';

  const startHover = isTwitch
    ? 'hover:from-purple-500 hover:to-purple-700'
    : 'hover:from-red-500 hover:to-red-500';

  const startDisabled = isTwitch
    ? 'disabled:hover:from-purple-600 disabled:hover:to-purple-800'
    : 'disabled:hover:from-brand-error disabled:hover:to-red-600';

  return (
    <div>
      {isRunning ? (
        <button
          onClick={onStop}
          className="w-full py-2 text-sm font-semibold rounded-lg transition-all duration-200
            bg-brand-card border border-brand-border text-brand-text
            hover:bg-brand-border
            active:scale-[0.98] shadow-lg shadow-black/20"
        >
          â–  STOP
        </button>
      ) : (
        <button
          onClick={onStart}
          disabled={!canStart}
          className={`w-full py-2 text-sm font-semibold rounded-lg transition-all duration-200
            bg-gradient-to-r text-white shadow-lg ${startGradient} ${startHover}
            active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
            ${startDisabled}`}
        >
          â–¶ START
        </button>
      )}
    </div>
  );
}

interface DelayInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}

export function DelayInput({ value, onChange, disabled }: DelayInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      onChange(num);
    } else if (raw === '') {
      onChange(0);
    }
  };

  const isValid = value >= MIN_DELAY_SECONDS && value <= MAX_DELAY_SECONDS;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-brand-muted uppercase tracking-wider">
        Delay
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value || ''}
          onChange={handleChange}
          min={MIN_DELAY_SECONDS}
          max={MAX_DELAY_SECONDS}
          disabled={disabled}
          className={`w-20 px-2.5 py-1.5 text-xs bg-brand-card border rounded-md text-brand-text
            text-center focus:outline-none transition-colors disabled:opacity-50
            ${isValid ? 'border-brand-border focus:border-brand-primary/50' : 'border-red-500/50'}`}
        />
        <span className="text-xs text-brand-muted">seconds</span>
      </div>
      {!isValid && value > 0 && (
        <p className="text-2xs text-red-400">
          Min {MIN_DELAY_SECONDS}s, max {MAX_DELAY_SECONDS}s
        </p>
      )}
    </div>
  );
}

interface MessageInputProps {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled: boolean;
}

export function MessageInput({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
  disabled,
}: MessageInputProps) {
  return (
    <div className="flex items-center gap-1.5 group">
      <span className="text-2xs text-brand-muted w-4 text-right shrink-0">
        {index + 1}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Message ${index + 1}`}
        disabled={disabled}
        maxLength={200}
        className="flex-1 px-2.5 py-1.5 text-xs bg-brand-card border border-brand-border rounded-md
          text-brand-text placeholder:text-brand-muted/40 focus:outline-none focus:border-brand-primary/50
          disabled:opacity-50 transition-colors"
      />
      {canRemove && (
        <button
          onClick={onRemove}
          disabled={disabled}
          className="w-6 h-6 flex items-center justify-center text-brand-muted/40 hover:text-red-400
            rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100
            disabled:opacity-0"
          aria-label={`Remove message ${index + 1}`}
        >
          âœ•
        </button>
      )}
      {/* Keep space consistent when button is hidden */}
      {!canRemove && <div className="w-6 shrink-0" />}
    </div>
  );
}

interface MessageListProps {
  messages: string[];
  onChange: (messages: string[]) => void;
  disabled: boolean;
}

export function MessageList({ messages, onChange, disabled }: MessageListProps) {
  const updateMessage = (index: number, value: string) => {
    const updated = [...messages];
    updated[index] = value;
    onChange(updated);
  };

  const removeMessage = (index: number) => {
    const updated = messages.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addMessage = () => {
    onChange([...messages, '']);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-brand-muted uppercase tracking-wider">
        Messages
      </label>
      <div className="space-y-1">
        {messages.map((msg, i) => (
          <MessageInput
            key={i}
            index={i}
            value={msg}
            onChange={(val) => updateMessage(i, val)}
            onRemove={() => removeMessage(i)}
            canRemove={messages.length > 1}
            disabled={disabled}
          />
        ))}
      </div>
      <button
        onClick={addMessage}
        disabled={disabled}
        className="flex items-center gap-1 px-2 py-1 text-xs text-brand-muted hover:text-brand-text
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-sm">+</span> Add message
      </button>
    </div>
  );
}

interface StatusDisplayProps {
  session: SessionState;
}

export function StatusDisplay({ session }: StatusDisplayProps) {
  const { status, countdown, currentIndex, messages, messagesSent, quotaUsed, error, twitchEnabled, youtubeEnabled } = session;

  const isTwitch = twitchEnabled && !youtubeEnabled;
  const progressColor = isTwitch ? 'bg-brand-primary' : 'bg-brand-error';

  let remainingText = '';
  if (messagesSent > 0) {
    if (isTwitch) {
      remainingText = `${messagesSent} sent`;
    } else {
      const maxMessages = Math.floor(DAILY_QUOTA_LIMIT / QUOTA_PER_INSERT);
      const remaining = maxMessages - messagesSent;
      remainingText = `${messagesSent} sent Â· ${remaining} left today`;
    }
  }

  if (status === 'idle') {
    return (
      <div className="px-3 py-2 bg-brand-card rounded-lg border border-brand-border">
        <p className="text-xs text-brand-muted">Ready</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 bg-brand-card rounded-lg border border-brand-border space-y-2">
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${status === 'running'
                ? 'bg-brand-success animate-pulse-slow'
                : status === 'error'
                  ? 'bg-red-500'
                  : 'bg-brand-muted'
              }`}
          />
          <span
            className={`text-xs font-medium uppercase tracking-wider ${status === 'running'
                ? 'text-brand-success'
                : status === 'error'
                  ? 'text-red-400'
                  : 'text-brand-muted'
              }`}
          >
            {status}
          </span>
        </div>
        {remainingText && (
          <span className="text-2xs text-brand-muted">
            {remainingText}
          </span>
        )}
      </div>

      {/* Countdown & next message */}
      {status === 'running' && messages.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-brand-muted">Next message</span>
            <span className="text-xs font-mono text-brand-text tabular-nums">
              {countdown}s
            </span>
          </div>
          <p className="text-xs text-brand-text/70 truncate">
            "{messages[currentIndex]}"
          </p>
          {/* Progress bar */}
          <div className="h-0.5 bg-brand-border rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-1000 ease-linear`}
              style={{
                width: `${session.delaySeconds > 0
                    ? ((session.delaySeconds - countdown) / session.delaySeconds) * 100
                    : 0
                  }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-2xs text-red-400 leading-tight">{error}</p>
      )}
    </div>
  );
}

interface StreamInfoProps {
  platform: Platform;
  streamId: string;
  streamTitle: string;
  isLive: boolean;
  chatAvailable: boolean;
  error: string | null;
  disabled: boolean;
  onStreamIdChange: (streamId: string, platform: Platform) => void;
  onCheck: (streamId: string, platform: Platform) => void;
}

/**
 * Extract a stream ID/username and platform from a URL or raw string.
 */
function extractStreamInfo(input: string): { id: string; platform: Platform } | null {
  const trimmed = input.trim();

  // Try Twitch raw username
  if (/^[a-zA-Z0-9_]{4,25}$/.test(trimmed) && !trimmed.includes('youtube')) {
    // It might be a raw YouTube ID if it's exactly 11 chars, but let's assume if it looks like a simple string without spaces it could be twitch.
    // Actually, let's strictly use URL for Twitch if ambiguous, or assume Twitch if it doesn't match YT 11 chars.
  }

  // Raw YouTube video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { id: trimmed, platform: 'youtube' };
  }

  // Full URL patterns
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);

    // YouTube
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
      const vParam = url.searchParams.get('v');
      if (vParam) return { id: vParam, platform: 'youtube' };

      if (url.hostname.includes('youtu.be')) {
        const path = url.pathname.slice(1);
        if (path) return { id: path, platform: 'youtube' };
      }

      const liveMatch = url.pathname.match(/\/live\/([a-zA-Z0-9_-]+)/);
      if (liveMatch) return { id: liveMatch[1] as string, platform: 'youtube' };
    }

    // Twitch
    if (url.hostname.includes('twitch.tv')) {
      const path = url.pathname.slice(1).split('/')[0];
      if (path && path !== 'directory' && path !== 'videos') {
        return { id: path as string, platform: 'twitch' };
      }
    }
  } catch {
    // Not a valid URL
  }

  return null;
}

export function StreamInfo({
  platform,
  streamId,
  streamTitle,
  isLive,
  chatAvailable,
  error,
  disabled,
  onStreamIdChange,
  onCheck,
}: StreamInfoProps) {
  const [manualInput, setManualInput] = useState('');

  const handleManualCheck = () => {
    const result = extractStreamInfo(manualInput);
    if (result) {
      onStreamIdChange(result.id, result.platform);
      onCheck(result.id, result.platform);
    }
  };

  const isTwitch = platform === 'twitch';
  const liveColor = isTwitch ? 'bg-brand-primary' : 'bg-brand-error';
  const liveTextColor = isTwitch ? 'text-brand-primary' : 'text-brand-error';

  return (
    <div className="space-y-2">
      {/* Manual URL input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder={`Paste livestream URL (${platform === 'youtube' ? 'YouTube' : 'Twitch'
            })...`}
          disabled={disabled}
          className="flex-1 px-2.5 py-1.5 text-xs bg-brand-card border border-brand-border rounded-md
            text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-primary/50
            disabled:opacity-50 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleManualCheck();
          }}
        />
        <button
          onClick={handleManualCheck}
          disabled={disabled || !manualInput.trim()}
          className="px-2.5 py-1.5 text-xs font-medium bg-brand-card border border-brand-border
            rounded-md text-brand-muted hover:text-brand-text hover:border-brand-muted
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Check
        </button>
      </div>

      {/* Stream info display */}
      {streamId && (
        <div className="px-3 py-2 bg-brand-card rounded-lg border border-brand-border space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${isLive ? `${liveColor} animate-pulse-slow` : 'bg-brand-muted'
                  }`}
              />
              <span className={`text-2xs font-medium uppercase tracking-wider ${isLive ? liveTextColor : 'text-brand-muted'
                }`}>
                {isLive ? 'Live' : 'Not Live'}
              </span>
            </div>
            {isLive && (
              <div className="flex items-center gap-1.5">
                <span className={`text-2xs ${chatAvailable ? 'text-brand-success' : 'text-brand-muted'
                  }`}>
                  Chat {chatAvailable ? 'âœ“' : 'âœ—'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-2xs text-brand-error px-1">{error}</p>
      )}
    </div>
  );
}


import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_SESSION_STATE, MIN_DELAY_SECONDS, MAX_DELAY_SECONDS, DAILY_QUOTA_LIMIT, QUOTA_PER_INSERT } from '@/lib/types';
import type { SessionState, Platform } from '@/lib/types';

export default function App() {
  const [authStatus, setAuthStatus] = useState({ youtube: false, twitch: false });
  const [authLoading, setAuthLoading] = useState({ youtube: false, twitch: false });
  const [authError, setAuthError] = useState({ youtube: null as string | null, twitch: null as string | null });
  const [activePlatform, setActivePlatform] = useState<Platform | 'both'>('both');

  const [streams, setStreams] = useState({
    youtube: { id: '', title: '', isLive: false, chatAvailable: false, error: null as string | null },
    twitch: { id: '', title: '', isLive: false, chatAvailable: false, error: null as string | null }
  });

  const [messages, setMessages] = useState<string[]>(['']);
  const [delaySeconds, setDelaySeconds] = useState(10);
  const [autoClaimBonus, setAutoClaimBonus] = useState(false);
  const [twitchBonusClaimCount, setTwitchBonusClaimCount] = useState(0);

  // Load auto-claim setting and claim count
  useEffect(() => {
    chrome.storage.local.get(['twitchAutoClaimBonus', 'twitchBonusClaimCount'], (result) => {
      if (result.twitchAutoClaimBonus === true) setAutoClaimBonus(true);
      if (typeof result.twitchBonusClaimCount === 'number') setTwitchBonusClaimCount(result.twitchBonusClaimCount);
    });

    const listener = (changes: any, area: string) => {
      if (area === 'local' && changes.twitchBonusClaimCount) {
        setTwitchBonusClaimCount(changes.twitchBonusClaimCount.newValue || 0);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const [session, setSession] = useState<SessionState>(DEFAULT_SESSION_STATE);
  const isRunning = session.status === 'running';

  // ---- Theming / Initial Auto-fill ----
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs[0]?.url) {
        setActivePlatform('both');
        return;
      }
      const url = tabs[0].url;
      try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('twitch.tv')) {
          setActivePlatform('twitch');
          document.body.classList.add('theme-twitch');
          document.body.classList.remove('theme-youtube');

          const path = parsed.pathname.slice(1).split('/')[0];
          if (path && path !== 'directory' && path !== 'videos') {
            setStreams(prev => ({ ...prev, twitch: { ...prev.twitch, id: path } }));
          }
        } else if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
          setActivePlatform('youtube');
          document.body.classList.add('theme-youtube');
          document.body.classList.remove('theme-twitch');

          let id: string | null = parsed.searchParams.get('v');
          if (!id && parsed.hostname.includes('youtu.be')) id = parsed.pathname.slice(1);
          if (!id) {
            const liveMatch = parsed.pathname.match(/\/live\/([a-zA-Z0-9_-]+)/);
            if (liveMatch) id = liveMatch[1] || null;
          }
          if (id) {
            setStreams(prev => ({ ...prev, youtube: { ...prev.youtube, id: id as string } }));
          }
        } else {
          setActivePlatform('both');
        }
      } catch {
        setActivePlatform('both');
      }
    });
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response: any) => {
      if (chrome.runtime.lastError || !response) return;

      if (response.payload) {
        setSession(response.payload);
        if (response.payload.status === 'running' || response.payload.status === 'stopped') {
          if (response.payload.messages?.length > 0) setMessages(response.payload.messages);
          if (response.payload.delaySeconds > 0) setDelaySeconds(response.payload.delaySeconds);

          setStreams(prev => ({
            youtube: {
              id: response.payload.youtubeStreamId || '',
              title: response.payload.youtubeTitle || '',
              isLive: response.payload.youtubeEnabled && response.payload.status === 'running',
              chatAvailable: response.payload.youtubeEnabled && response.payload.status === 'running',
              error: null
            },
            twitch: {
              id: response.payload.twitchStreamId || '',
              title: response.payload.twitchTitle || '',
              isLive: response.payload.twitchEnabled && response.payload.status === 'running',
              chatAvailable: response.payload.twitchEnabled && response.payload.status === 'running',
              error: null
            }
          }));
        }
      }

      if (response.auth) {
        setAuthStatus(response.auth);
      }
    });
  }, []);

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === 'STATUS_UPDATE' && message.payload) {
        setSession(message.payload);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleConnect = useCallback((platform: Platform) => {
    setAuthError(prev => ({ ...prev, [platform]: null }));
    setAuthLoading(prev => ({ ...prev, [platform]: true }));
    chrome.runtime.sendMessage({ type: 'CONNECT_AUTH', payload: { platform } }, (response: any) => {
      setAuthLoading(prev => ({ ...prev, [platform]: false }));
      if (chrome.runtime.lastError) {
        setAuthError(prev => ({ ...prev, [platform]: chrome.runtime.lastError?.message || 'Unknown error' }));
        return;
      }
      if (response?.payload) {
        if (response.payload.error) {
          setAuthError(prev => ({ ...prev, [platform]: response.payload.error }));
          return;
        }
        setAuthStatus(prev => ({ ...prev, [platform]: response.payload.connected }));
        if (response.payload.connected && streams[platform].id) {
          checkStream(streams[platform].id, platform);
        }
      }
    });
  }, [streams]);

  const handleDisconnect = useCallback((platform: Platform) => {
    setAuthLoading(prev => ({ ...prev, [platform]: true }));
    chrome.runtime.sendMessage({ type: 'DISCONNECT_AUTH', payload: { platform } }, (response: any) => {
      setAuthLoading(prev => ({ ...prev, [platform]: false }));
      if (chrome.runtime.lastError) return;
      if (response?.payload) {
        setAuthStatus(prev => ({ ...prev, [platform]: response.payload.connected }));
      }
    });
  }, []);

  const checkStream = useCallback((id: string, platform: Platform) => {
    setStreams(prev => ({ ...prev, [platform]: { ...prev[platform], error: null } }));
    chrome.runtime.sendMessage(
      { type: 'CHECK_STREAM', payload: { streamId: id, platform } },
      (response: any) => {
        if (chrome.runtime.lastError) {
          setStreams(prev => ({ ...prev, [platform]: { ...prev[platform], error: 'Could not check stream.' } }));
          return;
        }
        if (response?.payload) {
          const p = response.payload;
          setStreams(prev => ({
            ...prev,
            [platform]: {
              ...prev[platform],
              title: p.title || '',
              isLive: p.isLive,
              chatAvailable: !!p.liveChatId,
              error: p.error || null
            }
          }));
        }
      },
    );
  }, []);

  const handleStreamIdChange = useCallback((id: string, platform: Platform) => {
    setStreams(prev => ({ ...prev, [platform]: { ...prev[platform], id } }));
  }, []);

  const handleStart = useCallback(() => {
    const validMessages = messages.filter((m) => m.trim().length > 0);
    if (validMessages.length === 0) return;
    if (delaySeconds < MIN_DELAY_SECONDS || delaySeconds > MAX_DELAY_SECONDS) return;
    if (!streams.youtube.id && !streams.twitch.id) return;

    chrome.runtime.sendMessage({
      type: 'START_SESSION',
      payload: {
        youtubeStreamId: (activePlatform === 'youtube' || activePlatform === 'both') && authStatus.youtube && streams.youtube.isLive && streams.youtube.chatAvailable ? streams.youtube.id : '',
        twitchStreamId: (activePlatform === 'twitch' || activePlatform === 'both') && authStatus.twitch && streams.twitch.isLive && streams.twitch.chatAvailable ? streams.twitch.id : '',
        messages: validMessages,
        delaySeconds,
      },
    });
  }, [messages, delaySeconds, streams, authStatus, activePlatform]);

  const handleStop = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'STOP_SESSION' });
  }, []);

  const validMessages = messages.filter((m) => m.trim().length > 0);
  const validDelay = delaySeconds >= MIN_DELAY_SECONDS && delaySeconds <= MAX_DELAY_SECONDS;

  const hasValidYoutube = (activePlatform === 'youtube' || activePlatform === 'both') && authStatus.youtube && streams.youtube.id && streams.youtube.isLive && streams.youtube.chatAvailable;
  const hasValidTwitch = (activePlatform === 'twitch' || activePlatform === 'both') && authStatus.twitch && streams.twitch.id && streams.twitch.isLive && streams.twitch.chatAvailable;

  const canStart = (hasValidYoutube || hasValidTwitch) && validMessages.length > 0 && validDelay && !isRunning;

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold text-brand-text tracking-tight">
          Live Stream Chat Sender
        </h1>
      </div>

      {/* YouTube Section */}
      {(activePlatform === 'youtube' || activePlatform === 'both') && (
        <div className="p-2 border border-brand-border rounded-lg bg-brand-surface/30">
          <div className="space-y-1 mb-2">
            <AuthSection
              platform="youtube"
              connected={authStatus.youtube}
              loading={authLoading.youtube}
              onConnect={() => handleConnect('youtube')}
              onDisconnect={() => handleDisconnect('youtube')}
            />
            {authError.youtube && <p className="text-2xs text-red-400 px-1">{authError.youtube}</p>}
          </div>
          <StreamInfo
            platform="youtube"
            streamId={streams.youtube.id}
            streamTitle={streams.youtube.title}
            isLive={streams.youtube.isLive}
            chatAvailable={streams.youtube.chatAvailable}
            error={streams.youtube.error}
            disabled={isRunning}
            onStreamIdChange={handleStreamIdChange}
            onCheck={checkStream}
          />
        </div>
      )}

      {/* Twitch Section */}
      {(activePlatform === 'twitch' || activePlatform === 'both') && (
        <div className="p-2 border border-brand-border rounded-lg bg-brand-surface/30">
          <div className="space-y-1 mb-2">
            <AuthSection
              platform="twitch"
              connected={authStatus.twitch}
              loading={authLoading.twitch}
              onConnect={() => handleConnect('twitch')}
              onDisconnect={() => handleDisconnect('twitch')}
            />
            {authError.twitch && <p className="text-2xs text-red-400 px-1">{authError.twitch}</p>}
          </div>
          <StreamInfo
            platform="twitch"
            streamId={streams.twitch.id}
            streamTitle={streams.twitch.title}
            isLive={streams.twitch.isLive}
            chatAvailable={streams.twitch.chatAvailable}
            error={streams.twitch.error}
            disabled={isRunning}
            onStreamIdChange={handleStreamIdChange}
            onCheck={checkStream}
          />
          {/* Auto-claim bonus toggle */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex flex-col">
              <span className="text-xs text-brand-muted">Auto-claim bonus</span>
              {twitchBonusClaimCount > 0 && (
                <span className="text-2xs text-brand-success mt-0.5">Claimed {twitchBonusClaimCount} times</span>
              )}
            </div>
            <button
              onClick={() => {
                const next = !autoClaimBonus;
                setAutoClaimBonus(next);
                chrome.storage.local.set({ twitchAutoClaimBonus: next });
              }}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                autoClaimBonus ? 'bg-brand-primary' : 'bg-brand-border'
              }`}
              aria-label="Toggle auto-claim Twitch bonus"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  autoClaimBonus ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      <div className="h-px bg-brand-border" />

      {/* Messages */}
      <MessageList
        messages={messages}
        onChange={setMessages}
        disabled={isRunning}
      />

      {/* Delay */}
      <DelayInput
        value={delaySeconds}
        onChange={setDelaySeconds}
        disabled={isRunning}
      />

      {/* Controls */}
      <Controls
        status={session.status}
        canStart={!!canStart}
        onStart={handleStart}
        onStop={handleStop}
        isTwitch={!!(hasValidTwitch && !hasValidYoutube)}
      />

      {/* Status */}
      <StatusDisplay session={session} />
    </div>
  );
}

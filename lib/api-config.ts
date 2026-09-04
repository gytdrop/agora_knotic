/**
 * EchoSphere API & WebSocket URL Configuration
 * 
 * Provides unified URL resolution with automatic protocol upgrades (HTTPS / WSS)
 * for production environments while maintaining seamless relative-path fallback
 * for local development and emergency localhost failover.
 */

/**
 * Returns the fully-qualified API URL for a given endpoint path.
 * If NEXT_PUBLIC_API_URL is unset (e.g. running on localhost or single-origin Vercel),
 * returns the clean relative path so the browser requests the current origin directly.
 * In production, automatically upgrades insecure http:// to https:// (except localhost).
 */
export function getApiUrl(path: string = ''): string {
  const rawBase = process.env.NEXT_PUBLIC_API_URL?.trim() || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (!rawBase) {
    return cleanPath;
  }

  let base = rawBase.replace(/\/+$/, '');
  const isProd = process.env.NODE_ENV === 'production';
  const isClientHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (
    (isProd || isClientHttps) &&
    base.startsWith('http://') &&
    !base.includes('localhost') &&
    !base.includes('127.0.0.1')
  ) {
    base = base.replace(/^http:\/\//i, 'https://');
  }

  return `${base}${cleanPath}`;
}

/**
 * Returns the WebSocket URL for real-time telemetry or socket transports.
 * If NEXT_PUBLIC_WS_URL is unset, automatically derives wss:// or ws:// from window.location.
 * In production, automatically ensures wss:// is used.
 */
export function getWsUrl(path: string = ''): string {
  const rawBase = process.env.NEXT_PUBLIC_WS_URL?.trim() || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (!rawBase) {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}${cleanPath}`;
    }
    return cleanPath;
  }

  let base = rawBase.replace(/\/+$/, '');
  const isProd = process.env.NODE_ENV === 'production';
  const isClientHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (
    (isProd || isClientHttps) &&
    base.startsWith('ws://') &&
    !base.includes('localhost') &&
    !base.includes('127.0.0.1')
  ) {
    base = base.replace(/^ws:\/\//i, 'wss://');
  }

  return `${base}${cleanPath}`;
}

export const DEFAULT_AGORA_APP_ID = 'ea58f23328c647f8a64a68ed880657c7';
export const DEFAULT_AGORA_APP_CERTIFICATE = '83a1d570d734408ebbdf8de869964688';

/**
 * Retrieves the client-accessible Agora App ID.
 * Supports both standard NEXT_PUBLIC_AGORA_APP_ID and AGORA_APP_ID with fallback.
 */
export function getAgoraAppId(): string {
  return (
    process.env.AGORA_APP_ID ||
    process.env.NEXT_PUBLIC_AGORA_APP_ID ||
    DEFAULT_AGORA_APP_ID
  );
}

/**
 * Server-side helper to safely retrieve Agora App ID and Certificate with fallbacks.
 */
export function getServerAgoraCredentials(): { appId: string; appCertificate: string } {
  const appId =
    process.env.AGORA_APP_ID ||
    process.env.NEXT_PUBLIC_AGORA_APP_ID ||
    DEFAULT_AGORA_APP_ID;
  const appCertificate =
    process.env.AGORA_APP_CERTIFICATE ||
    process.env.NEXT_AGORA_APP_CERTIFICATE ||
    DEFAULT_AGORA_APP_CERTIFICATE;

  return { appId, appCertificate };
}

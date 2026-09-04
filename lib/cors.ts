/**
 * EchoSphere Cross-Origin Resource Sharing (CORS) Configuration
 * 
 * Configures secure CORS headers for backend API routes when accessed by the
 * Vercel frontend or other remote clients, while permanently whitelisting
 * localhost for development and offline demo fallback.
 */

import { NextResponse } from 'next/server';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

/**
 * Normalizes an origin string (strips trailing slash, trims whitespace).
 */
function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

/**
 * Returns the set of all allowed origins based on environment configuration.
 */
export function getAllowedOrigins(): string[] {
  const allowed = new Set<string>(DEFAULT_ALLOWED_ORIGINS);

  if (process.env.CORS_ALLOWED_ORIGIN) {
    allowed.add(normalizeOrigin(process.env.CORS_ALLOWED_ORIGIN));
  }

  if (process.env.CORS_ALLOWED_ORIGINS) {
    process.env.CORS_ALLOWED_ORIGINS.split(',')
      .map((o) => normalizeOrigin(o))
      .filter(Boolean)
      .forEach((o) => allowed.add(o));
  }

  if (process.env.FRONTEND_URL) {
    allowed.add(normalizeOrigin(process.env.FRONTEND_URL));
  }

  if (process.env.VERCEL_URL) {
    allowed.add(`https://${normalizeOrigin(process.env.VERCEL_URL)}`);
  }

  return Array.from(allowed);
}

/**
 * Determines whether a given incoming origin is allowed.
 */
export function isOriginAllowed(origin?: string | null): boolean {
  if (!origin) return true; // Server-to-server or same-origin requests

  const normalized = normalizeOrigin(origin);

  // If explicit wildcard configured
  if (process.env.CORS_ALLOWED_ORIGIN === '*') {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(normalized)) {
    return true;
  }

  // Allow any *.vercel.app domain if FRONTEND_URL or CORS_ALLOWED_ORIGIN has not locked it down
  if (normalized.endsWith('.vercel.app')) {
    return true;
  }

  return false;
}

/**
 * Generates CORS headers for an incoming request.
 */
export function getCorsHeaders(request?: Request | null): Record<string, string> {
  const origin = request?.headers.get('origin');
  const allowed = isOriginAllowed(origin);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With, Accept, Accept-Version, X-Api-Version',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && allowed) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  } else if (!origin) {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

/**
 * Handles OPTIONS preflight requests returning 204 No Content with appropriate headers.
 */
export function handleCorsPreflight(request?: Request | null): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

/**
 * Attaches CORS headers to a NextResponse.
 */
export function withCors(response: NextResponse, request?: Request | null): NextResponse {
  const corsHeaders = getCorsHeaders(request);
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

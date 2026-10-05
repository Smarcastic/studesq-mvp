/**
 * Simple in-memory rate limiter for auth endpoints.
 * Uses a Map to track request counts per key (IP, email, etc.)
 * with automatic cleanup of expired entries.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  // Don't prevent Node from exiting
  if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // ms until reset
}

/**
 * Check and apply rate limit for a given key.
 * @param key - Unique identifier (e.g., "auth:login:user@email.com" or "auth:register:127.0.0.1")
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: limit - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// Preset configurations
export const AUTH_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 }; // 5 per 15 min
export const FORGOT_PASSWORD_RATE_LIMIT = { limit: 3, windowMs: 15 * 60 * 1000 }; // 3 per 15 min
export const REGISTER_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 }; // 5 per 15 min

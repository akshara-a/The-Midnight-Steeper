/**
 * Zero-Auth Local Session Identity Management for The Midnight Steeper.
 * Enforces pure local session persistence via localStorage and persistent cookie.
 * Never displays a login screen or requires credentials.
 */
export function getPlayerId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const STORAGE_KEY = 'midnight_steeper_session_id';
  const COOKIE_KEY = 'midnight_steeper_session';

  // 1. Try reading from localStorage
  let playerId = localStorage.getItem(STORAGE_KEY);

  // 2. Fallback to cookie check if localStorage is missing
  if (!playerId) {
    const match = document.cookie.match(new RegExp('(^| )' + COOKIE_KEY + '=([^;]+)'));
    if (match) {
      playerId = decodeURIComponent(match[2]);
      try {
        localStorage.setItem(STORAGE_KEY, playerId);
      } catch {}
    }
  }

  // 3. Generate new session UUID if completely fresh visitor
  if (!playerId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      playerId = crypto.randomUUID();
    } else {
      playerId = 'cosmic-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
    }

    try {
      localStorage.setItem(STORAGE_KEY, playerId);
    } catch {}

    // Persist as a 365-day cookie for resilient cross-tab/mobile local session
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(playerId)}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return playerId;
}

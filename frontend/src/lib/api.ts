import { getPlayerId } from './identity';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface Loot {
  rarity: string;
  item_name: string;
  review: string;
  ingredients?: string[];
  base_rarity?: string;
  customers_served?: number;
  customers_target?: number;
  quota_met?: boolean;
  bonus_xp?: number;
}

export interface UserProfile {
  player_id: string;
  consistency_score: number;
  inventory: Array<Partial<Loot> & { rarity: string; item_name: string; review: string }>;
  created_at?: string;
}

export interface BrewItem {
  brew_id: string;
  player_id: string;
  ingredients: string[];
  status: 'brewing' | 'ready' | 'claimed';
  created_at: string;
  ready_time: string;
  duration_seconds: number;
  duration_key?: string | null;
  customers_target?: number;
  customer_arrivals?: number[];
  loot?: Loot | null;
}

/**
 * Fetch wrapper that automatically injects the X-Player-ID identity header
 * Supports both online relative proxies and explicit remote backend endpoints.
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const playerId = getPlayerId();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (playerId) {
    headers.set('X-Player-ID', playerId);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      errorDetail = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function fetchMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/me');
}

export async function fetchCurrentBrew(): Promise<{ brew: BrewItem | null }> {
  return apiFetch<{ brew: BrewItem | null }>('/api/brew/current');
}

export async function startBrew(
  ingredients: string[],
  durationKey?: string
): Promise<{ message: string; brew: BrewItem }> {
  return apiFetch<{ message: string; brew: BrewItem }>('/api/brew/start', {
    method: 'POST',
    body: JSON.stringify({ ingredients, duration_key: durationKey }),
  });
}

export async function claimBrew(brewId?: string): Promise<{
  message: string;
  loot: Loot;
}> {
  return apiFetch('/api/brew/claim', {
    method: 'POST',
    body: JSON.stringify({ brew_id: brewId }),
  });
}

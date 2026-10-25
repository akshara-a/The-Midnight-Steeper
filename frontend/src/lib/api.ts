import { getPlayerId } from './identity';
import type { SensoryProfile, TabPFNAttributions } from './tabpfn';

export type { SensoryProfile, TabPFNAttributions };

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
  sensory?: SensoryProfile;
  sleepiness_score?: number;
  attributions?: TabPFNAttributions;
  probabilities?: { common: number; rare: number; legendary: number };
  mystery_index?: number;
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

  const response = await fetch(url, { credentials: 'include', ...options, headers });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }
  return response.json();
}

export async function fetchProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/me');
}

export const fetchMe = fetchProfile;

export async function fetchCurrentBrew(): Promise<{ brew: BrewItem | null }> {
  return apiFetch<{ brew: BrewItem | null }>('/api/brew/current');
}

export async function startBrew(ingredients: string[], durationKey?: string): Promise<{ message: string; brew: BrewItem }> {
  return apiFetch<{ message: string; brew: BrewItem }>('/api/brew/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients, duration_key: durationKey }),
  });
}

export async function claimBrew(brewId?: string): Promise<{ message: string; loot: Loot }> {
  return apiFetch<{ message: string; loot: Loot }>('/api/brew/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brew_id: brewId }),
  });
}

export async function fastForwardBrew(): Promise<{ message: string; brew: BrewItem | null }> {
  return apiFetch<{ message: string; brew: BrewItem | null }>('/api/brew/fast-forward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

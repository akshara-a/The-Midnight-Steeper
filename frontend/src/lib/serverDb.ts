export interface InMemUser {
  player_id: string;
  consistency_score: number;
  inventory: Array<{
    rarity: string;
    item_name: string;
    review: string;
    audio: string;
    ingredients?: string[];
  }>;
  created_at: string;
}

export interface InMemBrew {
  brew_id: string;
  player_id: string;
  ingredients: string[];
  status: 'brewing' | 'ready' | 'claimed';
  created_at: string;
  ready_time: string;
  duration_seconds: number;
  duration_key?: string;
  customers_target?: number;
  customer_arrivals?: number[];
  loot?: {
    rarity: string;
    item_name: string;
    review: string;
    audio: string;
    ingredients?: string[];
    base_rarity?: string;
    customers_served?: number;
    customers_target?: number;
    quota_met?: boolean;
    bonus_xp?: number;
  } | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _memUsers: Map<string, InMemUser> | undefined;
  // eslint-disable-next-line no-var
  var _memBrews: Map<string, InMemBrew> | undefined;
}

if (!global._memUsers) {
  global._memUsers = new Map<string, InMemUser>();
}
if (!global._memBrews) {
  global._memBrews = new Map<string, InMemBrew>();
}

export async function getDatabase() {
  return {
    memUsers: global._memUsers!,
    memBrews: global._memBrews!,
  };
}

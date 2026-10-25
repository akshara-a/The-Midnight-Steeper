/** Kid-facing content for Sunny the Sloth's Tea Party (ages 5-10). */

export interface Ingredient {
  name: string;
  icon: string;
  blurb: string;
  /** Candy color used for Sunny's fur, tea and decorations */
  color: string;
}

export const LEAVES: Ingredient[] = [
  { name: 'Moon Mint', icon: '🌿', blurb: 'Cool and fresh like a minty breeze', color: '#34d399' },
  { name: 'Sleepy Lavender', icon: '🪻', blurb: 'Smells like a cuddly bedtime', color: '#a78bfa' },
  { name: 'Sunny Daisy', icon: '🌼', blurb: 'A warm hug from the sun', color: '#fbbf24' },
  { name: 'Rose Petal', icon: '🌹', blurb: 'Soft, sweet and super pink', color: '#f472b6' },
  { name: 'Berry Bloom', icon: '🫐', blurb: 'Little blue berries, yum!', color: '#60a5fa' },
  { name: 'Orange Blossom', icon: '🍊', blurb: 'Zingy and happy', color: '#fb923c' },
];

export const TREATS: Ingredient[] = [
  { name: 'Honey Drop', icon: '🍯', blurb: 'Golden and gooey', color: '#f59e0b' },
  { name: 'Cookie Crumble', icon: '🍪', blurb: 'Crunchy cookie sprinkles', color: '#b45309' },
  { name: 'Strawberry Swirl', icon: '🍓', blurb: 'Sweet pink strawberries', color: '#fb7185' },
  { name: 'Lemon Sparkle', icon: '🍋', blurb: 'Tangy and bright', color: '#facc15' },
  { name: 'Vanilla Cloud', icon: '☁️', blurb: 'Fluffy as a cloud', color: '#93c5fd' },
  { name: 'Star Sugar', icon: '⭐', blurb: 'Twinkly sugar stars', color: '#c084fc' },
];

export const ALL_INGREDIENTS = [...LEAVES, ...TREATS];

export const iconFor = (name: string) => ALL_INGREDIENTS.find((i) => i.name === name)?.icon ?? '🍵';

/** Nap lengths map to the server's steep tiers (quick, 1h, 4h, 12h). */
export const NAPS = [
  { key: 'demo', label: '⚡ Judge Demo', sub: '10 seconds', icon: '⚡' },
  { key: 'quick', label: 'Tiny Nap', sub: '2 minutes', icon: '😴' },
  { key: '1h', label: 'Cat Nap', sub: '1 hour', icon: '🐱' },
  { key: '4h', label: 'Afternoon Nap', sub: '4 hours', icon: '☀️' },
  { key: '12h', label: 'Sleepover', sub: 'all night', icon: '🌙' },
];

export const FRIENDS = [
  { name: 'Bunny', icon: '🐰' },
  { name: 'Fox', icon: '🦊' },
  { name: 'Bear', icon: '🐻' },
  { name: 'Owl', icon: '🦉' },
  { name: 'Frog', icon: '🐸' },
  { name: 'Penguin', icon: '🐧' },
  { name: 'Hedgehog', icon: '🦔' },
  { name: 'Panda', icon: '🐼' },
  { name: 'Koala', icon: '🐨' },
  { name: 'Turtle', icon: '🐢' },
];

export const RARITY_KID: Record<string, { label: string; color: string; stars: number }> = {
  common: { label: 'Cozy', color: '#4ade80', stars: 1 },
  rare: { label: 'Sparkly', color: '#f472b6', stars: 2 },
  legendary: { label: 'Magical', color: '#fbbf24', stars: 3 },
};

export const rarityKid = (rarity: string) => RARITY_KID[rarity.toLowerCase()] ?? RARITY_KID.common;

export const RANKS = ['Sleepy Seed', 'Tea Helper', 'Cozy Cook', 'Nap Wizard', 'Dream Hero', 'Moon Master', 'Sloth Legend'];
export const getRank = (level: number) => RANKS[Math.min(RANKS.length - 1, level - 1)];

export const POKE_LINES = [
  'Hehe! That tickles!',
  'Boop! Right on the nose!',
  'Ooh, I love tea!',
  'Slow and steady wins the nap!',
  'Wheee! Do it again!',
  'I am a very fluffy sloth.',
];

export const SLEEP_MUMBLES = [
  'Zzz... five more minutes...',
  'Mmm... tea... zzz...',
  'Shhh... I am dreaming of cookies...',
  'Zzz... go to sleep too...',
];

export const FIFTH_POKE = 'Okay, okay! Now I am getting sleepy. Time to go to sleep!';

/** Talking Tom style Bath Time quotes */
export const BATH_LINES = [
  'Splish splash! The warm water is so cozy!',
  'Hehe! Look at all the suds on my ears!',
  'Squeak squeak! My rubber ducky loves bubbles too!',
  'Ahhh... smells like sweet lavender bubbles!',
  'Wiggle wiggle! Scrub behind my sloth claws!',
  'Yay! I am the cleanest, shiniest sloth in the forest!',
];

/** Snacks kids can feed Sunny like Talking Tom */
export interface SnackItem {
  id: string;
  name: string;
  icon: string;
  soundText: string;
  xp: number;
}

export const SNACKS: SnackItem[] = [
  { id: 'strawberry', name: 'Sweet Berry', icon: '🍓', soundText: 'Mmm, sweet and juicy strawberries!', xp: 15 },
  { id: 'cookie', name: 'Choco Cookie', icon: '🍪', soundText: 'Crunch crunch crunch! Chocolatey goodness!', xp: 20 },
  { id: 'apple', name: 'Crisp Apple', icon: '🍎', soundText: 'Chomp! So fresh and crisp!', xp: 15 },
  { id: 'honey', name: 'Honey Spoon', icon: '🍯', soundText: 'Slurp! Golden and sticky sweet!', xp: 25 },
  { id: 'watermelon', name: 'Watermelon', icon: '🍉', soundText: 'Slurp! Cool and refreshing!', xp: 15 },
  { id: 'cupcake', name: 'Star Cupcake', icon: '🧁', soundText: 'Nom nom! Fluffy with rainbow sprinkles!', xp: 30 },
];

/** Sunny's silly jokes for talking mode */
export const SUNNY_JOKES = [
  'Why do sloths take slow baths? ... Because they love soaking up every bubble! 🛁',
  'What does a cloud wear under its raincoat? ... Thunderwear! ⚡😂',
  'Why did the teddy bear say no to dessert? ... Because it was already stuffed! 🧸',
  'What do sloths drink right before bed? ... Chamomile zzzz-tea! 🍵💤',
  'Why are fish so smart? ... Because they swim in schools! 🐟🎒',
  'What did one wall say to the other wall? ... I will meet you at the corner! 🏠',
];

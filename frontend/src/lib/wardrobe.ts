export type HatId = 'none' | 'wizard' | 'crown' | 'sakura' | 'chef' | 'beanie' | 'nightcap';
export type GlassesId = 'none' | 'glasses' | 'sunglasses' | 'sleepmask' | 'monocle';
export type NeckwearId = 'none' | 'bowtie' | 'scarf' | 'bell' | 'lei';

export interface WardrobeOutfit {
  hat: HatId;
  glasses: GlassesId;
  neck: NeckwearId;
}

export const DEFAULT_WARDROBE: WardrobeOutfit = {
  hat: 'none',
  glasses: 'none',
  neck: 'none',
};

export interface WardrobeItemConfig<T extends string> {
  id: T;
  name: string;
  icon: string;
  tag: string;
  description: string;
  color: string;
  quote: string;
}

export const WARDROBE_HATS: WardrobeItemConfig<HatId>[] = [
  {
    id: 'none',
    name: 'Natural Ears',
    icon: '🦥',
    tag: 'Au Naturel',
    description: 'Sunny’s fluffy natural sloth ears enjoying the gentle tea breeze.',
    color: '#e2e8f0',
    quote: 'Ah, fresh air on my furry sloth ears!',
  },
  {
    id: 'wizard',
    name: 'Star Wizard Hat',
    icon: '🧙‍♂️',
    tag: 'Cosmic Magic',
    description: 'Pointed midnight velvet cone with shimmering gold stars and celestial moon buckle.',
    color: '#6366f1',
    quote: 'Abracadabra! May your tea steep with sweet starlight dreams! ✨',
  },
  {
    id: 'crown',
    name: 'Tea Monarch Crown',
    icon: '👑',
    tag: 'Royal Steeper',
    description: 'Gleaming golden coronet studded with crimson ruby and sapphire gemstone beads.',
    color: '#f59e0b',
    quote: 'All hail King Sunny! Sovereign of the Cozy Canopy and Midnight Tea! 👑',
  },
  {
    id: 'sakura',
    name: 'Sakura Floral Wreath',
    icon: '🌸',
    tag: 'Spring Garden',
    description: 'Handwoven garland of fragrant cherry blossoms and tender green jade tea leaves.',
    color: '#f472b6',
    quote: 'I feel like a magical woodland fairy! Do I look pretty? 🌸',
  },
  {
    id: 'chef',
    name: 'Master Baker Toque',
    icon: '🧑‍🍳',
    tag: 'Gourmet Pastry',
    description: 'Crisp puffy white culinary hat embroidered with a mini green tea leaf.',
    color: '#38bdf8',
    quote: 'Chef Sunny is here! Today’s special: warm chamomile biscuits and tea! 🍵',
  },
  {
    id: 'beanie',
    name: 'Cozy Knitted Beanie',
    icon: '🧶',
    tag: 'Winter Warmth',
    description: 'Soft ribbed rose-wool beanie topped with a giant bouncy white pom-pom.',
    color: '#ec4899',
    quote: 'So warm and snuggly! My ears are safe from the midnight chill! 🧶',
  },
  {
    id: 'nightcap',
    name: 'Classic Sleepy Cap',
    icon: '🌙',
    tag: 'Bedtime Classic',
    description: 'Draped velvet nightcap with a fluffy white cuff for long peaceful snoozes.',
    color: '#8b5cf6',
    quote: 'Yaaawn... ready to snuggle up and dream of sweet tea clouds! 🌙',
  },
];

export const WARDROBE_GLASSES: WardrobeItemConfig<GlassesId>[] = [
  {
    id: 'none',
    name: 'Natural Eyes',
    icon: '👀',
    tag: 'Bare Eyes',
    description: 'Sunny’s big soulful dark eyes and classic chocolate eye mask bands.',
    color: '#e2e8f0',
    quote: 'Crystal clear vision to spot the freshest tea leaves in the tree! 👀',
  },
  {
    id: 'glasses',
    name: 'Tea Scholar Spectacles',
    icon: '👓',
    tag: 'Wise Reader',
    description: 'Round wireframe golden spectacles with gentle light-reflecting glass lenses.',
    color: '#eab308',
    quote: 'Aha! With my reading glasses, I can decipher the ancient tea scrolls! 👓',
  },
  {
    id: 'sunglasses',
    name: 'Star Rocker Shades',
    icon: '🕶️',
    tag: 'Cool Star',
    description: 'Funky star-shaped hot pink frames with ultra-cool dark tinted mirror lenses.',
    color: '#ec4899',
    quote: 'Check out these rocking star shades! Sloth superstar in the house! 🎸⭐',
  },
  {
    id: 'sleepmask',
    name: 'Silk Sleep Mask',
    icon: '😴',
    tag: 'Nap Ready',
    description: 'Soft lavender silk eye mask resting gently on the forehead with embroidered lashes.',
    color: '#a855f7',
    quote: 'Rest mode engaged! Wake me only when the kettle whistles! 😴',
  },
  {
    id: 'monocle',
    name: 'Aristocrat Monocle',
    icon: '🧐',
    tag: 'Fancy Connoisseur',
    description: 'Single polished glass lens rimmed in gold with a graceful dangling chain.',
    color: '#f59e0b',
    quote: 'Indubitably! A midnight blend of distinguished pedigree and bouquet! 🧐',
  },
];

export const WARDROBE_NECK: WardrobeItemConfig<NeckwearId>[] = [
  {
    id: 'none',
    name: 'Bare Neck',
    icon: '🍃',
    tag: 'Free & Cozy',
    description: 'Natural velvety sloth neck and warm chamomile chest fur.',
    color: '#e2e8f0',
    quote: 'Free and breezy around the neck!',
  },
  {
    id: 'bowtie',
    name: 'Dapper Bow Tie',
    icon: '🎀',
    tag: 'Gala Ready',
    description: 'Crisp crimson silk bow tie with golden embroidered polka-dot accents.',
    color: '#ef4444',
    quote: 'Look how dapper I am! Ready for the grand Midnight Tea Gala! 🎀',
  },
  {
    id: 'scarf',
    name: 'Chunky Wool Scarf',
    icon: '🧣',
    tag: 'Toasty Warm',
    description: 'Double-wrapped spiced amber and ivory wool scarf with fringe edges.',
    color: '#f97316',
    quote: 'Wrap it snug! A warm throat makes my bedtime lullaby sound extra sweet! 🧣',
  },
  {
    id: 'bell',
    name: 'Golden Tea Bell',
    icon: '🔔',
    tag: 'Melodic Jingle',
    description: 'Deep royal purple velvet ribbon collar holding a bright golden jingle bell.',
    color: '#a855f7',
    quote: 'Jingle, jingle! Ringing the tea bell for all my cozy bedtime friends! 🔔',
  },
  {
    id: 'lei',
    name: 'Tropical Flower Lei',
    icon: '🌺',
    tag: 'Sunny Island',
    description: 'Colorful ring of fresh hibiscus petals and aromatic spearmint leaves.',
    color: '#10b981',
    quote: 'Aloha, tea friend! Every sip of sweet tea is a warm sunny vacation! 🌺',
  },
];

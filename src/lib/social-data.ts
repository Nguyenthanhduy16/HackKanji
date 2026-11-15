export const topics = ['learning', 'abroad', 'travel', 'translation', 'partner', 'tutor', 'jobs', 'other', 'sharing'] as const;
export type Topic = typeof topics[number];
export type ShopItem = {id: string; key: string; type: 'frame' | 'wallpaper'; rarity: 'common' | 'rare' | 'epic'; price: number; art: string; tint: string};
export const shopItems: ShopItem[] = [
  {id: 'frame-mochi', key: 'Mochi', type: 'frame', rarity: 'epic', price: 1500, art: '/shop/mochi.svg', tint: 'var(--game-coral)'},
  {id: 'frame-frog', key: 'Frog', type: 'frame', rarity: 'epic', price: 1200, art: '/shop/frog.svg', tint: 'var(--game-green)'},
  {id: 'frame-owl', key: 'Owl', type: 'frame', rarity: 'epic', price: 1500, art: '/shop/owl.svg', tint: 'var(--game-purple)'},
  {id: 'frame-panda', key: 'Panda', type: 'frame', rarity: 'epic', price: 1500, art: '/shop/panda.svg', tint: 'var(--game-blue)'},
  {id: 'frame-sakura', key: 'Sakura', type: 'frame', rarity: 'common', price: 40, art: '/shop/sakura.svg', tint: 'var(--game-coral)'},
  {id: 'frame-bamboo', key: 'Bamboo', type: 'frame', rarity: 'common', price: 80, art: '/shop/bamboo.svg', tint: 'var(--game-green)'},
  {id: 'frame-wave', key: 'Wave', type: 'frame', rarity: 'rare', price: 240, art: '/shop/wave.svg', tint: 'var(--game-blue)'},
  {id: 'frame-star', key: 'Star', type: 'frame', rarity: 'rare', price: 350, art: '/shop/star.svg', tint: 'var(--game-amber)'},
  {id: 'wallpaper-sunrise', key: 'Sunrise', type: 'wallpaper', rarity: 'common', price: 60, art: '/shop/sunrise.svg', tint: 'var(--game-amber)'},
  {id: 'wallpaper-meadow', key: 'Meadow', type: 'wallpaper', rarity: 'rare', price: 300, art: '/shop/meadow.svg', tint: 'var(--game-green)'},
  {id: 'wallpaper-moon', key: 'Moon', type: 'wallpaper', rarity: 'epic', price: 900, art: '/shop/moon.svg', tint: 'var(--game-purple)'},
  {id: 'wallpaper-blossom', key: 'Blossom', type: 'wallpaper', rarity: 'rare', price: 500, art: '/shop/blossom.svg', tint: 'var(--game-coral)'},
];

export const seedPosts = [
  {id: 'seed-1', author: 'Mây Hạ', handle: 'may.hoc.nhat', level: 12, topic: 'learning' as Topic, titleKey: 'postOneTitle', bodyKey: 'postOneBody', likes: 24, age: 2, featured: true},
  {id: 'seed-2', author: 'Linh Trúc', handle: 'truc.with.matcha', level: 8, topic: 'sharing' as Topic, titleKey: 'postTwoTitle', bodyKey: 'postTwoBody', likes: 18, age: 4, featured: true},
  {id: 'seed-3', author: 'An Khôi', handle: 'khoi.kotoba', level: 16, topic: 'partner' as Topic, titleKey: 'postThreeTitle', bodyKey: 'postThreeBody', likes: 9, age: 6, featured: false},
  {id: 'seed-4', author: 'Yuna Mori', handle: 'yuna.reads', level: 10, topic: 'travel' as Topic, titleKey: 'postFourTitle', bodyKey: 'postFourBody', likes: 31, age: 10, featured: false},
];

export type RankingMetric = 'xp' | 'minutes' | 'lessons';
export type RankingPeriod = 'week' | 'month' | 'allTime';
export type RankedLearner = {id: string; name: string; level: number; streak: number; xp: number; minutes: number; lessons: number};
const learners = [
  ['Mây Hạ', 24, 32, 2480, 356, 32], ['Haru Phạm', 22, 28, 2310, 412, 29], ['Linh Trúc', 21, 24, 2180, 320, 35],
  ['An Khôi', 20, 21, 1940, 285, 24], ['Yuna Mori', 19, 18, 1820, 304, 22], ['Minh Nắng', 18, 17, 1750, 250, 27],
  ['Aki Nguyễn', 18, 20, 1680, 278, 21], ['Lam Khuê', 17, 14, 1590, 230, 20], ['Bảo Mộc', 16, 16, 1480, 245, 18],
  ['Sora Lê', 16, 12, 1390, 208, 19], ['Nhi Thanh', 15, 11, 1310, 198, 16], ['Hạ Vy', 14, 9, 1240, 215, 17],
  ['Ren Vũ', 14, 10, 1180, 184, 15], ['Quỳnh Chi', 13, 8, 1090, 172, 14], ['Duy San', 12, 7, 980, 160, 12],
  ['Mika Đỗ', 12, 13, 910, 168, 13], ['Tú An', 11, 6, 850, 145, 11], ['Ngọc Sương', 10, 5, 780, 138, 10],
  ['Kaito Bùi', 9, 4, 690, 120, 9], ['Phúc Lâm', 8, 3, 610, 105, 8],
] as const;
export const seedLearners: RankedLearner[] = learners.map(([name, level, streak, xp, minutes, lessons], index) => ({id: `learner-${index + 1}`, name, level, streak, xp, minutes, lessons}));
export function rankLearners(period: RankingPeriod, metric: RankingMetric) {
  const factor = period === 'month' ? 4 : period === 'allTime' ? 12 : 1;
  return seedLearners.map(learner => ({...learner, value: learner[metric] * factor})).sort((a, b) => b.value - a.value);
}

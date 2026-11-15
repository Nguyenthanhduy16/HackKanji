import { toHiragana } from 'wanakana';

export function matchesReading(input: string, reading: string, romaji: string): boolean {
  const clean = input.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, '');
  return clean.length > 0 && (clean === romaji || toHiragana(clean) === toHiragana(reading));
}
export function orderedSentenceIsCorrect(answer: string[], expected: string[]): boolean {
  return answer.length === expected.length && answer.every((part, index) => part === expected[index]);
}
export function gamePoints(correct: boolean, streak: number): number {
  return correct ? 100 + Math.min(5, Math.max(0, streak)) * 10 : 0;
}
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

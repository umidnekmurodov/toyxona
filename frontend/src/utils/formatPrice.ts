/**
 * Converts a number to Uzbek sum format.
 * Uses ru-RU locale for space-separated thousands.
 * 
 * @example formatPrice(0)       → "0 so'm"
 * @example formatPrice(1500000) → "1 500 000 so'm"
 * @example formatPrice(250000)  → "250 000 so'm"
 */
export function formatPrice(n: number): string {
  if (n === 0) return "0 so'm";
  const formatted = Math.round(n).toLocaleString('ru-RU');
  return `${formatted} so'm`;
}

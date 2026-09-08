/**
 * Контраст кольорів прямо з tokens.css (WCAG 2.2 AA, критерій 1.4.3).
 *
 * Автоперевірка axe бачить лише те, що є на сторінці зараз. Цей тест фіксує
 * самі токени: якщо колір колись «освітлять», тест впаде ще до того, як хтось
 * встигне зверстати з ним текст.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  fileURLToPath(new URL('../../src/styles/tokens.css', import.meta.url)),
  'utf8',
);

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!match) throw new Error(`токена --${name} немає або він не у форматі #rrggbb`);
  return match[1]!;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

describe('контраст токенів', () => {
  // [текст, фон, мінімум]
  const pairs: Array<[string, string, number]> = [
    ['text', 'bg', 4.5],
    ['text', 'surface', 4.5],
    ['text-secondary', 'bg', 4.5],
    ['text-secondary', 'surface', 4.5],
    ['accent-text', 'bg', 4.5],
    ['accent', 'surface', 4.5],
    ['success', 'surface', 4.5],
    ['warning', 'surface', 4.5],
    ['danger', 'surface', 4.5],
  ];

  it.each(pairs)('--%s на --%s ≥ %f:1', (fg, bg, min) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
  });

  it('білий текст на кнопці --accent проходить AA', () => {
    expect(contrast('#ffffff', token('accent'))).toBeGreaterThanOrEqual(4.5);
  });

  it('--accent як текст на сірому фоні НЕ проходить — саме тому існує --accent-text', () => {
    // Зафіксовано в DESIGN_SYSTEM_TZ.md §2.1. Якщо колись пройде — попередження
    // в дизайн-системі треба прибрати, а не мовчки лишити застарілим.
    expect(contrast(token('accent'), token('bg'))).toBeLessThan(4.5);
  });

  it('--text-tertiary не годиться для змістовного тексту', () => {
    expect(contrast(token('text-tertiary'), token('bg'))).toBeLessThan(4.5);
  });
});

import { describe, expect, it } from 'vitest';
import {
  calculateLevelFromXp,
  getLevelTitle,
  getPeriodKeys,
  xpRequiredForLevel,
} from '../src/services/gamification.service';

describe('Gamification XP & Level Engine', () => {
  it('assigns correct Indonesian/Otaku level titles at milestones', () => {
    expect(getLevelTitle(1)).toBe('Newbie');
    expect(getLevelTitle(4)).toBe('Newbie');
    expect(getLevelTitle(5)).toBe('Otaku Beginner');
    expect(getLevelTitle(10)).toBe('Anime Fan');
    expect(getLevelTitle(20)).toBe('Anime Expert');
    expect(getLevelTitle(30)).toBe('Anime Master');
    expect(getLevelTitle(50)).toBe('Legendary Otaku');
  });

  it('computes progressive level thresholds accurately', () => {
    expect(xpRequiredForLevel(1)).toBe(0);
    expect(xpRequiredForLevel(5)).toBeLessThan(xpRequiredForLevel(10));
    expect(xpRequiredForLevel(10)).toBeLessThan(xpRequiredForLevel(20));
    expect(xpRequiredForLevel(30)).toBeLessThan(xpRequiredForLevel(50));

    const lv1 = calculateLevelFromXp(0);
    expect(lv1.level).toBe(1);
    expect(lv1.levelTitle).toBe('Newbie');

    const lv5 = calculateLevelFromXp(xpRequiredForLevel(5));
    expect(lv5.level).toBe(5);
    expect(lv5.levelTitle).toBe('Otaku Beginner');

    const lv50 = calculateLevelFromXp(xpRequiredForLevel(50));
    expect(lv50.level).toBe(50);
    expect(lv50.levelTitle).toBe('Legendary Otaku');
  });

  it('produces valid weekly, monthly, and all_time period keys', () => {
    const keys = getPeriodKeys(new Date('2026-11-24T12:00:00Z'));
    expect(keys.weekly).toMatch(/^2026-W\d{2}$/);
    expect(keys.monthly).toBe('2026-11');
    expect(keys.all_time).toBe('ALL');
  });
});

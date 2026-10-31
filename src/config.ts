import type { PlayerId } from './game/types';

export const DESIGN = { width: 1280, height: 720 };

export const GAME = {
  baseHp: 10,
  chargeTime: 1.5,
  countdown: 3,
  unitSpeed: 100,
  engageRange: 36,
  exchangeInterval: 0.6,
  knockback: 16,
  unitW: 16,
  unitH: 30,
} as const;

export interface CardDef {
  hp: number;
  damage: number;
  freq: number;
}

export const CARD_DEFS: Record<PlayerId, readonly CardDef[]> = {
  p1: [
    { hp: 1, damage: 1, freq: 5.0 },
    { hp: 2, damage: 1, freq: 6.67 },
    { hp: 2, damage: 2, freq: 8.57 },
  ],
  p2: [
    { hp: 1, damage: 1, freq: 10.0 },
    { hp: 2, damage: 1, freq: 12.0 },
    { hp: 2, damage: 2, freq: 15.0 },
  ],
};

export const LAYOUT = {
  laneY: 376,
  laneLeft: 270,
  laneRight: 1010,
  damageLineX: { p1: 270, p2: 1010 } as Record<PlayerId, number>,
  spawnX: { p1: 292, p2: 988 } as Record<PlayerId, number>,
  base: {
    p1: { x: 120, y: 150, w: 150, h: 180 },
    p2: { x: 1010, y: 150, w: 150, h: 180 },
  } as Record<PlayerId, { x: number; y: number; w: number; h: number }>,
  card: {
    w: 150,
    h: 126,
    tabH: 26,
    y: 500,
    xs: { p1: [120, 292, 464], p2: [668, 840, 1012] } as Record<PlayerId, number[]>,
  },
};

export const FEEDBACK = {
  trauma: { spawn: 0.06, exchange: 0.1, death: 0.18, baseHit: 0.3, baseDestroyed: 0.6 },
  maxShakeOffset: 14,
  traumaDecay: 2.2,
  screenFlash: { baseHit: 0.12, baseDestroyed: 0.25 },
  screenFlashDecay: 1.6,
};

export const PLAYER_LABEL: Record<PlayerId, string> = { p1: 'P1', p2: 'P2' };

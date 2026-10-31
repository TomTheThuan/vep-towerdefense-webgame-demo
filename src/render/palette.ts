import type { PlayerId } from '../game/types';

export const FONT_FAMILY =
  '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif';

export const PALETTE = {
  bg: 0x0e0f12,
  panel: 0x1a1c20,
  panelDeep: 0x15171a,
  line: 0x6e6a62,
  lane: 0x45484e,
  mountain: 0x2a2c30,
  text: 0xd9d5cb,
  dim: 0x8a867d,
  white: 0xffffff,
};

export const PLAYER_COLORS: Record<PlayerId, { main: number; bright: number; dark: number }> = {
  p1: { main: 0x5c7a93, bright: 0x8fa9bd, dark: 0x2b3944 },
  p2: { main: 0x96635f, bright: 0xc0968f, dark: 0x442e2d },
};

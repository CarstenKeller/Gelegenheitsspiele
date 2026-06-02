import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const FIELD_H   = Math.round(SCREEN_H * 0.60);
export const PLAT_H    = 8;
export const LADDER_W  = 14;

export const MARIO_PX  = 3;
export const MARIO_COLS = 6;
export const MARIO_ROWS = 8;
export const MARIO_W   = MARIO_COLS * MARIO_PX;   // 18
export const MARIO_H   = MARIO_ROWS * MARIO_PX;   // 24

export const KONG_PX   = 3;
export const KONG_COLS = 12;
export const KONG_ROWS = 12;
export const KONG_W    = KONG_COLS * KONG_PX;     // 36
export const KONG_H    = KONG_ROWS * KONG_PX;     // 36

export const PRINCESS_PX   = 3;
export const PRINCESS_COLS = 5;
export const PRINCESS_ROWS = 9;
export const PRINCESS_W    = PRINCESS_COLS * PRINCESS_PX;  // 15
export const PRINCESS_H    = PRINCESS_ROWS * PRINCESS_PX;  // 27

export const BARREL_PX   = 4;
export const BARREL_COLS = 4;
export const BARREL_ROWS = 4;
export const BARREL_SIZE = BARREL_COLS * BARREL_PX;        // 16

export const GRAVITY         = 0.55;
export const JUMP_VY         = -9.5;
export const MAX_FALL        = 12;
export const BARREL_FALL_SPD = 3.5;

const p  = r => Math.round(FIELD_H * r);
const pw = r => Math.round(SCREEN_W * r);

export const PLATFORMS = [
  { id: 0, x: 0,      y: FIELD_H - 16, width: SCREEN_W,       rollDir:  1 }, // floor
  { id: 1, x: 8,      y: p(0.80),      width: SCREEN_W - 24,  rollDir: -1 }, // P1
  { id: 2, x: 22,     y: p(0.60),      width: SCREEN_W - 32,  rollDir:  1 }, // P2
  { id: 3, x: 8,      y: p(0.40),      width: SCREEN_W - 24,  rollDir: -1 }, // P3
  { id: 4, x: 16,     y: p(0.15),      width: SCREEN_W - 16,  rollDir:  1 }, // P4 top
];

export const LADDERS = [
  { id: 0, x: pw(0.15), topY: p(0.80), bottomY: FIELD_H - 16 },
  { id: 1, x: pw(0.72), topY: p(0.60), bottomY: p(0.80)      },
  { id: 2, x: pw(0.20), topY: p(0.40), bottomY: p(0.60)      },
  { id: 3, x: pw(0.68), topY: p(0.15), bottomY: p(0.40)      },
];

// Kong & Princess positions (on top platform)
export const KONG_X      = PLATFORMS[4].x + 4;
export const KONG_Y      = PLATFORMS[4].y - KONG_H;
export const PRINCESS_X  = KONG_X + KONG_W + 8;
export const PRINCESS_Y  = PLATFORMS[4].y - PRINCESS_H;

// Mario start (bottom platform left)
export const MARIO_START_X = PLATFORMS[0].x + 8;
export const MARIO_START_Y = PLATFORMS[0].y - MARIO_H;

export function barrelSpeed(round) {
  return Math.min(2.8, 1.4 + round * 0.25);
}

export function barrelInterval(round) {
  return Math.max(1400, 3000 - round * 300);
}

export function ladderFallChance(round) {
  return Math.min(0.45, 0.25 + round * 0.04);
}

import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const FIELD_H   = Math.round(SCREEN_H * 0.60);
export const PLAT_H    = 8;
export const LADDER_W  = 14;

export const MARIO_PX  = 2;
export const MARIO_COLS = 12;
export const MARIO_ROWS = 16;
export const MARIO_W   = MARIO_COLS * MARIO_PX;   // 24
export const MARIO_H   = MARIO_ROWS * MARIO_PX;   // 32

export const KONG_PX   = 3;
export const KONG_COLS = 16;
export const KONG_ROWS = 16;
export const KONG_W    = KONG_COLS * KONG_PX;     // 48
export const KONG_H    = KONG_ROWS * KONG_PX;     // 48

export const PRINCESS_PX   = 2;
export const PRINCESS_COLS = 8;
export const PRINCESS_ROWS = 14;
export const PRINCESS_W    = PRINCESS_COLS * PRINCESS_PX;  // 16
export const PRINCESS_H    = PRINCESS_ROWS * PRINCESS_PX;  // 28

export const BARREL_PX   = 3;
export const BARREL_COLS = 8;
export const BARREL_ROWS = 6;
export const BARREL_SIZE = BARREL_COLS * BARREL_PX;        // 24

export const GRAVITY         = 0.55;
export const JUMP_VY         = -8.5;   // reduced so Mario can't skip platforms
export const MAX_FALL        = 12;
export const BARREL_FALL_SPD = 3.5;

// Platform Y helpers
const p  = r => Math.round(FIELD_H * r);
const pw = r => Math.round(SCREEN_W * r);

// Platforms alternate left/right so barrels cascade downward correctly.
// rollDir +1 = rolls right (falls off right edge); -1 = rolls left (falls off left)
// tiltDeg: visual rotation in degrees only; physics stays horizontal
export const PLATFORMS = [
  { id: 0, x: 0,    y: FIELD_H - 16, width: SCREEN_W,      rollDir:  1, tiltDeg:  0  }, // floor (flat)
  { id: 1, x: 20,   y: p(0.79),      width: SCREEN_W - 28, rollDir: -1, tiltDeg: -2  }, // P1
  { id: 2, x: 0,    y: p(0.60),      width: SCREEN_W - 28, rollDir:  1, tiltDeg:  2  }, // P2
  { id: 3, x: 20,   y: p(0.40),      width: SCREEN_W - 28, rollDir: -1, tiltDeg: -2  }, // P3
  { id: 4, x: 0,    y: p(0.14),      width: SCREEN_W - 28, rollDir:  1, tiltDeg:  2  }, // P4 top/Kong
];

// Ladders connect adjacent platforms at their "high" (safe) end,
// i.e. opposite side from where barrels fall off.
export const LADDERS = [
  { id: 0, x: pw(0.72), topY: PLATFORMS[1].y, bottomY: PLATFORMS[0].y }, // P0→P1 right side
  { id: 1, x: pw(0.18), topY: PLATFORMS[2].y, bottomY: PLATFORMS[1].y }, // P1→P2 left side
  { id: 2, x: pw(0.72), topY: PLATFORMS[3].y, bottomY: PLATFORMS[2].y }, // P2→P3 right side
  { id: 3, x: pw(0.18), topY: PLATFORMS[4].y, bottomY: PLATFORMS[3].y }, // P3→P4 left side
];

// Kong sits on the left end of P4; Princess just right of Kong
export const KONG_X     = PLATFORMS[4].x + 4;
export const KONG_Y     = PLATFORMS[4].y - KONG_H;
export const PRINCESS_X = KONG_X + KONG_W + 6;
export const PRINCESS_Y = PLATFORMS[4].y - PRINCESS_H;

// Mario starts bottom-left on the floor
export const MARIO_START_X = PLATFORMS[0].x + 8;
export const MARIO_START_Y = PLATFORMS[0].y - MARIO_H;

export function barrelSpeed(round) {
  return Math.min(3.0, 1.6 + round * 0.25);
}

export function barrelInterval(round) {
  return Math.max(1400, 3000 - round * 300);
}

export function ladderFallChance(round) {
  return Math.min(0.45, 0.28 + round * 0.04);
}

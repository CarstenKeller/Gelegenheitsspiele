// Pixel-art sprite data for Donkey Kong characters
// Each sprite: array of [row, col, color]

const R = '#dd2200'; // mario red
const S = '#f8b060'; // skin
const B = '#1133dd'; // blue overalls
const T = '#552200'; // boots/brown
const W = '#ffffff'; // white eyes

const KB = '#8b5e2a'; // kong brown
const KD = '#5a3a10'; // kong dark
const KF = '#c8955a'; // kong face

const PH = '#ffcc00'; // princess hair
const PD = '#ff88aa'; // princess dress
const PR = '#cc2200'; // princess shoes

const BW = '#cc7722'; // barrel wood
const BR = '#5a2e00'; // barrel ring/dark

export const MARIO_PX   = 3;
export const MARIO_W_PX = 6 * MARIO_PX;  // 18
export const MARIO_H_PX = 8 * MARIO_PX;  // 24

export const MARIO_SPRITES = {
  walkA: [
    [0,2,R],[0,3,R],[0,4,R],
    [1,1,R],[1,2,R],[1,3,R],[1,4,R],[1,5,R],
    [2,2,S],[2,3,S],[2,4,S],
    [3,1,S],[3,2,S],[3,3,W],[3,4,S],[3,5,S],
    [4,0,B],[4,1,B],[4,2,B],[4,3,B],[4,4,B],[4,5,B],
    [5,0,B],[5,1,B],[5,2,B],[5,3,B],[5,4,B],[5,5,B],
    [6,0,T],[6,1,T],[6,4,T],[6,5,T],
    [7,0,T],[7,1,T],[7,4,T],[7,5,T],
  ],
  walkB: [
    [0,2,R],[0,3,R],[0,4,R],
    [1,1,R],[1,2,R],[1,3,R],[1,4,R],[1,5,R],
    [2,2,S],[2,3,S],[2,4,S],
    [3,1,S],[3,2,S],[3,3,W],[3,4,S],[3,5,S],
    [4,0,B],[4,1,B],[4,2,B],[4,3,B],[4,4,B],[4,5,B],
    [5,0,B],[5,1,B],[5,2,B],[5,3,B],[5,4,B],[5,5,B],
    [6,0,T],[6,1,T],[6,3,T],[6,4,T],
    [7,1,T],[7,2,T],[7,4,T],[7,5,T],
  ],
  jump: [
    [0,2,R],[0,3,R],[0,4,R],
    [1,1,R],[1,2,R],[1,3,R],[1,4,R],[1,5,R],
    [2,2,S],[2,3,S],[2,4,S],
    [3,1,S],[3,2,S],[3,3,W],[3,4,S],[3,5,S],
    [4,0,B],[4,1,B],[4,2,B],[4,3,B],[4,4,B],[4,5,B],
    [5,0,B],[5,1,B],[5,2,B],[5,3,B],[5,4,B],[5,5,B],
    [6,0,T],[6,5,T],
    [7,0,T],[7,1,T],[7,4,T],[7,5,T],
  ],
  climbA: [
    [0,2,R],[0,3,R],[0,4,R],
    [1,1,R],[1,2,R],[1,3,R],[1,4,R],
    [2,1,S],[2,2,S],[2,3,S],[2,4,S],
    [3,0,S],[3,1,B],[3,2,B],[3,3,B],[3,4,B],[3,5,B],
    [4,0,B],[4,1,B],[4,2,B],[4,3,B],[4,4,B],[4,5,S],
    [5,1,S],[5,5,S],
    [6,1,T],[6,2,T],[6,3,T],[6,4,T],
    [7,0,T],[7,1,T],[7,4,T],[7,5,T],
  ],
  climbB: [
    [0,2,R],[0,3,R],[0,4,R],
    [1,1,R],[1,2,R],[1,3,R],[1,4,R],
    [2,1,S],[2,2,S],[2,3,S],[2,4,S],
    [3,0,B],[3,1,B],[3,2,B],[3,3,B],[3,4,B],[3,5,S],
    [4,0,S],[4,1,B],[4,2,B],[4,3,B],[4,4,B],[4,5,B],
    [5,0,S],[5,4,S],
    [6,0,T],[6,1,T],[6,4,T],[6,5,T],
    [7,1,T],[7,2,T],[7,3,T],[7,4,T],
  ],
  die: [
    [1,0,R],[1,1,R],[1,2,R],[1,3,R],[1,4,R],[1,5,R],
    [2,0,S],[2,1,S],[2,2,S],[2,3,S],[2,4,S],[2,5,S],
    [3,0,R],[3,5,R],
    [4,1,B],[4,2,B],[4,3,B],[4,4,B],
    [5,0,B],[5,1,B],[5,2,B],[5,3,B],[5,4,B],[5,5,B],
    [6,0,T],[6,5,T],
    [7,0,T],[7,1,T],[7,4,T],[7,5,T],
  ],
};

// Kong
export const KONG_PX   = 3;
export const KONG_W_PX = 12 * KONG_PX;  // 36
export const KONG_H_PX = 12 * KONG_PX;  // 36

export const KONG_SPRITES = {
  idle: [
    [0,4,KB],[0,5,KB],[0,6,KB],[0,7,KB],
    [1,3,KB],[1,4,KB],[1,5,KB],[1,6,KB],[1,7,KB],[1,8,KB],
    [2,2,KB],[2,3,KF],[2,4,KF],[2,5,KF],[2,6,KF],[2,7,KF],[2,8,KF],[2,9,KB],
    [3,2,KB],[3,3,KF],[3,4,KD],[3,5,KF],[3,6,KF],[3,7,KD],[3,8,KF],[3,9,KB],
    [4,1,KB],[4,2,KB],[4,3,KB],[4,4,KB],[4,5,KB],[4,6,KB],[4,7,KB],[4,8,KB],[4,9,KB],[4,10,KB],
    [5,0,KB],[5,1,KB],[5,2,KB],[5,3,KB],[5,4,KB],[5,5,KB],[5,6,KB],[5,7,KB],[5,8,KB],[5,9,KB],[5,10,KB],[5,11,KB],
    [6,1,KB],[6,2,KB],[6,3,KB],[6,4,KB],[6,5,KB],[6,6,KB],[6,7,KB],[6,8,KB],[6,9,KB],[6,10,KB],
    [7,2,KB],[7,3,KB],[7,4,KB],[7,5,KB],[7,6,KB],[7,7,KB],[7,8,KB],[7,9,KB],
    [8,3,KB],[8,4,KB],[8,5,KB],[8,6,KB],[8,7,KB],[8,8,KB],
    [9,2,KB],[9,3,KB],[9,5,KB],[9,6,KB],[9,8,KB],[9,9,KB],
    [10,2,KB],[10,3,KB],[10,5,KB],[10,6,KB],[10,8,KB],[10,9,KB],
    [11,1,KD],[11,2,KD],[11,3,KD],[11,9,KD],[11,10,KD],[11,11,KD],
  ],
  throw: [
    [0,4,KB],[0,5,KB],[0,6,KB],[0,7,KB],
    [1,3,KB],[1,4,KB],[1,5,KB],[1,6,KB],[1,7,KB],[1,8,KB],
    [2,2,KB],[2,3,KF],[2,4,KF],[2,5,KF],[2,6,KF],[2,7,KF],[2,8,KF],[2,9,KB],
    [3,2,KB],[3,3,KF],[3,4,KD],[3,5,KF],[3,6,KF],[3,7,KD],[3,8,KF],[3,9,KB],
    [4,0,KB],[4,1,KB],[4,2,KB],[4,3,KB],[4,4,KB],[4,5,KB],[4,6,KB],[4,7,KB],[4,8,KB],[4,9,KB],[4,10,KB],[4,11,KB],
    [5,0,KB],[5,1,KB],[5,2,KB],[5,3,KB],[5,4,KB],[5,5,KB],[5,6,KB],[5,7,KB],[5,8,KB],[5,9,KB],[5,10,KB],[5,11,KB],
    [6,1,KB],[6,2,KB],[6,3,KB],[6,4,KB],[6,5,KB],[6,6,KB],[6,7,KB],[6,8,KB],[6,9,KB],[6,10,KB],
    [7,2,KB],[7,3,KB],[7,4,KB],[7,5,KB],[7,6,KB],[7,7,KB],[7,8,KB],[7,9,KB],
    [8,3,KB],[8,4,KB],[8,5,KB],[8,6,KB],[8,7,KB],[8,8,KB],
    [9,2,KB],[9,3,KB],[9,5,KB],[9,6,KB],[9,8,KB],[9,9,KB],
    [10,2,KB],[10,3,KB],[10,5,KB],[10,6,KB],[10,8,KB],[10,9,KB],
    [11,1,KD],[11,2,KD],[11,3,KD],[11,9,KD],[11,10,KD],[11,11,KD],
  ],
};

// Princess
export const PRINCESS_PX   = 3;
export const PRINCESS_W_PX = 5 * PRINCESS_PX;  // 15
export const PRINCESS_H_PX = 9 * PRINCESS_PX;  // 27

export const PRINCESS_SPRITES = {
  wave0: [
    [0,1,PH],[0,2,PH],[0,3,PH],
    [1,0,PH],[1,1,S],[1,2,S],[1,3,S],[1,4,PH],
    [2,1,S],[2,2,S],[2,3,S],
    [3,0,PD],[3,1,PD],[3,2,PD],[3,3,PD],[3,4,PD],
    [4,0,PD],[4,1,PD],[4,2,PD],[4,3,PD],[4,4,PD],
    [5,0,PD],[5,1,PD],[5,2,PD],[5,3,PD],[5,4,PD],
    [6,0,PD],[6,1,PD],[6,2,PD],[6,3,PD],[6,4,PD],
    [7,0,S],[7,1,S],[7,3,S],[7,4,S],
    [8,0,PR],[8,1,PR],[8,3,PR],[8,4,PR],
  ],
  wave1: [
    [0,1,PH],[0,2,PH],[0,3,PH],
    [1,0,PH],[1,1,S],[1,2,S],[1,3,S],[1,4,PH],
    [2,0,S],[2,1,S],[2,2,S],[2,3,S],
    [3,0,PD],[3,1,PD],[3,2,PD],[3,3,PD],[3,4,PD],
    [4,0,PD],[4,1,PD],[4,2,PD],[4,3,PD],[4,4,PD],
    [5,0,PD],[5,1,PD],[5,2,PD],[5,3,PD],[5,4,PD],
    [6,0,PD],[6,1,PD],[6,2,PD],[6,3,PD],[6,4,PD],
    [7,0,S],[7,1,S],[7,3,S],[7,4,S],
    [8,0,PR],[8,1,PR],[8,3,PR],[8,4,PR],
  ],
};

// Barrel
export const BARREL_PX     = 4;
export const BARREL_W_PX   = 4 * BARREL_PX;  // 16
export const BARREL_H_PX   = 4 * BARREL_PX;  // 16

export const BARREL_SPRITE = [
  [0,1,BR],[0,2,BR],
  [1,0,BW],[1,1,BW],[1,2,BW],[1,3,BW],
  [2,0,BR],[2,1,BW],[2,2,BW],[2,3,BR],
  [3,0,BW],[3,1,BW],[3,2,BW],[3,3,BW],
  // no row 4 to keep 4 rows
];

// Generic sprite renderer used by all DK components
import { View, StyleSheet } from 'react-native';

export function SpriteView({ pixels, pixelSize, width, height, flipX, style }) {
  return (
    <View style={[{ width, height, position: 'relative' },
      flipX && { transform: [{ scaleX: -1 }] }, style]}>
      {pixels.map(([r, c, color], i) => (
        <View key={i} style={{
          position: 'absolute',
          top: r * pixelSize,
          left: c * pixelSize,
          width: pixelSize,
          height: pixelSize,
          backgroundColor: color,
        }} />
      ))}
    </View>
  );
}

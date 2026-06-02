import { View, StyleSheet } from 'react-native';

const PIXEL = 4;
// 9 columns × 5 rows → PLAYER_W=36, PLAYER_H=20
const PIXELS = [
  [0, 4],
  [1, 3],[1, 4],[1, 5],
  [2, 1],[2, 2],[2, 3],[2, 4],[2, 5],[2, 6],[2, 7],
  [3, 0],[3, 1],[3, 2],[3, 3],[3, 4],[3, 5],[3, 6],[3, 7],[3, 8],
  [4, 0],[4, 1],[4, 2],[4, 3],[4, 4],[4, 5],[4, 6],[4, 7],[4, 8],
];

export const PLAYER_W = 9 * PIXEL;   // 36
export const PLAYER_H = 5 * PIXEL;   // 20

export default function PlayerShip({ invincible }) {
  return (
    <View style={[s.container, invincible && s.invincible]}>
      {PIXELS.map(([r, c], i) => (
        <View key={i} style={[s.pixel, { top: r * PIXEL, left: c * PIXEL }]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: PLAYER_W, height: PLAYER_H, position: 'relative' },
  invincible: { opacity: 0.3 },
  pixel: { position: 'absolute', width: PIXEL, height: PIXEL, backgroundColor: '#00ff00' },
});

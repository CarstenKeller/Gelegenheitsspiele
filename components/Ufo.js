import { View, StyleSheet } from 'react-native';

const PIXEL = 4;
// 12 columns × 4 rows → UFO_W=48, UFO_H=16
const PIXELS = [
  [0, 4],[0, 5],[0, 6],[0, 7],
  [1, 2],[1, 3],[1, 4],[1, 5],[1, 6],[1, 7],[1, 8],[1, 9],
  [2, 0],[2, 1],[2, 2],[2, 3],[2, 4],[2, 5],[2, 6],[2, 7],[2, 8],[2, 9],[2, 10],[2, 11],
  [3, 1],[3, 3],[3, 5],[3, 7],[3, 9],[3, 11],
];

export const UFO_W = 12 * PIXEL;   // 48
export const UFO_H  = 4 * PIXEL;   // 16
export const UFO_POINTS = [50, 100, 150, 200, 250, 300];

export default function Ufo() {
  return (
    <View style={s.container}>
      {PIXELS.map(([r, c], i) => (
        <View key={i} style={[s.pixel, { top: r * PIXEL, left: c * PIXEL }]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: UFO_W, height: UFO_H, position: 'relative' },
  pixel: { position: 'absolute', width: PIXEL, height: PIXEL, backgroundColor: '#ff0000' },
});

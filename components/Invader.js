import { View, StyleSheet } from 'react-native';

// type 0 = Oktopus (10pt, Magenta), type 1 = Krabbe (20pt, Cyan), type 2 = Tintenfisch (30pt, Weiß)
export const INVADER_POINTS = [10, 20, 30];
const COLORS = ['#ff00ff', '#00ffff', '#ffffff'];

// Each shape: array of [row, col] pixel coords on a 8×8 grid, two phases
const SHAPES = {
  // Oktopus – breite Form
  0: [
    // phase 0
    [[1,2],[1,5],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[3,0],[3,2],[3,3],[3,4],[3,5],[3,7],
     [4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[5,1],[5,3],[5,4],[5,6],[6,0],[6,2],[6,5],[6,7]],
    // phase 1
    [[1,2],[1,5],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[3,0],[3,2],[3,3],[3,4],[3,5],[3,7],
     [4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[5,0],[5,2],[5,5],[5,7],[6,1],[6,2],[6,5],[6,6]],
  ],
  // Krabbe – Scheren-Form
  1: [
    [[0,2],[0,5],[1,2],[1,5],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],
     [3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[4,0],[4,2],[4,5],[4,7],
     [5,1],[5,3],[5,4],[5,6]],
    [[0,2],[0,5],[1,2],[1,5],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],
     [3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[4,0],[4,2],[4,5],[4,7],
     [5,0],[5,2],[5,5],[5,7]],
  ],
  // Tintenfisch – schmale hohe Form
  2: [
    [[0,3],[0,4],[1,2],[1,3],[1,4],[1,5],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],
     [3,0],[3,1],[3,3],[3,4],[3,6],[3,7],[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],
     [5,1],[5,2],[5,5],[5,6],[6,0],[6,3],[6,4],[6,7]],
    [[0,3],[0,4],[1,2],[1,3],[1,4],[1,5],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],
     [3,0],[3,1],[3,3],[3,4],[3,6],[3,7],[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],
     [5,0],[5,3],[5,4],[5,7],[6,1],[6,2],[6,5],[6,6]],
  ],
};

const PIXEL = 4; // size of each "pixel" block

export default function Invader({ type, phase }) {
  const color = COLORS[type];
  const pixels = SHAPES[type][phase % 2];
  return (
    <View style={s.container}>
      {pixels.map(([r, c], i) => (
        <View
          key={i}
          style={[s.pixel, { top: r * PIXEL, left: c * PIXEL, backgroundColor: color }]}
        />
      ))}
    </View>
  );
}

export const INVADER_W = 8 * PIXEL;  // 32
export const INVADER_H = 7 * PIXEL;  // 28

const s = StyleSheet.create({
  container: { width: INVADER_W, height: INVADER_H, position: 'relative' },
  pixel: { position: 'absolute', width: PIXEL, height: PIXEL },
});

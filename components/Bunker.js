import { View, StyleSheet } from 'react-native';

const BLOCK = 6;
const COLS = 6;
const ROWS = 4;
export const BUNKER_W = COLS * BLOCK;
export const BUNKER_H = ROWS * BLOCK;

// Classic arch shape: bottom-center two blocks are open
const ARCH_HOLES = new Set(['2-2', '2-3', '3-2', '3-3']);

export function buildBunker() {
  const blocks = {};
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!ARCH_HOLES.has(`${r}-${c}`)) {
        blocks[`${r}-${c}`] = true;
      }
    }
  }
  return blocks;
}

export default function Bunker({ blocks }) {
  return (
    <View style={s.container}>
      {Object.entries(blocks).map(([key, alive]) => {
        if (!alive) return null;
        const [r, c] = key.split('-').map(Number);
        return (
          <View
            key={key}
            style={[s.block, { top: r * BLOCK, left: c * BLOCK }]}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: BUNKER_W, height: BUNKER_H, position: 'relative' },
  block: { position: 'absolute', width: BLOCK, height: BLOCK, backgroundColor: '#00cc00' },
});

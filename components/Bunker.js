import { View, StyleSheet } from 'react-native';

export const BLOCK = 6;
const COLS = 6;
const ROWS = 4;
export const BUNKER_W = COLS * BLOCK;  // 36
export const BUNKER_H = ROWS * BLOCK;  // 24

// Arch opening: bottom-center two cols
const ARCH_HOLES = new Set(['3-2', '3-3']);

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

// Destroy blocks at local hit position. Returns true if any block was destroyed.
export function hitBunker(bunker, localX, localY) {
  const col = Math.floor(Math.max(0, Math.min(BUNKER_W - 1, localX)) / BLOCK);
  const row = Math.floor(Math.max(0, Math.min(BUNKER_H - 1, localY)) / BLOCK);
  const candidates = [
    `${row}-${col}`,
    `${row - 1}-${col}`,
    `${row + 1}-${col}`,
    `${row}-${col - 1}`,
    `${row}-${col + 1}`,
  ];
  for (const key of candidates) {
    if (bunker.blocks[key] === true) {
      bunker.blocks[key] = false;
      return true;
    }
  }
  return false;
}

export default function Bunker({ blocks }) {
  return (
    <View style={s.container}>
      {Object.entries(blocks).map(([key, alive]) => {
        if (!alive) return null;
        const [r, c] = key.split('-').map(Number);
        return (
          <View key={key} style={[s.block, { top: r * BLOCK, left: c * BLOCK }]} />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: BUNKER_W, height: BUNKER_H, position: 'relative' },
  block: { position: 'absolute', width: BLOCK, height: BLOCK, backgroundColor: '#00cc00' },
});

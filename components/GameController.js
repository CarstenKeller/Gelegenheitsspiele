import { View, Text, StyleSheet, Pressable } from 'react-native';

function Btn({ label, onPressIn, onPressOut, style }) {
  return (
    <Pressable
      style={({ pressed }) => [s.btn, style, pressed && s.btnPressed]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Text style={s.btnText}>{label}</Text>
    </Pressable>
  );
}

export default function GameController({ controlsRef, handedness = 'right' }) {
  const dpad = (
    <View style={s.dpad}>
      <Btn label="◀" onPressIn={() => { controlsRef.current.left = true; }} onPressOut={() => { controlsRef.current.left = false; }} />
      <Btn label="▶" onPressIn={() => { controlsRef.current.right = true; }} onPressOut={() => { controlsRef.current.right = false; }} />
    </View>
  );

  const fire = (
    <Btn
      label="FIRE"
      style={s.fireBtn}
      onPressIn={() => { controlsRef.current.fire = true; }}
      onPressOut={() => { controlsRef.current.fire = false; }}
    />
  );

  return (
    <View style={s.container}>
      {handedness === 'left' ? fire : dpad}
      <View style={s.spacer} />
      {handedness === 'left' ? dpad : fire}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#050505', borderTopWidth: 1, borderColor: '#0a2a0a' },
  spacer: { flex: 1 },
  dpad: { flexDirection: 'row', gap: 12 },
  btn: { width: 68, height: 68, borderWidth: 2, borderColor: '#0f0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1a0a' },
  fireBtn: { width: 80, height: 80, borderColor: '#ff3333', backgroundColor: '#1a0505' },
  btnPressed: { backgroundColor: '#1a3a1a' },
  btnText: { color: '#0f0', fontFamily: 'monospace', fontSize: 22, fontWeight: 'bold' },
});

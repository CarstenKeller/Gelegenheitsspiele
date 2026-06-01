import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function GameController({ controlsRef }) {
  return (
    <View style={s.container}>
      <View style={s.left}>
        <Pressable
          style={({ pressed }) => [s.btn, pressed && s.btnPressed]}
          onPressIn={() => { controlsRef.current.left = true; }}
          onPressOut={() => { controlsRef.current.left = false; }}
        >
          <Text style={s.btnText}>◀</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.btn, pressed && s.btnPressed]}
          onPressIn={() => { controlsRef.current.right = true; }}
          onPressOut={() => { controlsRef.current.right = false; }}
        >
          <Text style={s.btnText}>▶</Text>
        </Pressable>
      </View>
      <View style={s.right}>
        <Pressable
          style={({ pressed }) => [s.btn, s.fireBtn, pressed && s.btnPressed]}
          onPressIn={() => { controlsRef.current.fire = true; }}
          onPressOut={() => { controlsRef.current.fire = false; }}
        >
          <Text style={s.btnText}>FIRE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#050505' },
  left: { flexDirection: 'row', gap: 16 },
  right: {},
  btn: { width: 70, height: 70, borderWidth: 2, borderColor: '#0f0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1a0a' },
  fireBtn: { borderColor: '#f00', backgroundColor: '#1a0a0a', width: 80, height: 80 },
  btnPressed: { backgroundColor: '#1a3a1a' },
  btnText: { color: '#0f0', fontFamily: 'monospace', fontSize: 22, fontWeight: 'bold' },
});

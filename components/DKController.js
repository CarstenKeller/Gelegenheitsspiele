import { View, Text, StyleSheet, Pressable } from 'react-native';

function Btn({ label, onPressIn, onPressOut, style, textStyle }) {
  return (
    <Pressable
      style={({ pressed }) => [s.btn, style, pressed && s.pressed]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Text style={[s.label, textStyle]}>{label}</Text>
    </Pressable>
  );
}

export default function DKController({ ctrlRef, handedness = 'right' }) {
  const set = (key, val) => () => { ctrlRef.current[key] = val; };

  const dpad = (
    <View style={s.dpad}>
      <View style={s.dpadRow}>
        <View style={s.btnPlaceholder} />
        <Btn label="▲" onPressIn={set('up',true)} onPressOut={set('up',false)} />
        <View style={s.btnPlaceholder} />
      </View>
      <View style={s.dpadRow}>
        <Btn label="◀" onPressIn={set('left',true)} onPressOut={set('left',false)} />
        <Btn label="▼" onPressIn={set('down',true)} onPressOut={set('down',false)} />
        <Btn label="▶" onPressIn={set('right',true)} onPressOut={set('right',false)} />
      </View>
    </View>
  );

  const jumpBtn = (
    <Btn
      label="JUMP"
      style={s.jumpBtn}
      textStyle={s.jumpLabel}
      onPressIn={set('jump', true)}
      onPressOut={set('jump', false)}
    />
  );

  return (
    <View style={s.container}>
      {handedness === 'left' ? jumpBtn : dpad}
      <View style={s.spacer} />
      {handedness === 'left' ? dpad : jumpBtn}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#050505' },
  spacer: { flex: 1 },

  dpad: { gap: 4 },
  dpadRow: { flexDirection: 'row', gap: 4 },

  btn: { width: 52, height: 52, borderWidth: 2, borderColor: '#0f0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1a0a' },
  btnPlaceholder: { width: 52, height: 52 },
  pressed: { backgroundColor: '#1a3a1a' },
  label: { color: '#0f0', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold' },

  jumpBtn: { width: 84, height: 84, borderColor: '#ffaa00', backgroundColor: '#1a1000', borderRadius: 42 },
  jumpLabel: { color: '#ffaa00', fontSize: 14 },
});

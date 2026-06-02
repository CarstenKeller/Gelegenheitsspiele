import { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch,
  ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHighscore, getSettings, saveSettings } from '../utils/storage';

const DIFFICULTIES = ['easy', 'normal', 'hard'];

const GAMES = [
  { id: 'spaceinvaders', title: 'Space Invaders', screen: 'SpaceInvaders', available: true },
  { id: 'donkeykong', title: 'Donkey Kong', screen: 'DonkeyKong', available: true },
  { id: 'breakout', title: 'Breakout', available: false },
  { id: 'snake', title: 'Snake', available: false },
];

export default function HomeScreen({ navigation }) {
  const [playerName, setPlayerName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState('normal');
  const [handedness, setHandedness] = useState('right');
  const [highscores, setHighscores] = useState({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [settings, hsSI, hsDK] = await Promise.all([
          getSettings(),
          getHighscore('spaceinvaders'),
          getHighscore('donkeykong'),
        ]);
        setPlayerName(settings.playerName);
        setSoundEnabled(settings.soundEnabled);
        setDifficulty(settings.difficulty);
        setHandedness(settings.handedness ?? 'right');
        setHighscores({ spaceinvaders: hsSI, donkeykong: hsDK });
      })();
    }, [])
  );

  const handleSetting = async (key, value) => {
    const next = { playerName, soundEnabled, difficulty, handedness, [key]: value };
    if (key === 'playerName') setPlayerName(value);
    if (key === 'soundEnabled') setSoundEnabled(value);
    if (key === 'difficulty') setDifficulty(value);
    if (key === 'handedness') setHandedness(value);
    await saveSettings(next);
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>ARCADE GAMES</Text>

        {/* Spielkacheln */}
        <View style={s.section}>
          {GAMES.map((game) =>
            game.available ? (
              <TouchableOpacity
                key={game.id}
                style={s.gameTile}
                onPress={() => navigation.navigate(game.screen, { difficulty, soundEnabled, playerName, handedness })}
              >
                <Text style={s.gameTileTitle}>{game.title}</Text>
                {highscores[game.id]?.score > 0 && (
                  <Text style={s.gameTileScore}>Best: {highscores[game.id].score}</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View key={game.id} style={[s.gameTile, s.gameTileDisabled]}>
                <Text style={[s.gameTileTitle, s.gameTileTitleDisabled]}>{game.title}</Text>
                <Text style={s.comingSoon}>Bald verfügbar</Text>
              </View>
            )
          )}
        </View>

        {/* Settings */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>EINSTELLUNGEN</Text>

          <Text style={s.label}>Spielername</Text>
          <TextInput
            style={s.input}
            value={playerName}
            onChangeText={(v) => handleSetting('playerName', v)}
            placeholder="Name eingeben"
            placeholderTextColor="#555"
            maxLength={20}
          />

          <View style={s.row}>
            <Text style={s.label}>Sound</Text>
            <Switch
              value={soundEnabled}
              onValueChange={(v) => handleSetting('soundEnabled', v)}
              thumbColor={soundEnabled ? '#0f0' : '#555'}
              trackColor={{ false: '#333', true: '#065f06' }}
            />
          </View>

          <Text style={s.label}>Schwierigkeit</Text>
          <View style={s.diffRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d}
                style={[s.diffBtn, difficulty === d && s.diffBtnActive]}
                onPress={() => handleSetting('difficulty', d)}
              >
                <Text style={[s.diffBtnText, difficulty === d && s.diffBtnTextActive]}>
                  {d.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 16 }]}>Controller</Text>
          <View style={s.diffRow}>
            {['right', 'left'].map((h) => (
              <TouchableOpacity
                key={h}
                style={[s.diffBtn, { flex: 1 }, handedness === h && s.diffBtnActive]}
                onPress={() => handleSetting('handedness', h)}
              >
                <Text style={[s.diffBtnText, handedness === h && s.diffBtnTextActive]}>
                  {h === 'right' ? '◀▶  FIRE' : 'FIRE  ◀▶'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { color: '#0f0', fontFamily: 'monospace', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, letterSpacing: 3 },

  section: { marginBottom: 28 },
  sectionTitle: { color: '#0f0', fontFamily: 'monospace', fontSize: 13, letterSpacing: 2, marginBottom: 12 },

  gameTile: { backgroundColor: '#0a1a0a', borderWidth: 1, borderColor: '#0f0', borderRadius: 6, padding: 16, marginBottom: 10 },
  gameTileDisabled: { borderColor: '#333', backgroundColor: '#0a0a0a' },
  gameTileTitle: { color: '#0f0', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold' },
  gameTileTitleDisabled: { color: '#444' },
  gameTileScore: { color: '#0a0', fontFamily: 'monospace', fontSize: 12, marginTop: 4 },
  comingSoon: { color: '#444', fontFamily: 'monospace', fontSize: 12, marginTop: 4 },

  label: { color: '#aaa', fontFamily: 'monospace', fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', borderRadius: 4, color: '#fff', fontFamily: 'monospace', fontSize: 15, padding: 10, marginBottom: 16 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

  diffRow: { flexDirection: 'row', gap: 10 },
  diffBtn: { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 4, padding: 10, alignItems: 'center' },
  diffBtnActive: { borderColor: '#0f0', backgroundColor: '#0a1a0a' },
  diffBtnText: { color: '#555', fontFamily: 'monospace', fontSize: 13 },
  diffBtnTextActive: { color: '#0f0' },
});

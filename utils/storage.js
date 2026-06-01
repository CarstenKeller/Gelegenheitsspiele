import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HIGHSCORE: 'highscore_spaceinvaders',
  PLAYER_NAME: 'player_name',
  SOUND_ENABLED: 'sound_enabled',
  DIFFICULTY: 'difficulty',
};

export async function getHighscore() {
  const val = await AsyncStorage.getItem(KEYS.HIGHSCORE);
  return val ? JSON.parse(val) : { score: 0, name: '' };
}

export async function saveHighscore(score, name) {
  await AsyncStorage.setItem(KEYS.HIGHSCORE, JSON.stringify({ score, name }));
}

export async function getSettings() {
  const [name, sound, difficulty] = await Promise.all([
    AsyncStorage.getItem(KEYS.PLAYER_NAME),
    AsyncStorage.getItem(KEYS.SOUND_ENABLED),
    AsyncStorage.getItem(KEYS.DIFFICULTY),
  ]);
  return {
    playerName: name ?? '',
    soundEnabled: sound !== null ? JSON.parse(sound) : true,
    difficulty: difficulty ?? 'normal',
  };
}

export async function saveSettings({ playerName, soundEnabled, difficulty }) {
  await Promise.all([
    AsyncStorage.setItem(KEYS.PLAYER_NAME, playerName),
    AsyncStorage.setItem(KEYS.SOUND_ENABLED, JSON.stringify(soundEnabled)),
    AsyncStorage.setItem(KEYS.DIFFICULTY, difficulty),
  ]);
}

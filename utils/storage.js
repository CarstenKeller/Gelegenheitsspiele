import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HIGHSCORE: 'highscore_spaceinvaders',
  PLAYER_NAME: 'player_name',
  SOUND_ENABLED: 'sound_enabled',
  DIFFICULTY: 'difficulty',
  HANDEDNESS: 'handedness',
};

export async function getHighscore(gameKey = 'spaceinvaders') {
  const val = await AsyncStorage.getItem(`highscore_${gameKey}`);
  return val ? JSON.parse(val) : { score: 0, name: '' };
}

export async function saveHighscore(score, name, gameKey = 'spaceinvaders') {
  await AsyncStorage.setItem(`highscore_${gameKey}`, JSON.stringify({ score, name }));
}

export async function getSettings() {
  const [name, sound, difficulty, handedness] = await Promise.all([
    AsyncStorage.getItem(KEYS.PLAYER_NAME),
    AsyncStorage.getItem(KEYS.SOUND_ENABLED),
    AsyncStorage.getItem(KEYS.DIFFICULTY),
    AsyncStorage.getItem(KEYS.HANDEDNESS),
  ]);
  return {
    playerName: name ?? '',
    soundEnabled: sound !== null ? JSON.parse(sound) : true,
    difficulty: difficulty ?? 'normal',
    handedness: handedness ?? 'right',
  };
}

export async function saveSettings({ playerName, soundEnabled, difficulty, handedness }) {
  await Promise.all([
    AsyncStorage.setItem(KEYS.PLAYER_NAME, playerName),
    AsyncStorage.setItem(KEYS.SOUND_ENABLED, JSON.stringify(soundEnabled)),
    AsyncStorage.setItem(KEYS.DIFFICULTY, difficulty),
    AsyncStorage.setItem(KEYS.HANDEDNESS, handedness),
  ]);
}

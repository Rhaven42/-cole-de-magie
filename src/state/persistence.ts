import AsyncStorage from '@react-native-async-storage/async-storage';
import { deserialize, serialize, type GameState } from '../engine';

const KEY = 'arcanum.save';

export async function loadSave(): Promise<GameState | null> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? deserialize(json) : null;
  } catch {
    return null;
  }
}

export async function writeSave(state: GameState): Promise<void> {
  state.lastSavedAt = Date.now();
  try {
    await AsyncStorage.setItem(KEY, serialize(state));
  } catch {
    // Stockage indisponible : on réessaiera à la prochaine sauvegarde.
  }
}

export async function clearSave(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

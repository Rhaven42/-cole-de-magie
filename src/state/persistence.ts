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

const TUNING_KEY = 'arcanum.tuning';

/** Réglages de l'administration (id → valeur). */
export async function loadTuning(): Promise<Record<string, number>> {
  try {
    const json = await AsyncStorage.getItem(TUNING_KEY);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

export async function writeTuning(t: Record<string, number>): Promise<void> {
  try {
    await AsyncStorage.setItem(TUNING_KEY, JSON.stringify(t));
  } catch {
    // ignoré
  }
}

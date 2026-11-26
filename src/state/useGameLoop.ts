import { useEffect } from 'react';
import { AppState } from 'react-native';
import { TICK_SECONDS } from '../engine';
import { useGame } from './store';

const AUTOSAVE_MS = 15_000;

/** Boucle de jeu à pas fixe (250 ms), sauvegarde auto, reprise après arrière-plan. */
export function useGameLoop(): void {
  const ready = useGame((s) => s.ready);
  useEffect(() => {
    useGame.getState().init();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const loop = setInterval(() => useGame.getState().step(), TICK_SECONDS * 1000);
    const autosave = setInterval(() => useGame.getState().save(), AUTOSAVE_MS);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'background' || st === 'inactive') useGame.getState().save();
      if (st === 'active') useGame.getState().resumeFromBackground();
    });
    return () => {
      clearInterval(loop);
      clearInterval(autosave);
      sub.remove();
    };
  }, [ready]);
}

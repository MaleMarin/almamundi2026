'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DATA_SAVER_AUTOPLAY_EVENT,
  DATA_SAVER_AUTOPLAY_KEY,
  getNetworkConnection,
  readDataSaverAutoplayPref,
  shouldBlockVideoAutoplay,
  writeDataSaverAutoplayPref,
} from '@/lib/media/data-saver';

export function useDataSaverAutoplay() {
  const [prefOn, setPrefOnState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [blockAutoplay, setBlockAutoplay] = useState(false);

  const sync = useCallback(() => {
    const on = readDataSaverAutoplayPref();
    setPrefOnState(on);
    setBlockAutoplay(shouldBlockVideoAutoplay(on));
  }, []);

  useEffect(() => {
    sync();
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === DATA_SAVER_AUTOPLAY_KEY || e.key === null) sync();
    };
    const onCustom = () => sync();
    window.addEventListener('storage', onStorage);
    window.addEventListener(DATA_SAVER_AUTOPLAY_EVENT, onCustom);
    const conn = getNetworkConnection();
    conn?.addEventListener?.('change', sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(DATA_SAVER_AUTOPLAY_EVENT, onCustom);
      conn?.removeEventListener?.('change', sync);
    };
  }, [sync]);

  const setPrefOn = useCallback(
    (on: boolean) => {
      writeDataSaverAutoplayPref(on);
      setPrefOnState(on);
      setBlockAutoplay(shouldBlockVideoAutoplay(on));
      window.dispatchEvent(new Event(DATA_SAVER_AUTOPLAY_EVENT));
    },
    []
  );

  return { prefOn, setPrefOn, blockAutoplay, hydrated };
}

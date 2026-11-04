'use client';

import { useEffect } from 'react';

export function IrAContar() {
  useEffect(() => {
    window.location.replace('/contar');
  }, []);
  return null;
}

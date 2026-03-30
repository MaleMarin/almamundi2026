'use client';

import { createContext } from 'react';

/** Contenedor DOM bajo «Mapa de AlmaMundi» donde HomeMap hace portal del dock (evita getElementById). */
export const MapDockSlotContext = createContext<HTMLDivElement | null>(null);

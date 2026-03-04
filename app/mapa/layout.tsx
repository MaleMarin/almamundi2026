import React from 'react';

/**
 * Layout de /mapa: contenido + slot modal para intercepting route (observatorio).
 */
export default function MapaLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}

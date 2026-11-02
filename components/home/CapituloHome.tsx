type CapituloHomeProps = {
  ceja: string;
  titulo: string;
  tituloFuerte?: string;
  fuerte?: boolean;
  bajada?: string;
  bajadaFuerte?: string;
  /** Variante de la bajada para pantallas táctiles (sin mouse). */
  bajadaTactil?: string;
  cita?: string;
  /** La bajada y la bajada fuerte van en dos renglones. */
  bajadaEnDosLineas?: boolean;
  portada?: boolean;
  nivel?: 'h1' | 'h2';
};

export function CapituloHome({
  ceja,
  titulo,
  tituloFuerte,
  fuerte = false,
  bajada,
  bajadaFuerte,
  bajadaTactil,
  cita,
  bajadaEnDosLineas = false,
  portada = false,
  nivel = 'h2',
}: CapituloHomeProps) {
  const Titulo = nivel;
  const claseTitulo = portada
    ? 'home-capitulo-titulo home-capitulo-titulo-portada'
    : fuerte
      ? 'home-capitulo-titulo home-capitulo-titulo-fuerte'
      : 'home-capitulo-titulo';
  return (
    <header className="home-capitulo">
      <p className="home-capitulo-ceja">{ceja}</p>
      <Titulo className={claseTitulo}>
        {titulo}
        {tituloFuerte ? (
          <>
            {' '}
            <strong>{tituloFuerte}</strong>
          </>
        ) : null}
      </Titulo>
      {cita ? <p className="home-capitulo-cita">{cita}</p> : null}
      {bajada ? (
        bajadaEnDosLineas ? (
          <>
            <p className="home-capitulo-bajada home-capitulo-bajada-linea">
              {bajadaTactil ? (
                <>
                  <span className="solo-mouse">{bajada}</span>
                  <span className="solo-tactil">{bajadaTactil}</span>
                </>
              ) : (
                bajada
              )}
            </p>
            {bajadaFuerte ? (
              <p className="home-capitulo-bajada home-capitulo-bajada-elige">
                <strong>{bajadaFuerte}</strong>
              </p>
            ) : null}
          </>
        ) : (
          <p className="home-capitulo-bajada">
            {bajada}
            {bajadaFuerte ? (
              <>
                {' '}
                <strong>{bajadaFuerte}</strong>
              </>
            ) : null}
          </p>
        )
      ) : null}
    </header>
  );
}

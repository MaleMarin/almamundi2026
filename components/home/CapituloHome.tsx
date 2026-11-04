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
  /** El llamado en negrita va antes de la línea gris. */
  llamadoPrimero?: boolean;
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
  llamadoPrimero = false,
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
        {/* «\n» en el texto = punto aparte. */}
        {titulo.split('\n').map((parte, i) => (
          <span key={i}>
            {i > 0 ? <br /> : null}
            {parte}
          </span>
        ))}
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
            {llamadoPrimero ? (
              <>
            {bajadaFuerte ? (
              <p className="home-capitulo-bajada home-capitulo-bajada-elige">
                <strong>{bajadaFuerte}</strong>
              </p>
            ) : null}
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
              </>
            ) : (
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
            )}
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
      ) : bajadaFuerte ? (
        <p className="home-capitulo-bajada home-capitulo-bajada-elige">
          <strong>{bajadaFuerte}</strong>
        </p>
      ) : null}
    </header>
  );
}

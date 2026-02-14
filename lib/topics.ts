/**
 * Fuente única de temas/categorías para AlmaMundi.
 * Usar en dropdown de Temas (mapa) y en modales de inspiración.
 */
export type TopicItem = {
  title: string;
  questions: string[];
};

export const INSPIRATION_TOPICS: TopicItem[] = [
  { title: '01. Un día clave', questions: ['¿Qué día cambió tu vida para siempre?', '¿Cómo amaneció ese día?', '¿Qué detalle nunca olvidas?'] },
  { title: '02. Infancia', questions: ['¿A qué huele tu casa de la infancia?', '¿Cuál era tu escondite secreto?', '¿Qué juguete salvarías del fuego?'] },
  { title: '03. Amor y vínculos', questions: ['¿Quién te enseñó a querer?', '¿Qué abrazo te curó?', '¿Qué palabra te dijeron que guardas como un tesoro?'] },
  { title: '04. Pérdida y duelo', questions: ['¿A quién extrañas hoy?', '¿Qué te gustaría decirle si pudiera escucharte?', '¿Cómo honras su memoria?'] },
  { title: '05. Orgullo', questions: ['¿De qué logro propio te sonríes?', '¿Cuándo sentiste que eras capaz de todo?', '¿Qué batalla ganaste en silencio?'] },
  { title: '06. Miedo', questions: ['¿A qué le temías de niño?', '¿Qué miedo venciste recientemente?', '¿Qué te hace sentir vulnerable?'] },
  { title: '07. Migración', questions: ['¿Qué dejaste atrás al partir?', '¿Qué te llevaste en la maleta?', '¿A qué sabe tu nuevo hogar?'] },
  { title: '08. Trabajo', questions: ['¿Cuál fue tu primer sueldo?', '¿Qué aprendiste de tu oficio?', '¿Qué es lo que más te cansa y qué te motiva?'] },
  { title: '09. Comunidad', questions: ['¿Quién es tu vecino favorito?', '¿Qué fiesta de tu barrio no te pierdes?', '¿Cómo se ayudan entre ustedes?'] },
  { title: '10. Naturaleza', questions: ['¿Cuál es tu paisaje favorito?', '¿Qué árbol recuerdas con cariño?', '¿Te gusta más el mar o la montaña?'] },
  { title: '11. Cultura, música y libros', questions: ['¿Qué canción es la banda sonora de tu vida?', '¿Qué libro te voló la cabeza?', '¿Qué tradición mantienes viva?'] },
  { title: '12. Tecnología', questions: ['¿Cómo cambió tu vida internet?', '¿Qué extrañas de la época analógica?', '¿Qué invento te fascina?'] },
  { title: '13. Historia y País', questions: ['¿Qué evento histórico viviste en carne propia?', '¿Qué esperas para el futuro de tu país?', '¿Qué significa para ti tu bandera?'] },
  { title: '14. Tema Libre', questions: ['Cuenta lo que quieras.', 'El micrófono es tuyo.', 'Sorpréndenos.'] }
];

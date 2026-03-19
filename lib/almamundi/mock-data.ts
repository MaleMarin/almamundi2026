export const MOCK_STORIES = {
  video: {
    id: 'v001',
    titulo: 'El día que dejé todo para cruzar el océano',
    subtitulo: 'Una historia de valentía y raíces',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/video1/1920/1080',
    duracion: 183,
    fecha: '2026-03-01',
    citaDestacada: 'No sabía si iba a volver, pero sabía que tenía que ir.',
    autor: {
      nombre: 'Mariana Reyes',
      avatar: 'https://i.pravatar.cc/150?img=47',
      ubicacion: 'Ciudad de México → Barcelona',
      bio: 'Diseñadora, viajera, contadora de historias.',
    },
    tags: ['migración', 'identidad', 'valentía'],
  },
  audio: {
    id: 'a001',
    titulo: 'La voz de mi abuela que casi olvido',
    subtitulo: 'Memoria y pérdida',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    thumbnailUrl: 'https://picsum.photos/seed/audio1/800/800',
    duracion: 214,
    fecha: '2026-02-14',
    citaDestacada: 'Recordar no es solo conservar el pasado. Es protegerlo.',
    frases: [
      'Tenía una voz que sonaba como tierra mojada.',
      'Me contaba historias que nadie más sabía.',
      'La perdí un martes. El silencio llegó un miércoles.',
    ],
    autor: {
      nombre: 'Carlos Ibáñez',
      avatar: 'https://i.pravatar.cc/150?img=12',
      ubicacion: 'Oaxaca, México',
    },
    tags: ['memoria', 'familia', 'pérdida'],
  },
  texto: {
    id: 't001',
    titulo: 'Carta a la niña que fui',
    subtitulo: 'Sobre crecer en dos idiomas',
    contenido: `Querida yo de los ocho años:

Sé que ahora mismo no entiendes por qué mamá habla distinto en casa 
que en la calle. Por qué tú también lo haces. Por qué a veces sientes 
que eres dos personas en un solo cuerpo.

Te voy a decir algo que tardé veinte años en aprender: esas dos voces 
no se contradicen. Se necesitan.

El español que aprendiste de la abuela tiene palabras que el otro idioma 
nunca podrá traducir. "Madrugada" no es lo mismo que "early morning". 
"Añoranza" no tiene equivalente. "Sobremesa" tampoco.

Eres un puente, no una fractura.

Con todo mi amor,
Tú, a los veintiocho.`,
    tiempoLectura: 4,
    fecha: '2026-01-20',
    autor: {
      nombre: 'Sofía Mendoza',
      avatar: 'https://i.pravatar.cc/150?img=23',
      ubicacion: 'Buenos Aires → Montreal',
    },
    tags: ['identidad', 'escritura', 'infancia'],
  },
  fotos: {
    id: 'f001',
    titulo: 'Las manos de mi padre',
    subtitulo: 'Un álbum de trabajo y tiempo',
    fecha: '2026-03-10',
    imagenes: [
      { url: 'https://picsum.photos/seed/hands1/1200/900', caption: 'Sus manos en 1987, cuando llegó al taller por primera vez.' },
      { url: 'https://picsum.photos/seed/hands2/1200/900', caption: 'Treinta años después, las mismas manos.' },
      { url: 'https://picsum.photos/seed/hands3/900/1200', caption: 'Lo que construyó con ellas.' },
      { url: 'https://picsum.photos/seed/hands4/1200/900', caption: 'El día que se jubiló.' },
      { url: 'https://picsum.photos/seed/hands5/1200/900', caption: 'Ahora enseña a mi hijo.' },
    ],
    autor: {
      nombre: 'Roberto Vargas',
      avatar: 'https://i.pravatar.cc/150?img=68',
      ubicacion: 'Guadalajara, México',
    },
    tags: ['familia', 'trabajo', 'tiempo'],
  },
};

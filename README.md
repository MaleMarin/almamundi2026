# AlmaMundi 🌍

**AlmaMundi** es una plataforma digital que visualiza historias, noticias y sonidos globales sobre un mapa interactivo y un globo 3D. Es un espacio para explorar la huella humana y el pulso del mundo en tiempo real, combinando tecnología moderna y derechos digitales.

Este repositorio contiene la aplicación full-stack construida con Next.js (App Router), React 19, y Tailwind CSS v4.

---

## 🚀 Empezando

### Prerrequisitos

- Node.js 18.x o superior.
- Pnpm (o npm/yarn si prefieres).
- Variables de entorno: Solicita el archivo `.env.local` al equipo de desarrollo.

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/almamundi.git
   cd almamundi
   ```
2. Instala las dependencias:
   ```bash
   pnpm install
   ```
   *(O `npm install` si usas npm.)*

### Desarrollo

Para iniciar el servidor de desarrollo, ejecuta:

```bash
pnpm dev
```

El servidor estará disponible en:

**🔗 http://127.0.0.1:3005**

### Otros Scripts Útiles

| Comando | Descripción |
|--------|-------------|
| `pnpm build` | Prepara la aplicación para producción. |
| `pnpm start` | Inicia el servidor de producción. |
| `pnpm lint` | Ejecuta el linter de ESLint. |
| `pnpm seed:stories` | Sube datos de prueba para las historias (requiere permisos de Firebase). |

---

## 🛠️ Stack Tecnológico

| Área | Tecnología |
|------|------------|
| Framework | Next.js (App Router, TypeScript, Tailwind 4) |
| Base de Datos / Auth | Firebase (Admin SDK, Auth, Firestore, Storage) |
| Visualización | react-globe.gl, three.js |
| Animaciones | framer-motion |
| Integraciones | OpenAI, Resend, rss-parser |

---

## 📝 Reglas del Proyecto y Documentación

Este proyecto se rige por reglas y directrices específicas para mantener la calidad y consistencia del código. Consulta la carpeta **`.cursor/rules/`** y la documentación adicional en **`docs/`** para más detalles.

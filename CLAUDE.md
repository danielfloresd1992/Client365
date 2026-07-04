# CLAUDE.md

Contexto del proyecto para Claude Code. Este archivo se carga automáticamente al
inicio de cada sesión. Mantenerlo enfocado en lo **estable** (propósito, stack,
convenciones). El historial de cambios vive en [CHANGELOG.md](CHANGELOG.md).

## Propósito

**Jarvis365** (paquete `jarvis365_dev`, marca pública **Amazonas365**) es una
plataforma de **supervisión y gerencia remota empresarial** (restaurantes,
franquicias, retail). Permite a dueños/gerentes vigilar establecimientos,
gestionar usuarios y managers, revisar cortes de caja por hora, recibir alertas
en tiempo real y publicar contenido.

Se despliega como web (Next.js) y también se empaqueta en **Cordova** (WebView
`net.jarvis365.app`).

## Stack

- **Next.js 14.2.4** (App Router) + **React 18** + **TypeScript**
- Estado: **Redux Toolkit** (~17 slices en `src/store/slices`) + React Contexts (`src/contexts`)
- Estilos: consolidados en `src/style/styles.css` (Tailwind + `@layer components`).
  El sistema de diseño se deriva de esos archivos; ver `design-system/`.
- UI: MUI 7, flowbite-react, react-icons, react-slick, chart.js / @mui/x-charts
- Realtime: **socket.io-client**
- Voz/alertas: **piper-tts-web** vía el hook `useSpeckAlert`
- Formularios: react-hook-form + @hookform/resolvers
- HTTP: axios (con soporte de cookie jar para sesión cross-domain)

## Estructura

```
src/
├── app/            Rutas (App Router): auth, Lobby, user, establishment,
│                   Corte365, clients&manasgement, alertmanasgement, form
├── components/     Componentes de UI reutilizables (~40 carpetas)
├── contexts/       React Contexts
├── hook/           Custom hooks (incl. ajax_hook)
├── libs/           Lógica no-UI: ajaxClient, ajaxServer, auth, socket,
│                   time, parser, notification_push, data, script
├── store/          Redux Toolkit (store + slices)
├── interfaces/     Interfaces TS
├── types/          Tipos TS
└── style/          styles.css (fuente única de estilos)
```

## Comandos

```bash
npm run dev      # servidor de desarrollo (next dev)
npm run build    # build de producción (next build)
npm run start    # producción vía server custom (node server_start)
npm run lint     # next lint
```

Servidor custom HTTPS en `server.js` (puerto **3005**), certificados en `cert/`.

## Convenciones y quirks (IMPORTANTE)

Cosas que **no** se deducen del código y condicionan cómo se trabaja:

- **Backend en otro servidor/dominio.** Cookies **cross-domain** con
  express-session. No asumir mismo origen al tocar auth o peticiones.
- **No hay middleware de Next.** La protección de rutas es **client-side**
  (LoadingGuard / componentes). El backend es la seguridad real; la protección
  del front es solo UX (evitar flashes de contenido).
- **`next build` falla ante errores de ESLint** (no hay
  `eslint.ignoreDuringBuilds`). Un solo error de lint **rompe el deploy de
  Netlify**. Verificar lint antes de pushear.
- **`next.config.mjs`:** con `DEV_ALT_DIST=1` usa `.next-dev`; en dev evita el
  watcher de flowbite (ENOSPC en disco externo).
- **Variables de entorno** (`.env`, todas `NEXT_PUBLIC_`):
  `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_AVA`,
  `NEXT_PUBLIC_SOCKET_AVA_CHAT`, `NEXT_PUBLIC_SOCKET_JARVIS`.
- Idioma del código y los commits: **español**. Mantener ese estilo.

## Build y Deploy

- Deploy: commits a **`main`** → push → **Netlify** construye desde GitHub.
- Push con PAT guardado (`credential.helper store`).
- `netlify.toml` + `@netlify/plugin-nextjs`.
- Antes de pushear: `npm run lint` debe pasar (si no, el build de Netlify falla).

## Notas / pendientes conocidos

- `README.md` tiene un **conflicto de merge sin resolver** (`<<<<<<< HEAD` …
  `>>>>>>>`). Conviene resolverlo.
- Existen carpetas `.next.broken-root-owned` y `.next-dev` como artefactos de
  build; no son fuente.

## Registro de cambios

Todo cambio relevante (propio o hecho con Claude Code) se anota en
[CHANGELOG.md](CHANGELOG.md). Al terminar un cambio significativo, añadir una
entrada nueva arriba, con fecha, autor/modelo y resumen.

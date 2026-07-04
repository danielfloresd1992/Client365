# Jarvis365 / Amazonas365

Plataforma de **supervisión y gerencia remota empresarial** (restaurantes,
franquicias, retail): vigilancia de establecimientos, gestión de usuarios y
managers, cortes de caja por hora, alertas en tiempo real y publicaciones.

Construida con **Next.js 14 (App Router)** + React 18 + TypeScript. Se despliega
como web y se empaqueta en **Cordova** (WebView `net.jarvis365.app`).

> 📄 El contexto completo del proyecto (stack, estructura, convenciones y
> quirks) está en [CLAUDE.md](CLAUDE.md). El historial de cambios en
> [CHANGELOG.md](CHANGELOG.md).

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo (next dev)
```

## Scripts

| Comando         | Descripción                                   |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Servidor de desarrollo                        |
| `npm run build` | Build de producción (`next build`)            |
| `npm run start` | Producción vía servidor custom (`server_start`) |
| `npm run lint`  | Linter (`next lint`)                          |

## Notas

- El backend corre en **otro dominio** (sesión con cookies cross-domain).
- Variables de entorno en `.env` (todas `NEXT_PUBLIC_`): `NEXT_PUBLIC_API_URL`,
  `NEXT_PUBLIC_SOCKET_AVA`, `NEXT_PUBLIC_SOCKET_AVA_CHAT`,
  `NEXT_PUBLIC_SOCKET_JARVIS`.
- **`next build` falla ante errores de ESLint** → correr `npm run lint` antes de
  desplegar (Netlify construye desde `main`).

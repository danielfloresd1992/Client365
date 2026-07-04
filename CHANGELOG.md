# Registro de cambios — Jarvis365 / Amazonas365

Historial legible de cambios del proyecto (propios y realizados con **Claude
Code**). El respaldo real y completo de cada línea vive en el historial de git;
este archivo es el resumen humano del **qué** y el **porqué**.

> **Cómo añadir una entrada:** al terminar un cambio significativo, agrega un
> bloque nuevo **arriba de todo** (más reciente primero) usando la plantilla del
> final. Indica fecha, autor/modelo y un resumen del qué y el porqué.

---

## 2026-07-04
- **Envío a WhatsApp (`shareJarvis.js`):** infiere el tipo MIME por extensión cuando
  el blob no trae uno válido (arreglando que el video no se procesara), protege el
  caption (`menu || ''`) y quita un `console.log` del blob. Acompaña el fix del
  endpoint `sendImg_text_api` en el bot (ava_bot): error real en vez de `{name:"t"}`,
  `filename` con extensión y fallback a documento si el envío inline falla. _(Claude Code)_
- **Noveltie (mejora significativa):** corrige la clave `isValidate` duplicada en el
  guardado del menú (se perdía data), **debounce** de 600 ms al guardar (antes 1 PUT
  por tecla), listeners de socket con refs (sin re-suscribir en cada render),
  null-guards en `user`, helper `downloadBlob` (dedup + limpieza de object URL),
  feedback de error por modal, `isVideoBooleanState` → derivado `hasVideo`, rename
  `permissionUser` → `isReadOnly`, y limpieza de `console`/typos. _(Claude Code)_
- **Reproductor + carrusel (`slider.jsx`):** arregla el `<video>` (atributos que
  estaban en `<source>` y se ignoraban), agrega `playsInline` (clave en iOS/Cordova),
  `poster`, `preload=metadata` y **pausa al salir de pantalla**; desactiva el autoplay
  del carrusel cuando hay video; guarda contra `imageShare` nulo; memoiza las URLs;
  `loading=lazy`/`decoding=async`; grid escalable; keys estables y `aria-label` en las
  flechas. _(Claude Code)_
- **TextAreaAutoResize:** nuevo prop `lockFirstTwoLines` que bloquea la edición de
  las **dos primeras líneas** (revierte el cambio en el textarea controlado y avisa
  con el modal global `warning` explicando por qué no deben alterarse los datos del
  cliente). También cubre la inserción de emojis. Activado en el menú del cliente en
  `Noveltie`. Incluye limpieza de `console.log` de debug en `clientBox` y `page` de
  clients&manasgement. _(Claude Code)_ `d67c42d`
- **Corrección** en la variable de tiempo de creación del establecimiento. `caaf0fa`

## 2026-07-03
- **Formularios de establecimientos:** cambios varios. `0cd599f`

## 2026-06-21
- **Corte por hora:** corrección del cálculo. `e42bba9`
- **CorteForm:** refactor de la estructura y lógica del componente _(estilo Claude Code)_. `b9b90e9`

## 2026-06-15
- **Formularios de clientes:** refactorización para darles reactividad. `141c2d7`
- **Modal:** cambio de estado al estar autenticado. `825f475`
- **Loader / servidor caído:** se extrae `ServerConnectionError` + alerta de
  servidor caído por socket y voz (`useSpeckAlert`) _(Claude Code)_. `2d38f93`
- **Auth/UX:** proteger `/user` y rutas admin, eliminar el flash de contenido y
  añadir pantalla de error de conexión _(Claude Code)_. `e67d59a`
- **CSS:** quitar `@apply group` inválido de `chip-drag`; guía con CSS
  compilado, tipografía y espaciado _(Claude Code)_. `13d9f97`
- **Estilos** de presentación: finiquito. `a75c810`
- **Limpieza:** eliminar sandboxes de preview (rayfx/loader) _(Claude Code)_. `16e4aae`
- **Fix lint:** escapar comillas en `FormReact` para desbloquear el build de
  Netlify _(Claude Code)_. `64585a5`

## 2026-06-13 – 2026-06-14
- Estilos en pantalla de carga, login y presentación; color del header. `a361d2e` `e8cefb3` `9b80f9a` `5fd4bd2`
- **Fix Netlify:** dejar de versionar `.npmrc` (su `prefix` rompía nvm en el
  build) _(Claude Code)_. `6ba1485`
- Managers: dos nuevas propiedades en el formulario. `64f4d35`

## 2026-06-11 – 2026-06-12
- **Drag & drop de imágenes:** nuevo componente para recibir imágenes por
  arrastre, con estilos y carga (`zoneDropImg`) _(Claude Code / IA)_. `45068c0` `8cf457e`
- Módulo de gerentes: modificación y finalización. `22549e6` `3cf5f86`

## Anteriores (2026-04 – 2026-05)
- Corrección en el envío de imagen. `0e77500`
- Fix de bug al desplegar; renderizado de imágenes en el horario de usuarios. `0154d4b` `200b96e`
- Validación de teléfono único por usuario en `createUser`. `8fe4f68`

---

## Plantilla para nuevas entradas

```markdown
## AAAA-MM-DD
- **[Área]:** qué cambió y por qué. _(autor o modelo, p. ej. Claude Code)_ `<hash>`
```

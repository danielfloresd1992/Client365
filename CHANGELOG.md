# Registro de cambios — Jarvis365 / Amazonas365

Historial legible de cambios del proyecto (propios y realizados con **Claude
Code**). El respaldo real y completo de cada línea vive en el historial de git;
este archivo es el resumen humano del **qué** y el **porqué**.

> **Cómo añadir una entrada:** al terminar un cambio significativo, agrega un
> bloque nuevo **arriba de todo** (más reciente primero) usando la plantilla del
> final. Indica fecha, autor/modelo y un resumen del qué y el porqué.

---

## 2026-07-18
- **Acciones de jornada en el menú contextual (`user.list.jsx` +
  `user.day.assign.form.jsx`):** con click derecho sobre una celda: "Marcar
  descanso" (guarda el override de inmediato, sin formulario), "Asignar
  guardia" (modal compacto con hora de entrada/salida y turno, defaults de la
  regla semanal) y "Marcar extra" (visible solo cuando el día efectivo es
  libre/descanso; abre el mismo modal porque un extra sin horario rompe el
  marcaje). Todo guarda por el endpoint grupal existente con el admin de la
  sesión, revisa los errores por item de la respuesta (el endpoint responde
  200 aunque fallen), avisa por el modal global y la celda se refresca por
  socket. _(Claude Code)_
- **Composer de comentarios en el popover + rediseño de `DetailPopover`
  (`user.list.jsx`):** el popover se redistribuyó (header con foto e identidad
  en una línea, estado+duración en una fila, entrada/salida lado a lado,
  auditoría al pie) y los comentarios subieron con identidad dorada a juego
  con la muesca (marco ámbar, contador en píldora `#f0a500`). Debajo de la
  lista, input estilo red social (`CommentComposer`, componente a nivel de
  módulo para no perder foco al tipear) con botón de enviar redondo, Enter
  para enviar, spinner mientras guarda y errores por el modal global — solo
  usuarios super. El tiempo real ya estaba: el endpoint de comentarios emite
  el socket y todas las celdas montadas (de todos los clientes conectados)
  actualizan la lista al instante. Luego se extrajo `DetailPopover` a
  componente de módulo (identidad estable): antes estaba definido dentro de
  `AttendanceCell` y cada update (socket, envío, click) lo desmontaba y
  re-montaba — animación repetida, foco perdido, borrador borrado. Ahora los
  comentarios entrantes solo re-pintan la lista en su lugar. También se cortó
  la propagación de eventos del portal hacia la celda (un click dentro del
  popover disparaba la selección por arrastre de la grilla). _(Claude Code)_
- **Sistema de colores unificado en `AttendanceCell` (`user.list.jsx`):**
  `markedHour` y `preMarkedHour` se fusionaron en `renderDaySchedule` — una
  sola lógica que cubre pasado/hoy/futuro (isToday/isPast solo deciden si se
  muestran horas reales u horario programado). Paleta `CELL_COLOR_SYSTEM`
  (fondos claros, texto con contraste por color): rojo=falta, verde=extra,
  amarillo=cambio de guardia (override), gris=descanso, morado=empleado con
  menos de 1 semana creado, blanco=guardia por defecto; azul oscuro reservado
  para "quien lleva el turno" (futuro). Jerarquía: falta > extra > descanso >
  cambio > nuevo > guardia. Llegada tarde y falta llevan borde rojo resaltado
  (reemplaza el fondo rosado del wrapper). De paso: las faltas futuras ya se
  pintan en rojo (antes `preMarkedHour` no las manejaba) y se eliminó un
  onClick de debug con `console.error`. _(Claude Code)_
- **Comentarios por día en asistencia (modelo + endpoint + UI):** el modelo
  `Attendance` ganó `comments[]` (`{user: ref, message, date}`). Nuevo POST
  `/user/attendance/comment` protegido con `validateSessionAndUserSuper`
  (solo usuarios super): upsertea el documento del día (`createdBy` = autor si
  lo crea), toma el autor de la sesión (nunca del body) y emite el socket para
  refrescar la celda en vivo. En la grilla: "Agregar comentario" (icono de
  burbuja) aparece solo para supers y con click derecho **sobre una celda**
  (la fecha se captura vía `data-dateiso`); abre el modal
  `user.comment.form.jsx` (cabecera con operador + fecha, textarea con
  contador, Escape/click-fuera) y guarda vía `addAttendanceComment`. El
  `DetailPopover` muestra la caja de comentarios con mini-foto, autor, fecha y
  mensaje, y ahora también se abre en días que solo tienen comentarios.
  _(Claude Code)_
- **Auditoría de documentos de asistencia (attendance.model.js + endpoints +
  DetailPopover):** el modelo `Attendance` ahora guarda `createdBy` (ref al
  usuario que originó el documento: el empleado al marcar, o el admin que
  asignó un override sobre un día sin registro) y `editedBy[]` (historial de
  ediciones administrativas: quién, cuándo y qué campos del override
  cambiaron, cada cambio como `{field, from, to}` con el valor anterior y el
  nuevo). Compatible hacia atrás (defaults null/[]). Los marcajes de
  entrada/salida NO se registran como ediciones a propósito. El endpoint
  grupal hace `$setOnInsert` de createdBy y push a editedBy con el diff real
  de campos; el GET de asistencia por día y los eventos socket populan
  `createdBy`/`editedBy.user` (name/surName/img). En el `DetailPopover` de la
  grilla se muestra "Creado por" y las últimas 3 ediciones con foto de perfil
  en miniatura, fecha y chips de los campos cambiados con valor anterior →
  nuevo. El popover ahora también se abre en celdas de **falta asignada** (sin
  checkIn) mostrando el badge "✗ Falta asignada" y la auditoría de quién la
  asignó; los bloques ENTRADA/SALIDA solo se renderizan si hay marcaje.
  _(Claude Code)_
- **Calendario de horario del operador (`user.schedule.calendar.jsx`):** "Ver
  horario" del menú contextual ahora abre un modal (overlay oscuro translúcido,
  portal a body para escapar del zoom de la grilla) con el mes completo del
  operador en calendario: regla por defecto (`scheduleByDay`), días modificados
  (`scheduleOverride`, marcados con ✦), asistencia real (IN/OUT, retardo,
  falta/ausente), resumen del mes y **quién modificó cada día** (última nota de
  `scheduleOverride.note`, tooltip con mensaje y fecha). Toda la data del mes
  llega en UNA petición (`getAttendanceReport`), no una por celda. Navegación
  de meses, Escape/click-fuera para cerrar. En el backend: el reporte
  individual ahora popula `scheduleOverride.note.user` (name/surName), y el
  endpoint grupal de horarios **conserva el historial de notas y registra
  siempre al admin** que modifica (antes `$set` con `note: []` borraba el
  historial en cada edición y el `$push` condicional tenía un conflicto de
  paths de MongoDB que lo hacía fallar). _(Claude Code)_

## 2026-07-17
- **ContextMenu rediseñado (`components/ContextMenu.jsx` + items en
  `user.list.jsx`):** ahora se renderiza en un portal sobre `document.body`
  (antes vivía dentro del árbol con `zoom` de la grilla y se desposicionaba con
  zoom ≠ 100%). Cierra con click/tap fuera del menú (pointerdown con detección
  de destino), con scroll en cualquier contenedor (`capture: true`), con Escape
  y con resize. Se reajusta para no cortarse en los bordes del viewport y entra
  con animación sutil (150 ms, respeta `prefers-reduced-motion`). Los items del
  menú de la grilla de horarios ahora llevan cabecera con el nombre del
  empleado, iconos SVG inline y el vocabulario visual del panel
  (`rounded-md`, hover gris, `role='menuitem'`). _(Claude Code)_
- **Formulario de edición de usuario — envío parcial + historial visible
  (`user.update.form.jsx` + PUT `/user/:id` en api_jarvis365):** el formulario
  ahora envía SOLO los campos modificados (`dirtyFields` de react-hook-form +
  diff de `scheduleByDay`); los subobjetos `jobInformation`/`workSchedule` se
  envían completos (fusionados) cuando cambia cualquier subcampo, porque el
  `$set` reemplaza el subdocumento entero. Al final del formulario se muestra
  "Últimas modificaciones" (últimas 5 entradas de `updateByUser`: quién, cuándo
  y qué campos). En el backend: el PUT ahora persiste solo las claves realmente
  enviadas (los `.default(null)` de yup inyectaban `dni:null`, `img:null`,
  `workSchedule` con solo flags para claves ausentes — un parcial habría
  borrado datos), `updateByUser.change` registra solo lo modificado, la
  respuesta incluye `updateByUser` populado (name/surName) y se añadió `email`
  al `userUpdateSchema` (antes el correo editado se descartaba en silencio por
  `noUnknown`). También: `handleUpdateUser` en `page.jsx` ya no traga errores —
  muestra modal de error con el mensaje del backend. _(Claude Code)_

## 2026-07-16
- **Sidebar de `/user` rediseñado (`Aide_nav.jsx`):** alineado al lenguaje visual
  del panel (card blanca `rounded-xl border shadow-sm`, item activo
  `bg-emerald-600` como los tabs de asistencia, labels uppercase pequeños).
  Iconos PNG con hacks de `contrast` reemplazados por SVG inline
  (`stroke: currentColor`); toggle negro reemplazado por control blanco con
  chevron que rota (aria-expanded/aria-label, `motion-reduce`); resaltado de
  ruta activa con `usePathname`; botón "Volver" (antes muerto) ahora navega a
  `/Lobby`. En `layout.jsx` se corrigió `bg-gray` (clase inválida) →
  `bg-gray-50`. Se creó `PRODUCT.md` (contexto de diseño del proyecto).
  _(Claude Code)_
- **Tailwind — `darkMode: "selector"` (`tailwind.config.ts`):** sin `darkMode`
  configurado regía el default `'media'`, y con el SO en tema oscuro se activaban
  solas las clases `dark:` de flowbite (labels con `dark:text-white` invisibles
  sobre fondo blanco). La app es solo tema claro y ningún componente propio usa
  `dark:`; ahora esas clases solo aplicarían con `<html class="dark">`, que nunca
  se pone. _(Claude Code)_
- **Formulario de edición de usuario (`user.update.form.jsx`) — fix estilos flowbite
  y checkboxes:** dos causas independientes. (1) Se eliminó una regla legacy global
  de `styles.css` (`input[type="checkbox"]+label:before`, del primer commit) que
  dibujaba un cuadro absoluto de 25×25 px sobre cualquier checkbox seguido de label
  y rompía los `<Checkbox>` de flowbite; ningún componente la usaba (verificado en
  los 8 archivos con checkboxes). (2) El formulario usaba API vieja de
  flowbite-react (el proyecto tiene v0.12): prop `value` de `Label` (los labels de
  Departamento/Puesto/Turno Global se renderizaban vacíos) → texto como children;
  prop `helperText` de `TextInput` (los errores nunca se mostraban) → componente
  `<HelperText color='failure'>`; `color='gray'` inválido en `Label`; IDs duplicados
  (`id='name'` en 3 inputs) → `surName`/`detail`; ruta de error incorrecta
  (`errors.name?.detail` → `errors.jobInformation?.detail`). También typos
  ("Coreo"→"Correo", "Jaun"→"Juan"). Se regeneró `.flowbite-react/class-list.json`
  (`npx flowbite-react build`; en dev el watcher está desactivado a propósito).
  Lint OK. _(Claude Code)_

## 2026-07-05
- **FormClient — grupo de WhatsApp por establecimiento:** nueva función
  `libs/ajaxClient/groups.fecth.js` (GET `{NEXT_PUBLIC_SOCKET_AVA_CHAT}/bot/groups`,
  devuelve `[]` si el bot no está conectado) y select nulleable "Grupo de WhatsApp"
  en Configuración avanzada (`InputBorderBlue`, opción "Sin grupo asignado" → `null`).
  La selección se guarda en `establishment.groupId`; el backend (api_jarvis365) ya
  tiene el campo en schema yup y modelo Mongoose. _(Claude Code + backend por Daniel)_
- **Envío a WhatsApp — fix 401 al descargar el video (`shareJarvis.js`):** la URL del
  media viene guardada con el host `amazona365.ddns.net` (sin puerto) mientras la
  cookie de sesión pertenece al host del API (`NEXT_PUBLIC_API_URL`); el navegador no
  adjuntaba la cookie y la ruta protegida respondía 401. Ahora se reescribe el origen
  de la URL al del API antes de descargar, para que la petición vaya autenticada.
  Pendiente a futuro: mover esta lógica a `changeHostNameForImg` (hoy no-op) para
  cubrir todas las descargas. _(Claude Code)_

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

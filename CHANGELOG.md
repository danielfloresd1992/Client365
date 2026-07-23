# Registro de cambios — Jarvis365 / Amazonas365

Historial legible de cambios del proyecto (propios y realizados con **Claude
Code**). El respaldo real y completo de cada línea vive en el historial de git;
este archivo es el resumen humano del **qué** y el **porqué**.

> **Cómo añadir una entrada:** al terminar un cambio significativo, agrega un
> bloque nuevo **arriba de todo** (más reciente primero) usando la plantilla del
> final. Indica fecha, autor/modelo y un resumen del qué y el porqué.

---

## 2026-07-23
- **Horario de monitoreo (`/clients&manasgement`) — modal, tipo, invierno USA y
  tarjeta de hoy:** el horario de un establecimiento dejó de abrirse en la
  subruta `/time_monitoring` y ahora se gestiona en un **modal** dentro de la
  ruta (como el formulario de gerentes). En el formulario de rangos se añadió el
  **tipo de monitoreo** (Analítico / Perimetral), inputs `type='time'`, botón
  **Cancelar** (se quitó la X), aviso de horario corrido y se arregló un bug por
  el que el Domingo (día 0) no guardaba. El render del horario se rehízo:
  columnas de día como tarjetas, cada rango con badge de tipo y total que cuenta
  bien el corrido. Se agregó el **switch "Este local usa horario USA"** con
  pestañas Normal / Invierno para editar cada horario, y un **interruptor global
  de invierno** en el header (solo admin). La tarjeta "Horario monitoreo" ganó
  ícono de monitoreo y muestra el **horario de hoy** (con horario / libre /
  sin configurar), con el botón "Gestionar" al pie. Requiere el backend de
  api_jarvis365 (tipo/USA/invierno + endpoints `active` y `today`). _(Claude Code)_
- **Novedades (`Noveltie`) — sin envío doble por WhatsApp y botones
  unificados:** un doble clic en "Enviar video"/"Enviar imagen" disparaba dos
  veces `shareNoveltyForApiAva` (async, con dos llamadas de red), enviando la
  novedad duplicada. Se añadió un cerrojo en un `useRef` — no en el estado,
  porque un doble clic ejecuta ambos handlers antes de que React re-renderice —
  liberado en un `finally` para que ningún `return` temprano ni excepción deje
  el botón bloqueado; además ambos botones se deshabilitan mientras dura el
  envío. En lo visual se descubrió que **había dos sistemas de botones
  compitiendo** (`.btnPublic` y una capa posterior `body .btnPublic`, que ganaba
  por especificidad): lo que se veía era un híbrido de colores de una capa y
  radio/padding de la otra. Se consolidaron en uno solo: la base queda
  estructural y todo el diseño vive una única vez en la capa `body`. Los botones
  pasan a grupo segmentado (sin radio propio, separadores de 1px, 30px de alto),
  el color aparece solo cuando el estado está activo (tinte suave + tinta
  saturada + barra inferior de 2px) y se retiraron el `filter: grayscale`, el
  `rebeccapurple` placeholder del botón Descargar y los `color:#fff` forzados
  que dejaban labels ilegibles. Estados completos (hover, foco, pulsado,
  deshabilitado) y contraste AA verificado en todos. _(Claude Code)_
- **Refactor de `/alertmanasgement` a componentes (sin cambios funcionales):**
  el formulario y la lista estaban en dos archivos monolíticos (`FormReact.jsx`
  1499 líneas y `ListMenu.jsx` 663). Se extrajo `assets/lib/` con lo que estaba
  duplicado (`fieldLabels`, `format` con `initials`/`photoUrl`/`norm`/`slug`, y
  `categoryMeta`), la lista se dividió en `view/list/` (AlertCard, PersonRow,
  FlagChip, SearchBar, CategoryPills, CategoryGroup, skeleton y estado vacío) y
  el formulario en `view/form/` con **12 secciones** en `form/sections/`. El
  JSX de las secciones se movió verbatim (corte programático, no re-tipeado) y
  cada helper viajó con su sección. Resultado: 365 y 253 líneas; ningún archivo
  pasa de 365. De paso se quitó código muerto (`categoryRef`, prop `modal`,
  import `axiosStand`). _(Claude Code)_
- **Permiso de super usuario al crear/editar alertas:** los errores del backend
  ya no se pierden en consola: `FormReact` muestra un modal con el `message`
  del 403/401 (nuevo `validateSuperUser` en api_jarvis365, que evalúa
  `req.session.super`). _(Claude Code)_
- **Autoría visible en cada alerta:** debajo de los títulos ES/EN se muestra
  quién creó la alerta y las últimas 3 ediciones, con miniatura de la foto del
  usuario, nombre y qué campos cambió. Requiere el `populate` de `createdBy` y
  `updateByUser.user` que se agregó en api_jarvis365. La lista se refresca sola
  al guardar. _(Claude Code)_
- **Mejoras de UI del panel de alertas:** historial de cambios colapsable
  dentro del modal, aviso al cerrar con cambios sin guardar (✕/Escape/clic
  fuera), barra de navegación por secciones del formulario, resaltado de la
  alerta seleccionada, encabezados de categoría fijos al hacer scroll y
  skeleton de carga. _(Claude Code)_
- **Formulario como modal glass y lista rediseñada:** el formulario dejó de ser
  un panel lateral al 50% y pasó a ser un **modal fijo en el viewport** con
  fondo oscurecido + `backdrop-filter` (estilos scopeados bajo `.alert-modal`
  para no tocar las utilidades globales `__input`/`__label`). La lista se
  rediseñó: buscador por título (sin acentos ni mayúsculas), botón "Nueva
  alerta" compacto, filtros de categoría con más aire, **agrupación por
  categoría** e indicadores ✓ de "uso en reporte del cliente" y "alerta en
  vivo" por alerta. _(Claude Code)_
- **Menús (`/alertmanasgement`) — envío parcial + auditoría de ediciones
  (FormReact + `/menu/put` en api_jarvis365):** el formulario ahora envía SOLO
  los campos modificados (diff del `menu` actual vs el original cargado, por
  clave de nivel superior; aviso "Sin cambios" si no hay). En el backend, el
  modelo `Menu` ganó `updateByUser` (array `{user: ref 'user', change:
  [{key,value}], date}`, `select:false`); la capa `putMenu` se reescribió para
  hacer `$set` solo de lo recibido + `$push` al historial con el autor de la
  sesión (antes reconstruía el documento entero, lo que con un parcial borraría
  campos), y `getMenuById` popula el historial. El verbo pasó de
  `POST /menu/put` a **`PUT /menu/put`** en front y back. _(Claude Code)_

## 2026-07-22
- **Header reestructurado + /auth responsivo + fixes del registro:** el Header
  autenticado pasó de 3 botones a campana de notificaciones (estética, con dos
  iconos según haya o no no-leídas) + avatar con menú desplegable que agrupa
  Configuración y Cerrar sesión; responsivo en una sola fila (nombre oculto
  <460px). La ruta `/auth` ahora es pantalla completa en móvil (<820px):
  rompe el padding global del body, oculta el panel de marca y el formulario
  ocupa el 100% (desktop ≥820px intacto). En el registro (`CreateUser`) se
  arreglaron los inputs de teléfono y del código de verificación: los `flex`
  inline con basis 0/px colapsaban la altura o descuadraban al pasar a columna
  (<600px); ahora usan clases con basis auto y reset en columna. _(Claude Code)_

## 2026-07-19
- **Columna del día de hoy, header de fecha y preferencias persistentes:** la
  columna del día presente lleva rieles azules de 3px a los lados (box-shadow
  inset, sin desplazar el layout) en celdas, resúmenes y header — que además
  gana tapa superior, fondo azulado y número en azul — con su chip "Marco
  azul: columna del día de hoy" en la leyenda. El header de fecha pasó a tres
  líneas (Mes completo / número / día de la semana completo, 12px, findes en
  rojo) y el rótulo sticky de departamento se recalibró a top-69px. El
  sidebar abre por defecto (localStorage manda) y el zoom de la grilla se
  persiste (`userSchedulerZoom`, clamp 50–100). _(Claude Code)_
- **Leyenda de colores en el sidebar + tarde rosado + falta en rojo pleno:**
  el Panel de Empleados ganó una leyenda bajo los botones con chips de todos
  los colores de la grilla (laboral, cambio/permiso, extra, descanso,
  vacaciones, tarde, falta, degradado del empleado nuevo "del día 1 a los 3
  meses", muesca dorada de comentarios y campana azul del encargado de
  turno), con scroll propio. Llegada tarde ahora pinta el fondo rosado
  (`bg-rose-100`, gana al degradado morado) y la falta pasó a rojo pleno
  (`bg-red-600`) con texto blanco. La tarjeta del operador muestra la fecha
  de ingreso (DD/MM/YYYY) y las horas del horario programado llevan la clase
  de color en cada span (una regla global de `span` en styles.css las pintaba
  gris sobre el morado oscuro). _(Claude Code)_
- **Degradado de antigüedad y orden por antigüedad:** el morado de empleado
  nuevo ahora es un degradado por tramos (`NEW_EMPLOYEE_TIERS`): intenso la
  1ª semana (purple-300), suavizándose por mes (200 → 100 → 50) hasta llegar
  a blanco a los 3 meses. Además, las listas de todos los departamentos se
  ordenan por antigüedad (los más antiguos primero; a igual fecha desempata
  la jerarquía del cargo). También: el rol onDuty se renombró solo
  estéticamente en el front a "encargado de turno"/"Turno" (botones, modal,
  badge) — internamente sigue siendo onDuty/guardia. _(Claude Code)_
- **Miniaturas de fotos vía backend (`sharp`):** el endpoint
  `/user/multimedia/:namefile` acepta `?w=` (1–512) y redimensiona al vuelo
  con sharp (cuadrado, cover) + `Cache-Control` de 24h; de paso se blindó con
  `basename` (path traversal) y responde 404 real en error. En el cliente,
  helper `thumbUrl(url, w)`: burbujas de celda a w=64, MiniAvatar a w=48 y
  avatar del popover a w=96 (2x para retina) — las fotos de alta resolución
  ya no viajan completas para pintarse en 24px. _(Claude Code)_
- **Burbujas de responsables en la celda (`user.list.jsx`):** las celdas cuyo
  documento fue creado/editado/comentado muestran arriba a la derecha las
  fotos de esas personas como burbujas redondas solapadas (máx. 3 + contador
  "+N"), dedupe por persona con prioridad Creado > Editado > Comentó, y
  tooltip al hover con rol y nombre ("Creado por Daniel Flores"). Solo usa
  refs populadas; iniciales cuando no hay foto. _(Claude Code)_
- **Guardia del día (onDuty) por departamento:** el documento `Attendance`
  ganó el booleano `onDuty`. Nuevo POST `/user/attendance/on-duty` (solo
  super): valida que el departamento esté habilitado (Operaciones, Reportes,
  Sistemas y desarrollo) y que **nadie más del mismo departamento** tenga la
  guardia esa fecha (409 con el nombre del titular); audita el cambio en
  `editedBy` ({field:'onDuty', from, to}) y emite el socket. En la grilla:
  botón "Designar guardia del día" / "Quitar guardia" en el menú contextual
  (campana, solo depts habilitados) y **badge azul con campana "GUARDIA"**
  en la esquina superior izquierda de la celda. Ajustes posteriores: la
  exclusividad es por departamento + fecha + **turno** (diurno y nocturno
  pueden tener cada uno su guardia; el turno efectivo se resuelve
  override > regla semanal > global, sin populate — de paso se corrigió
  `ref: 'User'`→`'user'` en `userId` que convertía el 409 en 500); "Designar"
  ahora abre el formulario con **hora de entrada/salida y turno** (guarda el
  override laboral y luego designa); y las celdas reconocen documentos
  solo-guardia (condición `onDuty` en socket/caché/fetch) para que el badge
  pinte también en días futuros. _(Claude Code)_
- **Formulario "Editar grupo" — pre-carga y restricciones
  (`user.group.dynamic.schedule.form.jsx`):** las celdas ahora se pre-cargan
  con los datos ya guardados del día (override desde la caché de asistencia,
  expuesta vía `getCachedAttendance` en `user.list.jsx`) en vez de solo la
  regla semanal. Si la jornada del día ya cerró (entrada Y salida marcadas):
  badge "✓ Jornada marcada", no se puede cambiar a permiso ni descanso
  (opciones deshabilitadas + guard en `updateField`) ni editar las horas
  (inputs bloqueados) — pero sí marcar como extra. Al elegir permiso aparece
  un textarea de comentario obligatorio (borde rojo hasta llenarlo, validado
  al enviar y también por el backend). _(Claude Code)_
- **Permiso y Vacaciones como jornadas asignables (menú contextual + backend):**
  el menú contextual ganó "Asignar permiso" (modal con comentario
  **obligatorio**; el controlador grupal lo valida por item y rechaza permisos
  sin nota) y "Asignar vacaciones" (modal con rango desde→hasta que genera
  automáticamente un documento por día — máx. 62 — con quién las asignó vía
  createdBy/note). En el backend: `status` del Attendance ganó
  'permiso'/'vacaciones' y el endpoint grupal setea el estatus según el tipo;
  los tipos sin horario (descanso/permiso/vacaciones/falta) anulan
  entrada/salida. En la celda: permiso en amarillo, vacaciones en cian, con
  sus etiquetas; cargos nuevos Verificador, Auditor de datos y Supervisor
  sincronizados en modelo, schema yup y frontend (validado en vivo contra el
  API). _(Claude Code)_
- **Grupos colapsables en la grilla (`page.jsx`):** el header de cada bloque
  departamento—turno ganó un botón de flecha (chevron que rota) que oculta
  las filas de operadores dejando solo las filas de resumen (disponibles por
  día por lista/turno/departamento). El estado se persiste en localStorage
  (`userSchedulerCollapsedGroups`). Además: cada bloque va enmarcado con
  borde redondeado (`overflow-clip` para no romper los sticky), el header
  subió a z-20 (ya no queda detrás de los perfiles al scrollear), los
  resúmenes de turno/departamento solo aparecen cuando agregan información
  (más de una lista / más de un turno) y el "Disp" por día va resaltado en
  chip esmeralda. _(Claude Code)_
- **Filas de resumen por segmento alineadas a la grilla
  (`AttendanceSummaryRow` en `user.list.jsx`, usada por `page.jsx`):** al
  cierre de cada subcategoría (incluida la "Lista principal" sin detalle), de
  cada turno y de cada departamento hay una fila-grilla real: la celda sticky
  mide lo mismo que el recuadro foto+nombre (w-48, sin romper la sincronía
  horizontal) con "Total · Hoy laboran" en la tipografía de UserList, y cada
  celda de día (w-24) cuenta para ESA fecha: Disp (les toca laborar), Faltas
  y Tarde, con layout tipo IN/OUT y colores esmeralda/rojo/ámbar. Considera
  el override del día si ya está en la caché de asistencia (y si no, la regla
  semanal); un mini pub/sub con debounce re-renderiza las filas cuando las
  celdas cargan datos o llegan sockets. Excluye `outForkSchedule`. El menú
  contextual además oculta las acciones de jornada (descanso/guardia/extra)
  cuando la jornada del día clickeado ya cerró con hora de salida.
  _(Claude Code)_

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

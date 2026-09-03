# Registro de cambios — Jarvis365 / Amazonas365

Historial legible de cambios del proyecto (propios y realizados con **Claude
Code**). El respaldo real y completo de cada línea vive en el historial de git;
este archivo es el resumen humano del **qué** y el **porqué**.

> **Cómo añadir una entrada:** al terminar un cambio significativo, agrega un
> bloque nuevo **arriba de todo** (más reciente primero) usando la plantilla del
> final. Indica fecha, autor/modelo y un resumen del qué y el porqué.

---

## 2026-09-03 (2)
- **Acabado de los elementos internos de la sala de control en teléfono.**
  (Claude Code, Opus 5 · auditoría con 16 agentes: cinco lectores por zona,
  dos revisores adversariales por hallazgo y una síntesis.) El pase anterior
  arregló la ESTRUCTURA —alturas, rejillas, desplazamiento—; faltaba el
  acabado. El diagnóstico de fondo: cada elemento seguía calibrado para el
  ancho de escritorio y en el teléfono todos competían por los mismos 240-310
  px. Se repetían tres patrones, y son los tres que se atacan:
- **Piezas huérfanas.** Cinco sitios usaban `ml-auto` o `flex-wrap` y, al
  envolverse, dejaban un elemento solo clavado contra un borde: el chevron del
  acordeón de turnos, la chip «● N en línea» de Conectados, el rótulo «EN
  VIVO» y el total de «Se caen más» en DVR, y la leyenda del panorama. Se
  unificó el criterio: donde el contenido entra prohibiendo la envoltura va
  `max-lg:flex-nowrap` y cede el rótulo fijo, no el dato vivo; donde no entra
  ni así, va `max-lg:ml-0` y se envuelve a la izquierda.
- **Texto que no podía partirse.** Ocho avisos y medidas llevaban
  `whitespace-nowrap` heredado del escritorio y se derramaban fuera de su
  celda. Ahora parten debajo de `md`. Y el nombre del establecimiento —que se
  cortaba en seis letras, con dos locales distintos leyéndose los dos como
  «Hum…»— pasa a dos líneas: el chip «🔔 contando» se queda en su icono debajo
  de `lg` y le devuelve ~57 px al nombre.
- **Segundas líneas de 8,5 px que decidían el ancho de un chip.** El desglose
  analítico/perimetral y la nota «no cuentan como sin reportar» se guardan
  debajo de `md`: eran las que dejaban chips de dos alturas contra chips de
  una, y de ahí venía el desnivel del resumen. Los chips «por abrir» y
  «cerraron» se esconden en teléfono SÓLO cuando valen 0, que es la misma
  regla que el archivo ya aplicaba al de «sin conexión».
- **Blancos de toque.** El interruptor de exento, el botón de desplegar la
  fila, las pestañas y el cierre de sesión remoto pasan de ~20 px a 32-36 px
  con `::after`, sin robarle un píxel de ancho a nada.
- **La cinta superior pasa a rejilla de cuatro columnas** en vez de
  `justify-between`: los contadores quedaban desparramados contra los dos
  bordes y el reparto cambiaba solo según hubiera evento o no. El evento y el
  reloj toman renglón propio. Y la tira de pestañas gana un degradado en el
  borde derecho, porque cortada a la mitad sin barra visible parecía rota.
- **Hallazgo aparte, no corregido:** `styles.css:124` tiene `button { border:
  none }` sin capa, y la clase `border` de Tailwind sólo pone `border-width`.
  Resultado: **cualquier botón con `border` sale sin borde, en todos los
  anchos** — hoy le pasa al disparador del selector de establecimiento de la
  pestaña de DVR. Los parches nuevos lo esquivan con `border-solid`. Arreglar
  la raíz cambiaría el escritorio, así que queda a decisión del usuario.
---

## 2026-09-03
- **La sala de control (`/dashboard`) se mira en un teléfono.** (Claude Code,
  Opus 5.) El panel estaba armado como un instrumento de altura fija —una
  pantalla, sin desplazamiento— y en un teléfono esa misma regla dejaba al
  panel central con unos doscientos píxeles mientras el riel de Operaciones se
  quedaba con el resto. **El corte va en `lg`**: de ahí para arriba nada
  cambió, ni un píxel; por debajo el panel deja de tener alto fijo, cada
  sección crece con su contenido y lo que se desplaza es el documento.
- **Las pestañas ya no se pisan con el contenido.** «Horario + alertas»,
  «Gráfica detallada» y «Falla con DVR» no entran de una en pantalla angosta:
  ahora la tira se corre con el dedo (`scroll-x-oculto`, utilidad nueva en
  `styles.css`) en vez de encimarse. Sin barra a la vista: debajo de tres
  botones mide casi tanto como los botones.
- **La fila de cada local se rearma en tres renglones, no en cuatro.** Las
  cuatro columnas de escritorio no entran debajo de `md`, y apilarlas de a una
  daba cuatro renglones por local —en una lista de cincuenta, cuatro pantallas
  de dedo—. Ahora: arriba el nombre con los contadores a la derecha, debajo el
  horario, y al pie la barra a todo el ancho, que es donde mejor compara.
- Además: la cinta de contadores reparte el ancho en vez de amontonarse; la
  gráfica de ApexCharts recorta la etiqueta del local a 96 px por debajo de
  640 px —160 px se comían la mitad del ancho y las barras dejaban de
  compararse—; y el selector de establecimiento de la pestaña de DVR ocupa el
  ancho disponible en vez de desbordar sus 230 px fijos.

---

## 2026-09-03
- **El mapa de bonificación gana una SEGUNDA VISTA: una lista de reglas
  agrupada por categoría, con un conmutador Mapa/Lista.** (Claude Code, Opus 5
  · diseño elegido por unanimidad de tres jueces sobre tres propuestas.) Con 40
  alertas y 5 reglas el mapa dibuja un cable POR ASIGNACIÓN, y las curvas se
  superponen hasta que no se puede seguir ninguna; encima obliga a bajar el
  zoom al 50%, donde ya no se lee nada. La lista no dibuja nunca un elemento
  por asignación: dibuja uno por **relación distinta** y la multiplicidad va
  como número. Las 24 asignaciones que dicen lo mismo colapsan en un renglón de
  alcance —con `claveDeAsignacion`, la misma clave con que el mapa agrupa sus
  cajas del medio, así que las dos vistas colapsan igual—, la fila de la regla
  arranca cerrada diciendo «24 alertas · 3 alcances», y los nombres se piden a
  mano. El peor caso ocupa una fila hasta que alguien pregunte.
- La jerarquía es categoría → **regla** → alcance → alerta. La regla es la fila
  porque es la unidad de plata —lo que el reglamento nombra con su código— y
  porque editarla cambia lo que cobran todas sus alertas: tener el «quiénes» al
  lado del botón «Editar» es el dato que hoy había que ir a buscar. Lo que la
  lista NO contesta bien —«esta alerta, ¿bajo qué reglas paga?»— es la pregunta
  del mapa, y por eso el mapa no se toca ni se degrada.
- Un buscador filtra por regla, por código y por alerta a la vez: escribir el
  nombre de una alerta abre sola la regla que la usa. Es el atajo que reemplaza
  al arrastre.
- **Cero servidor nuevo:** las escrituras del cableado pasan por el mismo
  endpoint de siempre. Se mudaron a `bonusRuleFormat.js` las dos funciones puras
  que definen «la misma asignación», y el editor de alcance salió a
  `EditorDeAlcance.jsx` sin tocarle una línea, para que la lista no tuviera que
  importar el mapa entero por un modal.
- **El mapa se OCULTA, no se desmonta**, al pasar a la lista. Remontarlo vuelve
  a pedir el catálogo y esa tanda tardía cae con la animación encendida: es
  exactamente el bug del 31/08 otra vez, y el guard que lo arregló no lo atrapa
  porque sólo distingue la restauración cuando el lienzo todavía no existe. De
  paso, la medición ahora descarta un rect en ceros en vez de cachearlo.

---

## 2026-09-01
- **El mapa de bonificación pasa de franjas apiladas a un MOSAICO de baldosas,
  una por categoría del catálogo.** (Claude Code, Fable 5 · diseño verificado
  con panel de 11 agentes.) Antes el mapa era una pila de secciones a todo el
  ancho y **las abrían las reglas**: una categoría recién creada no aparecía en
  ningún lado hasta tener su primera regla — justo cuando hacía falta verla,
  porque había que crear la regla a ciegas y descubrir después dónde aterrizaba.
  Ahora **el catálogo abre las baldosas**: cada categoría activa de
  `category.model` tiene su recuadro de 1190px, dos por fila, con su mini-mapa
  completo adentro (alerta → dónde aplica → regla). Una categoría sin reglas
  aparece vacía, con «+ Regla en \<nombre\>» que abre el formulario con esa
  categoría ya elegida (`reglaNueva` acepta la categoría). Se conservan «Sin
  categoría» —que sigue naciendo por demanda— y el banco «Sin asignar», que va
  último en fila propia.
- La baldosa va **con borde y sin relleno**: los cables son un SVG que se pinta
  debajo del mapa, así que un fondo no los atenuaría, los borraría enteros y sin
  ningún error. Tampoco recorta: una caja arrastrada de más tiene que quedar
  sobre el lienzo, no desaparecer.
- **La caja de alerta pierde el chip de categoría operativa del `Menu.model`.**
  Adentro de una baldosa que declara su categoría de bonificación con todas las
  letras, un segundo chip de otra clasificación sobre la misma caja se leía como
  si fueran lo mismo. Los tres rótulos de columna se mudan al encabezado de la
  tarjeta como una leyenda de un renglón.
- El catálogo entra en la compuerta de `listo`: ahora decide cuántas baldosas
  hay, o sea el layout entero, y llegar tarde re-mediría todo a mitad del viaje
  de un segundo — la forma exacta en que se envenenó el cache de bases el
  31/08. Las posiciones de cajas puestas a mano arrancan de cero (clave nueva):
  lo guardado era un desplazamiento contra el hueco natural, y el mosaico le
  movió el hueco a todas.
- **La cascada de corrimientos ya no se sale de la baldosa** (commit aparte, y
  el único cambio de motor): `acomodarColumna` recibe el marco del recuadro y le
  pone piso y techo a cada caja. Una que no llega a pararse frente a su cable se
  queda en el borde y el cable sale en diagonal — preferible a una caja flotando
  dentro de la categoría de al lado.

---

## 2026-08-31
- **Mapa de bonificación: arrancar con un zoom guardado distinto de 100% ya no
  deja los cables apuntando al aire.** (Claude Code, Fable 5.) La restauración
  del zoom guardado (1 → 0.7) se leía como un gesto del usuario y encendía la
  animación durante la pantalla de «Cargando…»: la primera colocación salía
  animada y, si el catálogo de categorías llegaba dentro de ese segundo de
  viaje, se re-medían cajas a mitad de camino y el cache de bases quedaba
  envenenado hasta el próximo toque de zoom. Ahora ese efecto ignora los
  cambios de escala sin lienzo montado (restaurar no es un gesto). Además, el
  efecto de los observadores —ResizeObserver, `resize` y el encendido de
  `animar`— corría una sola vez detrás del «Cargando…», contra un lienzo que
  aún no existía, y quedaba muerto toda la sesión; el montaje del lienzo ahora
  se anota en estado (`lienzoMontado`) y lo vuelve a disparar. Diagnóstico
  verificado con panel de agentes (17), sólo front: `BonusMap.jsx`.

---

## 2026-08-19
- **El interruptor de la alerta pasa a ser un toggle de administrador, y lo
  apagado se muestra en grises en vez de desaparecer.** `Menu.bonifies` decide
  dos cosas con un solo control: si la alerta bonifica y si está en el mapa.
  Encendida va en color; apagada **sigue en el mapa**, en grises, con todo su
  cableado intacto — hacerla desaparecer escondería trabajo ya hecho y dejaría
  sin forma de volver a encenderla desde el mapa. Apagar no borra nada.
- Traer una alerta con «+ Alerta» la enciende, así sigue ahí al recargar en vez
  de depender de que alguien se acuerde de prender el interruptor. Encendida y
  sin asignaciones no paga nada: la resolución corta en `sin-regla`.
- Cablear ya **no** toca el interruptor. Antes cada gesto mandaba
  `bonifies: true`, así que tocar el cableado de una alerta apagada la volvía a
  encender sola.
- El lienzo del mapa pasa a fondo punteado cada 5px, y «Configuración de
  referencias» toma el 100% del ancho: acotado a 1100px el mapa quedaba con
  scroll lateral propio.

---

## 2026-08-18
- **El mapa de bonificación pasa a mostrar varias alertas a la vez, y la alerta
  gana un interruptor propio (con api_jarvis365).** El mapa mostraba una sola
  alerta: elegir otra reemplazaba el lienzo entero, así que traer una alerta
  nueva hacía desaparecer el resto del mapa. Ahora cada alerta es una fila
  independiente —su caja, sus alcances y los cables hacia la columna compartida
  de reglas—, se suman con «+ Alerta» y se sacan sin tocar su configuración: lo
  que está en el lienzo es estado de pantalla, no de datos.
- La escritura de asignaciones es **optimista**: se pinta antes de que responda
  el servidor y se revierte si falla. Armar una alerta son varios gestos
  seguidos —marcarla, elegir dónde, elegir la regla— y esperar la respuesta en
  cada uno hacía parpadear el mapa.
- **`Menu.bonifies`**, booleano de tres estados como `Noveltie.bonus.applies`:
  `true` bonifica, `false` es una decisión tomada y corta antes de mirar
  reglas, `null` es el default y no bloquea. Ese `null` es lo que permite
  agregar el campo sin migrar nada: un `false` por defecto habría dejado de
  pagar en silencio a todas las alertas ya configuradas. Sin el interruptor,
  una alerta a medio armar (`bonusRules: []`) se veía igual que una descartada.

---

## 2026-08-16
- **Se rehace el sistema de bonificación: el dinero pasa a ser global y lo que
  varía por alerta es la cantidad de bonos (con api_jarvis365).** El sistema
  anterior guardaba el precio en cada alerta, dentro de `Menu.bonusSystem`.
  Cambiar cuánto vale un bono —que el reglamento fija una sola vez— obligaba a
  editar decenas de documentos, y el valor de una alerta no podía distinguir
  turno diurno de nocturno, que es justo lo que el reglamento sí distingue.

  El modelo nuevo separa las dos cosas que estaban mezcladas:

  - **El dinero es global.** `BonusSettings` guarda cuánto vale un bono en
    dólares y la tasa del BCV, con historial de quién las cambió. Son dos
    números para todo el sistema.
  - **La cantidad la decide una regla.** `BonusRule` dice cuántas alertas hacen
    falta y cuántos bonos otorgan, con valores separados para diurno y
    nocturno. Vive en su propio documento porque el reglamento repite las
    mismas condiciones en decenas de alertas: se define una vez y muchas la
    comparten, así que corregirla las corrige a todas. Lleva alcance por marca
    o establecimiento (`all` / `only` / `except`) y excepciones puntuales,
    donde la del local le gana a la de su franquicia.
  - **Las alertas suman y el resto no se pierde.** Una regla de 4 alertas por
    bono deja 0,25 en cada una; seis alertas son 1,5 bonos, no 1.
  - **Lo aprobado se congela.** `Noveltie.bonus` guarda cuánto bonificó la
    novedad y cuánto valía el bono en ese momento. Corregir una regla rige de
    ahí en adelante y nunca recalcula lo ya pagado. La tasa **no** se congela:
    se aplica al liquidar, y toda la liquidación va al mismo cambio.
  - `resolveBonusForNovelty()` resuelve todo eso y es **pura**: no consulta la
    base ni mira el reloj. El turno sale de la misma cascada que ya usa
    `dayRoster.service.js`, y es el del **operador** que reportó, no el de la
    novedad — el bono es suyo.

- **`/user/bonos` pasa a ser el panel de administración del sistema.** Dos
  pestañas, separadas por lo que se hace en cada una y no por el tema:

  - **Configuración de referencias** — los valores globales, las reglas y qué
    alerta usa cuál. El valor del bono y la tasa se unificaron en una sola
    pieza que se lee como la ecuación que son, con el resultado en bolívares
    calculado sobre lo que se está escribiendo: separadas, esa cuenta la tenía
    que hacer de memoria el que mira la pantalla. Las reglas y las alertas van
    lado a lado porque el trabajo es ir y venir entre ellas.
  - **Panel informativo** — qué hay cargado, de dónde sale el monto (con la
    cuenta hecha con los valores de hoy y una regla real) y qué falta. No edita
    nada y no consulta nada propio.

- **La bonificación sale de `/alertmanasgement`.** El formulario de alertas ya
  no la administra: se retiró `BonoSection`, el resumen de la lista y el
  informe. Ahora la asignación vive en `/user/bonos`, junto al resto del
  sistema.

  _Autor: Claude Code (Opus 5)._

---

## 2026-08-15
- **Las categorías de alerta vuelven a ser una lista fija, y la administrable
  pasa a ser la de bonificación (con api_jarvis365).** Se revierte lo del
  13/08. Hacer administrable `Menu.category` rompía la compatibilidad con dos
  sistemas que la leen con nombres escritos a mano y se despliegan por
  separado: **reportes365** agrupa por esa cadena las páginas del reporte —y
  trata `delay` de forma especial según el nombre de la alerta—, y
  **Jarvis-express365** la tiene hardcodeada en sus JSON. Una categoría creada
  desde la pantalla era una que ninguno de los dos entendía, y el síntoma no
  era un error: la alerta simplemente no aparecía donde correspondía.

  - La lista fija vive en `libs/alerts/categories.js`, fuera de la pantalla,
    porque la usan `/alertmanasgement` y `/dashboard`.
  - `Menu` suma `bonusCategory`, **opcional**: las alertas que ya existen
    quedan sin ella y siguen funcionando, sin migración.
  - Toda la maquinaria de administrar categorías (el botón, el gestor, el
    formulario y su CRUD) se mudó entera al catálogo de bonificación, que se
    calcula puertas adentro y no lo lee ningún sistema externo.
  - El formulario de la alerta ahora tiene **los dos selectores**: son
    independientes, dos alertas de categorías operativas distintas pueden
    bonificar por el mismo concepto.

- **Dos filtros por categoría en `/dashboard`.** Uno por categoría operativa y
  otro por categoría de bonificación, combinables.

  - El filtrado ocurre en el **servidor**: el endpoint devuelve totales ya
    agregados por local, no la lista de novedades, así que no hay nada que
    recontar en el cliente.
  - Las categorías no viven en la novedad sino en su alerta (`Menu`), así que
    el servicio primero resuelve qué alertas entran y después filtra por
    `menuRef`. En dos pasos y no con un `$lookup`: el catálogo de alertas es
    chico y estable, y una consulta que devuelve ids sale mucho más barata que
    cruzar todas las novedades del día.
  - Los filtros son **opcionales**: sin ellos el reporte es el de siempre, que
    es el que usan el job de WhatsApp y el PDF.
  - Con un filtro activo aparece un botón **"Filtrado ✕"**. Los filtros afectan
    a todo el conteo —la cinta de contadores, la gráfica y el panorama beben
    del mismo `dayCounts`—, así que sin ese aviso la pantalla mostraría
    totales parciales como si fueran los del día completo.

- **El sello de bonificación se congela al validar, no al crear (con
  api_jarvis365).** El sellado estaba escrito en el POST de novedades pero
  comentado, y arrastraba dos consultas a la base —el menú y el
  establecimiento— cuyo único consumidor eran esas líneas muertas. Se movió a
  `updateNovelties`: la regla vigente se copia dentro de la novedad cuando un
  validador la aprueba, que es cuando recién se sabe que va a contar.

  - **Hacen falta las dos cosas: aprobada y con turno.** El turno viaja en su
    *propio* PUT (los botones "Turno día"/"Turno noche"), separado del de
    validar, y pueden llegar en cualquier orden. Como el turno define el valor
    del punto, sellar apenas se aprueba —con el turno todavía en `null`—
    congelaba el valor diurno para siempre aunque después se marcara noche. Se
    mira el estado que queda *después* del update y sella la acción que
    completa el par.
  - **Sellar no es pagar.** El corte exige aprobación además del sello
    (`countsForBonus`), así que una novedad invalidada más tarde deja de contar
    sola. Sin eso, sellar al validar habría dejado bonos fantasma.
  - **`shift` no se tocó.** Sigue siendo la propiedad de siempre; jarvis-reportes
    depende de ella. El sello guarda su propio `workShift` derivado, no la
    reemplaza.
  - Si el sello falla, la validación sigue su curso: validar es la operación
    importante, el bono es secundario.

- **Los botones de una novedad se habilitan en cadena.** Aprobar/Rechazar está
  siempre disponible; el turno solo si quedó aprobada; descargar/enviar solo si
  además tiene turno. Rechazar corta la cadena: una novedad invalidada no lleva
  turno ni se manda al grupo.

  - `canShare` comparaba `shift !== null`, y una novedad anterior a ese campo lo
    tiene en `undefined` —que pasa ese chequeo—, así que se podía enviar al grupo
    sin turno y la alerta quedaba sin sellar. Ahora se compara contra `'day'` y
    `'night'`.
  - "Turno día" tenía la condición invertida (`isReadOnly && !isValidated`): un
    usuario sin permiso podía marcar el turno en cuanto la novedad estuviera
    aprobada.
  - Los dos botones de descarga no tenían `disabled` en absoluto.
  - Los tooltips dicen *por qué* está bloqueado en vez de dejar un botón muerto.

- **El valor del bono se ve en la novedad.** Un cuarto chip en la fila de
  trazabilidad, al lado de "Enviado a amazonas365": estrella de contorno dorado
  sin fondo —el bono es un dato de valor, no un actor del circuito, y no compite
  con los avatares— y el multiplicador. Si hay acumulación se muestra la
  proporción del reglamento ("3x1"); en 1x1 no, que es el caso normal.

  - El dato llega solo: la API lo devuelve en el documento del socket
    `document_updated`.
  - La fila se reorganizó: antes era un flex sin separación donde cada chip
    compensaba con su propio padding asimétrico. Ahora el `gap` lo pone la fila,
    el respiro lateral vive una sola vez en `.novelty-chip-text`, y el reparto
    pasó de `flex: 1 1 0` a `1 1 160px` para que con cuatro chips bajen de línea
    en vez de apretarse.

## 2026-08-13
- **Categorías de alerta administrables (con api_jarvis365).** Hasta ahora las
  doce categorías con las que se agrupan las alertas estaban escritas dentro del
  cliente —y por duplicado, en `model/category.js` y `assets/category.json`—, así
  que agregar una obligaba a tocar código y volver a publicar. Ahora viven en la
  base y se crean, editan y desactivan desde `/alertmanasgement`, con el botón
  **Categorías** al lado de "Nueva alerta".

  - **La clave no se puede cambiar.** `Menu.category` guarda la cadena
    (`'client'`, `'localIncident'`), no una referencia; se dejó así a propósito
    para no migrar las alertas ya creadas. La consecuencia es que el `value` es
    inmutable: cambiarlo dejaría a todas sus alertas apuntando a una clave que
    no existe y desaparecerían de la lista sin dar ningún error. El nombre que se
    lee (`es` / `en`) sí se edita.
  - **Borrar vs. desactivar.** Una categoría que alguna alerta usa no se borra:
    el servidor responde 409 diciendo cuántas son. Para eso está desactivarla —
    deja de ofrecerse al crear alertas nuevas y las que ya la tienen no cambian.
  - **Se sigue viendo bien mientras la API no esté al día.** El endpoint se
    despliega a mano, así que hay una ventana real en la que responde 404, y otra
    en la que responde vacío porque falta la siembra. En las dos, la pantalla
    trabaja con las categorías de siempre y lo dice; no se queda gris ni se
    pierden íconos.
  - **Corregido de paso:** el selector de categoría bajaba el valor a minúsculas,
    y eso dejaba sin seleccionar a las que llevan mayúscula dentro
    (`localIncident`).

  En la API: modelo `MenuCategory` dentro del recurso `menu`, cuatro endpoints
  bajo `/menu/categories` y el script `sembrar-categorias.js`, que además crea
  —desactivadas— las categorías que alguna alerta usa pero que nunca se
  declararon, para que esas alertas recuperen su nombre.

## 2026-08-10
- **Solicitudes de horario reforzadas de punta a punta (con api_jarvis365):**
  - **Autoría real.** El autor del cambio sale de la sesión y no del cuerpo de
    la petición: la auditoría del documento de asistencia decía lo que el front
    declarara, así que un `adminUserId` equivocado firmaba con otro nombre.
  - **Alcance del lote.** La solicitud registra a TODOS los empleados que toca,
    no solo al primero. Antes un administrador leía "cambio para Ana" y al
    aprobar movía la jornada de cinco personas.
  - **Quién pidió y quién aprobó.** El empleado leía "Kervis modificó tu
    horario" cuando Kervis solo autorizó lo que pidió otro; ahora el aviso
    nombra a los dos.
  - **Conflictos.** Una segunda solicitud sobre la misma celda se rechaza con
    409 diciendo quién tiene la primera. Y al aprobar, si el horario cambió
    desde que se pidió, se corta y se muestra qué cambió en vez de pisarlo en
    silencio (`force: true` lo aplica igual, como decisión explícita).
  - **Retiro.** Quien solicitó puede retirar lo suyo (`/notifications/:id/withdraw`),
    estado nuevo `withdrawn` — distinto de `rejected`, que es un administrador
    negando un cambio ajeno.
  - **Aceptar/cancelar en la celda**, con socket en vivo. Las pendientes llegan
    indexadas por celda (`userId|YYYY-MM-DD`) en una sola petición: preguntar
    celda por celda serían más de dos mil para dibujar un mes. El evento
    `schedule:request` pinta y libera las celdas sin recargar. _(Claude Code)_

- **Los cambios de horario ahora sí le llegan al administrador (api_jarvis365):**
  `schedule.changed` estaba dirigida **solo al empleado afectado**, así que el
  administrador que hacía el cambio no la recibía nunca — ni por socket ni al
  abrir la bandeja, porque la consulta filtra por destinatario. No era un fallo
  del socket: la notificación se creaba bien, para alguien que no estaba
  mirando.

  Se resuelve con dos avisos, uno por audiencia: al empleado "tu horario
  cambió" y a los demás administradores "X modificó el horario de Y". Son dos
  documentos porque el texto se guarda ya renderizado y no puede decir "tu
  horario" y "el horario de Ana" a la vez. El administrador que hizo el cambio
  queda fuera de la lista: contarle lo que acaba de hacer es ruido. _(Claude Code)_

- **La campana distingue "visto" de "leído" (Client365 y Jarvis-express365):**
  al llegar algo nuevo la campana avisa —repique, halo y color de aviso— y se
  calma al **abrir la bandeja**, sin marcar nada como leído: el número de
  pendientes sigue ahí y solo baja al abrir, clicar o decidir una notificación.
  El contador se queda pero en gris, informando sin tirar del ojo.

  Se resuelve en el cliente con `localStorage`, guardando **el contador de
  pendientes en el momento de mirar** en vez de una marca de tiempo: así no hace
  falta cargar la lista para saber si hay novedad, alcanza con el contador que
  la campana ya pide. La clave lleva el id del usuario porque en las estaciones
  de monitoreo se turnan varias personas en la misma máquina. _(Claude Code)_

- **Notificación privada del marcaje (con api_jarvis365 y Jarvis-express365):**
  al fichar en la máquina, quien marca recibe una notificación **solo para él**
  con el resultado de su asistencia: hora de entrada y de salida, si llegó
  puntual o con retardo (y de cuántos minutos), las unidades de descuento que
  genera, si el día cuenta como extra, cuánto trabajó y sus horas extras. Trae
  las **dos fotos** del fichaje como comprobante, la fecha de la jornada y la
  fecha del aviso.

  Es privada de verdad: la estrategia del backend la declara `personal` con
  audiencia de una sola persona, viaja por la sala de socket de ese usuario y la
  consulta filtra por destinatario en el servidor. Un administrador no ve los
  retardos de los demás por la campana.

  En el cliente se implementó como **familia visual propia** (`attendance`,
  reloj de fondo y acento teal) con un slot `detail` nuevo en el registro de
  vistas: el ítem de la bandeja sigue sin conocer ninguna familia, le pide su
  detalle a la vista y lo pinta. Vale para los dos frontends. _(Claude Code)_

## 2026-08-03
- **Reportes de asistencia al día con el modelo (con api_jarvis365):** el
  reporte individual de /user/asistencia suma columnas Turno, Desc. (unidades
  a descontar del día) y Rol (badge Guardia/Auxiliar con los colores de la
  grilla), más card y total de "Unid. descuento" — en pantalla y en el PDF.
  El global calcula por empleado (dentro de la agregación de Mongo) descuentos
  acumulados, permisos, vacaciones, días de guardia/auxiliar y turno, con sus
  columnas, card y total; en el PDF apaisado guardias y auxiliar comparten
  columna ("3 / 1"). Compatible hacia atrás: documentos sin `discountUnits`
  muestran 0. _(Claude Code)_
- **Roles de guardia por día operativo (con api_jarvis365):** el rol del día
  (encargado de turno / auxiliar) ya no muere a la medianoche — el backend
  resuelve "hoy" con el día operativo (08:00 → 07:59:59 del día siguiente),
  el mismo criterio del middleware de noveltie, así que la guardia nocturna
  conserva sus botones toda la jornada. `/user/day-role/today` ahora devuelve
  también turno y horas efectivas; el slice `dayRole` las guarda y el AppDock
  muestra la ventana del rol bajo el chip (ej. "18:00 → 07:00") y en el
  tooltip del badge. _(Claude Code)_

## 2026-08-02
- **Reglas de validación en /user:** (1) el botón "Cambiar horario del mes
  siguiente" del context menu exige que el usuario tenga cargo, departamento y
  horario por defecto definidos ('Sin definir' cuenta como faltante) — si algo
  falta, modal de error global (`setConfigModal`) listando exactamente qué
  establecer, sin abrir el formulario. (2) En "Editar usuario": la cédula es
  obligatoria (no se puede guardar vacía ni vaciar una existente) y la foto es
  obligatoria cuando el documento no tiene `img` — el FileInput se registra
  como campo virtual de react-hook-form, con estilo failure y HelperText igual
  que el resto de los campos; subir la foto limpia el error. Primeras
  validaciones reales del form (no había resolver activo). _(Claude Code)_
- **Unidades de descuento visibles para RRHH (horario /user):** el
  `DetailPopover` de la grilla muestra un chip "−N unidades" junto al estado y
  la duración cuando el documento del día trae la nueva propiedad
  `discountUnits` de Attendance (se calcula en api_jarvis365 al marcar la
  entrada con retardo: 1 unidad por bloque de 20 min pasada la tolerancia de
  8). Visible **solo** si el usuario de la sesión tiene departamento "Recursos
  Humanos" (`dataSession.jobInformation.department`); para el resto el popover
  no cambia. Documentos sin la propiedad o con 0 unidades no muestran nada.
  _(Claude Code)_

## 2026-07-26
- **Muro de novedades (Lobby) tipo chat + video:** PublicationsBox absorbió la
  lógica de Publications (que se eliminó). El muro va de abajo hacia arriba, las
  alertas nuevas del socket entran por el fondo empujando las demás (animación),
  el scroll queda al fondo por defecto y **pagina al subir** (scroll infinito
  con spinner "Cargando más alertas"), con contador en vivo de alertas en el
  header y pestañas por estado (Todo/Validadas/Invalidadas/Ignoradas, esta
  filtrando por `/novelties/paginate?state=`). Scroll a medida (riel gris, barra
  verde, sin flechas) con rebote de borde. El reproductor de video se rehízo:
  el video es el slide principal, con autoplay en loop al estar a la vista y
  controles propios (sonido, progreso). Se retiró del Lobby el Nav y el
  AsideInfoUser (Consulta de alertas + Conectados). _(Claude Code)_
- **Rol del día en acciones y navegación:** nuevo `dayRoleContext` global (lee
  el roster del horario) — los botones de validar/enviar de Noveltie aparecen
  para admins o para el encargado/auxiliar del día, y el AppDock resalta el rol
  sobre el avatar. Chips de Noveltie (operador/coordinador/envío) a ancho igual,
  sin border-radius ni sombra. _(Claude Code)_
- **Panel analítico:** turnos de "Vienen hoy" como acordeones con resumen, chips
  y números en estilo contorno, sección "Conectados · App Manager" con provider
  global de presencia, reloj con segundos, y título "Sala de control" con
  emblema. _(Claude Code)_
- **Navegación y sesión:** el login aterriza en `/dashboard`; cierre de sesión
  con recarga completa a `/` (arreglo del loader pegado); años de experiencia de
  la portada calculados solos desde 2017. _(Claude Code)_

## 2026-07-25
- **Auxiliar del día en el horario (/user, con api_jarvis365):** nuevo rol
  espejo del encargado de turno. Campo `auxiliary` en Attendance y endpoint
  `POST /user/attendance/auxiliary` (fábrica compartida con on-duty: misma
  exclusividad por departamento + fecha + turno, auditoría y socket). Click
  derecho → "Designar auxiliar" abre el mismo formulario de horario + turno
  (fija el día laboral y luego designa); la celda muestra campanita roja
  "Auxiliar" apilada bajo la azul "Turno", con leyenda en el aside. El popover
  de la celda ahora también abre con solo roles del día. _(Claude Code)_
- **Reporte de silencio sin falsos positivos (api_jarvis365):** un local solo
  se evalúa si lleva UNA HORA COMPLETA en ventana (el que abre a las 13:00 ya
  no sale en el corte de las 13:00: solo se le siembra el baseline); y solo
  entra quien declara `type: 'analytical'` explícito en su rango (los rangos
  legados sin tipo, p. ej. Centro de producción, quedan fuera). _(Claude Code)_
- **Aviso de silencio en vivo (AlertInputLive + api):** cuando una novedad del
  local señalado queda validada + enviada al grupo, el api apaga el flag
  durable y emite `monitoring-silence-clear`; el panel quita el parpadeo rojo
  AL INSTANTE, sin esperar el corte de la próxima hora. Además el job hace
  espejo exacto de flags tras cada corte (limpia los de locales que salieron
  de ventana o de la evaluación) y con nadie en ventana limpia todo. _(Claude Code)_
- **"Cambiar horario del mes siguiente" (/user):** nueva opción del menú
  contextual del perfil del operador (solo admin). Formulario Lunes→Domingo
  prellenado con el horario semanal por defecto; cada día configurado se aplica
  a TODOS esos días del MES SIGUIENTE como overrides por fecha (endpoint de
  grupo existente), sin tocar la regla semanal ni el mes en curso. "Permiso"
  exige nota, queda auditoría completa y la grilla se refresca por los sockets
  por fecha ya existentes. _(Claude Code)_
- **Armonía de botones en /user + guardas de hover:** submit/cancelar de los 6
  formularios, header ("Hoy", "Editar grupo") y aside "Panel de Empleados"
  hablan ahora el vocabulario del design system: `btn-primary` (verde de marca
  #29c50c) y el nuevo `btn-neutral` (blanco con borde gris, el secundario de
  paneles internos) en styles.css. El ítem activo del aside pasó de emerald-600
  al verde de marca. Guardas `a.btn-*:hover`: la regla global
  `a:hover { color: var(--app-accent) }` pisaba el texto de los enlaces-botón
  en hover (texto violeta sobre fondo verde); cada tipo conserva ahora el color
  que concuerda con su fondo. _(Claude Code)_
- **Permisos super/admin en el horario (con api_jarvis365):** comentar exige
  `super`; modificar (editar usuario, falta/extra, guardias, horarios
  dinámicos) exige `admin`, en el front (menús contextuales) y en el backend
  (nuevo middleware `validateAdminUser`; `POST /user/schedule/dynamic/group`
  estaba sin proteger). _(Claude Code)_
- **AlertInputLive (Lobby) en vivo + envío sin duplicados:** el panel "Reporte
  de alertas" dejó de ser esqueleto: muestra solo locales activos agrupados por
  franquicia con los conteos del día operativo por local (total, ✓ aprobadas,
  ◌ ignoradas, ➤ enviadas) desde `GET /noveltyReport/today`, números estilo
  **odómetro** (dígitos que ruedan), columnas de ancho fijo con encabezados
  alineados, barra sticky de totales con el último inicio/fin de monitoreo,
  punto verde pulsante por local en ventana (sembrado de `/monitoring/status` +
  eventos `monitoring-start/end`), y **parpadeo rojo** con el aviso "Local sin
  actualización de alerta en el grupo" para los señalados por el corte de
  silencio (`monitoring-silence`). Los eventos que refrescan el contador abren
  el aside (`openAside`). Se quitaron los botones muertos "Generar…". En
  `Noveltie`, el compartir por WhatsApp deduplica destinos (establecimiento vs
  grupo por defecto), bloquea `groupId` vacío y muestra el éxito solo tras
  completar todos los envíos. Requiere el backend con los endpoints nuevos.
  _(Claude Code)_

## 2026-07-24
- **Anuncio por voz del monitoreo en tiempo real (watcher + sockets):** el
  nuevo watcher de api_jarvis365 emite `monitoring-start` / `monitoring-end`
  por establecimiento y POR TIPO (analítico/perimetral), respetando corridos y
  el horario de invierno USA, con estado durable en Mongo (los reinicios no
  pierden transiciones). Client365 lo recibe por el socket existente y lo
  anuncia con `useSpeckAlert` + notificación del navegador: "Inicio de
  Monitoreo analítico en <local>" (ídem fin). `AlertLiveJarvis` se movió del
  Lobby al layout raíz, así que TODAS las alertas de voz suenan ahora en toda
  la app, no solo en /Lobby. _(Claude Code)_
- **Horario de monitoreo — edición de rangos, copia de días arrastrando, clonado
  con invierno y pulido:** ahora un rango existente se **edita** con clic sobre
  su tarjeta (formulario precargado; guardar reemplaza por `key`). Nuevo hook
  reutilizable **`useDragCopy`** (`src/hook/`): arrastrar la cabecera de un día
  configurado y soltarla sobre otro copia su horario, previa confirmación con el
  modal global (avisa si el destino tiene rangos: se reemplazan); respeta la
  pestaña Normal/Invierno y el gate de admin. **Clonar horario** de otro
  establecimiento ahora incluye el **horario de invierno** cuando el origen lo
  tiene habilitado (y enciende `usesUsTimezone` en el destino); el select de
  establecimientos sale en orden alfabético (es, sin distinguir acentos). Los
  establecimientos con `isActive: false` muestran su segmento y modal de horario
  **en gris** con tag "Inactivo" (solo visual, se puede seguir editando).
  _(Claude Code)_

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

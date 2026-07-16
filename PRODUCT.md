# Product

## Register

product

## Users

Dueños, gerentes y personal de RRHH de restaurantes, franquicias y retail.
Usan la plataforma a diario desde escritorio (oficina) y móvil (WebView
Cordova `net.jarvis365.app`) para supervisar establecimientos en remoto:
vigilar operaciones, gestionar usuarios y managers, revisar cortes de caja,
horarios y asistencia, y recibir alertas en tiempo real.

## Product Purpose

**Jarvis365** (marca pública **Amazonas365**) es una plataforma de
supervisión y gerencia remota empresarial. El éxito se mide en que un
gerente pueda resolver su flujo (consultar, editar, reportar) rápido y sin
errores, con datos en tiempo real confiables.

## Brand Personality

Sobrio, corporativo y confiable. Los paneles internos (rutas `/user`,
`Corte365`, `clients&manasgement`) siguen el look ya establecido: fondo
`gray-50`, cards blancas `rounded-xl` con borde y `shadow-sm`, acentos
esmeralda (`emerald-600`) y el gradiente verde de marca
(`#29c50c → #4e8300 → #6b7f47`) para acciones primarias. La portada pública
usa la paleta cálida de marca (marfil + verde + oro/cobre) documentada en
`design-system/DESIGN-SYSTEM.md`; esa estética NO se traslada a los paneles.

## Anti-references

- No dashboards oscuros ni glassmorphism: los paneles son claros y planos.
- No trasladar el marfil/oro de la portada a las herramientas internas.
- Nada de decoración que compita con los datos (la grilla de horarios es
  densa; el chrome debe ser silencioso).

## Design Principles

1. **El dato manda.** El chrome (nav, headers, controles) es silencioso;
   el contenido (grillas, tablas, celdas de asistencia) lleva el color.
2. **Consistencia entre paneles.** Un control nuevo debe parecer hermano de
   los existentes (misma card blanca, mismos labels uppercase pequeños,
   mismo acento esmeralda).
3. **Feedback honesto.** Toda acción muestra su resultado real (éxito o
   error); nunca éxito falso.
4. **Idioma español** en UI, código y commits.

## Accessibility & Inclusion

Sin requisitos formales. Como práctica: contraste legible en texto de
datos, foco visible en controles interactivos y targets táctiles razonables
(la app corre también en móvil vía Cordova).
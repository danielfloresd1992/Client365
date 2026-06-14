# Jarvis365 · Design System

Framework de componentes reutilizables construido con **Tailwind** (`@layer components` + `@apply`), definido en [`src/style/styles.css`](../src/style/styles.css) y **derivado del look de la presentación principal** ([`src/app/page.tsx`](../src/app/page.tsx)) y del loader ([`Loader3D`](../src/components/loandingComponent/Loader3D.tsx)).

> El framework **reproduce** la estética de esos componentes de referencia (marfil + verde `#29c50c` + oro/bronce + blancos). No se editan los archivos de referencia: ellos son la fuente de verdad.

> **Exportar a PDF:** extensión *Markdown PDF* de VSCode (clic derecho → *Markdown PDF: Export (pdf)*), o abre [`style-guide.html`](./style-guide.html) y pulsa **Ctrl/Cmd + P → Guardar como PDF**.

---

## Filosofía

1. **Una clase, un componente.** En vez de copiar 10 utilidades en cada botón, usas `btn-primary`.
2. **Las utilidades sueltas siguen mandando.** Las clases viven en la capa `components`, así que `className="btn-primary mt-4 w-full"` funciona: `mt-4` y `w-full` ganan.
3. **Cero bloat.** Las clases solo se compilan al bundle cuando se usan en el JSX (purga de Tailwind).
4. **Derivado de lo existente.** Cada clase reproduce un patrón real de la portada/loader.

```jsx
<button className="btn-primary">Contactar</button>
<span className="eyebrow-green">Panel analítico</span>
<div className="card-glass"> ... </div>
```

---

## Tokens de marca

Variables CSS (`var(--brand-green)`) y valores arbitrarios (`bg-[#29c50c]`).

| Token | Hex | Uso |
|-------|-----|-----|
| `--brand-green` | `#29c50c` | Color primario |
| `--brand-green-hover` | `#1f9a08` | Hover del primario |
| `--brand-green-soft` | `#5cc41f` | Degradados de ícono |
| `--brand-green-deep` | `#2e8b3e` | Texto verde sobre claro |
| `--brand-ivory` | `#f7f2e4` | Fondo base |
| `--brand-panel` | `#faf5ea` | Cards / superficies |
| `--brand-card` | `#fbf6ea` | Cards de servicio |
| `--brand-warm-1/2` | `#f8f3e6` / `#f4edda` | Degradado de stat |
| `--brand-sand` | `#f2ead8` | Eyebrows / chips suaves |
| `--brand-gold` | `#d9a441` | Acento dorado |
| `--brand-copper` | `#b5763b` | Acento cobre/bronce |
| `--brand-border` | `#d4dec8` | Borde de cards |
| `--brand-line` | `#e6dcc6` | Divisores |

---

## Acento y Eyebrows

| Clase | Descripción |
|-------|-------------|
| `accent-strip` | Franja `verde → oro → cobre` (la barra superior de las cards de la portada) |
| `eyebrow` | Píldora-etiqueta uppercase (verde sobre marfil translúcido) |
| `eyebrow-sand` | Variante sobre fondo arena `#f2ead8` |
| `eyebrow-green` | Variante verde sólida (como "Panel analítico") |

```jsx
<span className="eyebrow-green">Panel analítico</span>
<div className="accent-strip" />
```

---

## Botones

Base `.btn` (`rounded-xl px-6 py-3`, igual que los CTA de la portada) + variantes. Cubre los ~134 botones del proyecto.

| Clase | Descripción |
|-------|-------------|
| `btn-primary` | Verde de marca, sombra dorada al hover, se eleva (CTA principal) |
| `btn-secondary` | Marfil translúcido con borde (botón "Iniciar sesión") |
| `btn-outline` | Contorno verde |
| `btn-ghost` | Sin fondo, hover gris |
| `btn-danger` | Rojo destructivo |
| `btn-icon` | Botón cuadrado de solo ícono |
| `btn-sm` / `btn-lg` | Tamaños |
| `btn-block` / `btn-pill` | Ancho completo / totalmente redondeado |
| `icon-badge` / `icon-badge-sm` | Cuadro con degradado verde (íconos de "Servicios") |

```jsx
<button className="btn-primary">Contactar por WhatsApp</button>
<button className="btn-secondary">Iniciar sesión</button>
<button className="btn-primary btn-block btn-lg">Continuar</button>
<span className="icon-badge">★</span>
```

---

## Tags / Chips

| Clase | Descripción |
|-------|-------------|
| `tag-green / amber / blue / red / gray / gold` | Etiquetas pequeñas de estado |
| `chip-drag` | Chip arrastrable (`cursor-grab`), patrón de `manager.jsx` |
| `dot-green / amber / red / gray` | Puntos de estado (semáforo) |

```jsx
<span className="tag-green">Activo</span>
<span className="chip-drag">⠿ Sede Norte</span>
<span className="dot-green" /> Operativo
```

---

## Inputs / Formularios

| Clase | Descripción |
|-------|-------------|
| `input` | Campo base, foco verde de marca |
| `input-error` | Estado de error (borde rojo) |
| `label` · `form-field` · `form-hint` · `form-error` | Etiqueta, contenedor, ayuda, error |

```jsx
<div className="form-field">
  <label className="label">Correo</label>
  <input className="input" placeholder="usuario@empresa.com" />
  <span className="form-hint">Usa tu correo corporativo.</span>
</div>
```

---

## Cards (las 4 superficies de la presentación)

| Clase | Descripción |
|-------|-------------|
| `card` | Panel marfil sólido con borde de marca |
| `card-glass` | Translúcido + blur + sombra verde (el panel del hero) |
| `card-soft` | Card de servicio, fondo más claro |
| `card-stat` | Mini-card de estadística (degradado cálido) |
| `card-hover` | Modificador: se eleva y resalta borde verde al hover |
| `card-header` · `card-title` | Cabecera y título |
| `badge-green / gold / gray` | Badges sólidos de estado |
| `divider` / `divider-soft` | Divisores (gris / marfil) |

```jsx
<div className="card-glass card-hover">
  <div className="accent-strip" />
  <div className="card-header">
    <span className="card-title">Reporte mensual</span>
    <span className="badge-green">Activo</span>
  </div>
  <p>Contenido…</p>
</div>
```

---

## Cómo extender el framework

Edita el bloque `@layer components` en [`src/style/styles.css`](../src/style/styles.css):

```css
@layer components {
  .btn-warning {
    @apply btn bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500;
  }
}
```

Luego refleja el cambio en [`style-guide.html`](./style-guide.html) (tiene las mismas definiciones para ser portable).

### Reglas de oro
- El framework se **deriva** de `page.tsx` y `Loader3D`; esos archivos NO se editan para encajar con el framework.
- **No** uses `@apply` con clases que no existan en Tailwind (rompe el build).
- Una variante siempre **compone la base**: `.btn-x { @apply btn ...; }`.
- Mantén los valores de marca como tokens, no los hardcodees repetidos.
- Si una clase necesita lógica (estados, props), pásala a un componente React que use estas clases.

---

*Generado a partir de `src/app/page.tsx` + `Loader3D`, codificado en `src/style/styles.css`. Componentes: acento/eyebrows, botones, tags/chips, inputs, cards/badges.*

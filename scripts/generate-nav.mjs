// ─────────────────────────────────────────────────────────────────────────────
// Generador del menú de navegación DESDE EL FILE-SYSTEM.
//
// En el App Router de Next el file-system es el router, pero SOLO en build: un
// client component no puede escanear el disco en runtime. Por eso el menú se
// genera aquí (Node, en build) y AppDock consume el resultado ya listo.
//
// Convención (opt-in): una ruta aparece en el menú si su carpeta tiene A LA VEZ
//   · un `page.*`         → es una ruta navegable
//   · un `nav.meta.mjs`   → declara { label, icon, section, order }
// Así `/auth`, `/Corte365`, `/establishment/[id]` y las sub-páginas quedan fuera
// automáticamente (no declaran nav.meta). La URL se deriva de la ruta de la
// carpeta (grupos (x) se ignoran; rutas dinámicas [x] no pueden ir al menú).
//
// Se ejecuta solo en `predev` / `prebuild` (ver package.json). Salida:
//   src/config/navigation.generated.js  (datos serializables; icon = string)
// ─────────────────────────────────────────────────────────────────────────────
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const APP_DIR = join(ROOT, 'src', 'app');
const OUT_DIR = join(ROOT, 'src', 'config');
const OUT_FILE = join(OUT_DIR, 'navigation.generated.ts');

// Orden en que se muestran las secciones del menú. Una sección no listada aquí
// va al final (alfabética).
const SECTION_ORDER = ['Principal', 'Empleados', 'Operación'];

const PAGE_FILES = new Set(['page.jsx', 'page.tsx', 'page.js', 'page.ts']);
// Los nav.meta.ts se importan directo: Node 24 hace type-stripping y elide el
// `import type` del alias, así que se pueden leer sin transpilar.
const META_FILE = 'nav.meta.ts';

const isGroup = (seg) => seg.startsWith('(') && seg.endsWith(')');        // (marketing) → no afecta URL
const isDynamic = (seg) => seg.startsWith('[');                          // [id], [...slug] → sin URL estática
const isReserved = (seg) => seg.startsWith('@') || seg.startsWith('_');  // @slot (paralelas) · _privadas

// Carpeta de app/ → URL de Next (respeta may/min y caracteres tal cual)
function dirToRoutePath(dir) {
    const rel = relative(APP_DIR, dir);
    if (rel === '') return '/';
    const segs = rel.split(sep);
    if (segs.some(isDynamic)) return null;              // dinámica → no va al menú
    const url = segs.filter(s => !isGroup(s)).join('/'); // quita (grupos)
    return '/' + url;
}

// Recorre app/ y junta las carpetas que son ruta (page.*) y declaran nav.meta.
async function collectNavDirs(dir, acc = []) {
    const entries = await readdir(dir, { withFileTypes: true });
    const names = entries.filter(e => e.isFile()).map(e => e.name);
    if (names.some(n => PAGE_FILES.has(n)) && names.includes(META_FILE)) acc.push(dir);
    for (const e of entries) {
        if (e.isDirectory() && !isReserved(e.name)) await collectNavDirs(join(dir, e.name), acc);
    }
    return acc;
}

async function main() {
    const dirs = await collectNavDirs(APP_DIR);

    const items = [];
    for (const dir of dirs) {
        const path = dirToRoutePath(dir);
        if (!path) continue;
        const meta = (await import(pathToFileURL(join(dir, META_FILE)).href)).default;
        if (!meta?.label || !meta?.icon) {
            console.warn(`[nav] ${path}: nav.meta.mjs sin label/icon → se omite`);
            continue;
        }
        items.push({
            path,
            name: meta.label,
            icon: meta.icon,
            section: meta.section || 'Otros',
            order: Number.isFinite(meta.order) ? meta.order : 999,
        });
    }

    // Agrupar por sección + ordenar
    const bySection = new Map();
    for (const it of items) {
        if (!bySection.has(it.section)) bySection.set(it.section, []);
        bySection.get(it.section).push(it);
    }
    for (const list of bySection.values()) {
        list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es'));
    }
    const rank = (s) => (SECTION_ORDER.indexOf(s) === -1 ? 999 : SECTION_ORDER.indexOf(s));
    const NAV_SECTIONS = [...bySection.keys()]
        .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'es'))
        .map(section => ({
            label: section,
            items: bySection.get(section).map(({ name, path, icon }) => ({ name, path, icon })),
        }));

    const banner =
`// ⚠️ ARCHIVO AUTO-GENERADO por scripts/generate-nav.mjs — NO editar a mano.
// Se regenera en cada 'npm run dev' / 'npm run build' (predev/prebuild).
// El menú sale del file-system: cada carpeta de app/ con page.* + nav.meta.ts.
// Para cambiar el menú, edita el nav.meta.ts de la ruta (no este archivo).

import type { NavSection } from './nav.types';

`;
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(OUT_FILE, banner + `export const NAV_SECTIONS: NavSection[] = ${JSON.stringify(NAV_SECTIONS, null, 4)};\n`, 'utf8');

    const total = NAV_SECTIONS.reduce((n, s) => n + s.items.length, 0);
    console.log(`[nav] ${total} rutas en ${NAV_SECTIONS.length} secciones → src/config/navigation.generated.ts`);
    for (const s of NAV_SECTIONS) console.log(`      ${s.label}: ${s.items.map(i => i.path).join(', ')}`);
}

main().catch(err => {
    console.error('[nav] error generando el menú:', err);
    process.exit(1);
});
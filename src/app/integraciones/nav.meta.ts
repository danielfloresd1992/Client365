import type { NavMeta } from '@/config/nav.types';

/**
 * Las integraciones tienen sección propia, «Sistema», y no cuelgan de
 * «Operación».
 *
 * Lo que se administra acá no es el negocio: son las credenciales con las que
 * OTROS programas entran a Jarvis. Ponerla junto a las alertas y los
 * establecimientos la haría parecer una pantalla de trabajo diario, y no lo es
 * — se entra cuando se conecta o se desconecta un sistema, y el resto del
 * tiempo no se toca.
 *
 * La sección queda lista para lo que venga después: el catálogo de endpoints
 * publicados, los registros de uso, las herramientas externas conectadas.
 */
export default { label: 'Herramienta de integraciones', icon: 'plug', section: 'Sistema', order: 1 } satisfies NavMeta;

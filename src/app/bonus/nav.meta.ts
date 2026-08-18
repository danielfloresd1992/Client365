import type { NavMeta } from '@/config/nav.types';

/**
 * El sistema de bonificación tiene sección propia y no cuelga de "Empleados".
 *
 * No es una pantalla más de administración de personal: decide cuánto se le
 * paga a la gente, y cruza tres cosas que viven en otras rutas —las alertas del
 * catálogo, los establecimientos y los horarios—. Enterrarla entre los horarios
 * y la asistencia la hacía parecer un accesorio de esas dos.
 */
export default { label: 'Sistema de bonificación', icon: 'star', section: 'Bonificación', order: 1 } satisfies NavMeta;

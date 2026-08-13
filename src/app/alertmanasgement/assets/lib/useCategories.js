'use client';
import { useState, useEffect, useCallback } from 'react';
import { getCategories } from '../model/menuCategory.model.js';
import { RESPALDO, setCategoryCatalog } from './categoryMeta.js';

/**
 * Carga el catálogo de categorías y lo deja disponible para toda la pantalla.
 *
 * Hay TRES situaciones distintas y conviene no mezclarlas, porque la API se
 * despliega a mano y las tres se van a dar de verdad, en este orden:
 *
 *   1. `sinCatalogo`   — el endpoint todavía no existe (404). Se trabaja con
 *                        las categorías de siempre y no se puede crear nada.
 *   2. `catalogoVacio` — el endpoint responde pero no hay ninguna categoría:
 *                        se desplegó la API y falta correr la siembra. Se
 *                        muestran las de siempre y SÍ se puede crear.
 *   3. Todo en orden   — el catálogo real.
 *
 * En 1 y 2 lo que se ve son las de respaldo, que no son documentos reales: no
 * tienen `_id` y por eso no se pueden editar ni borrar.
 *
 * @param incluirInactivas - true en la pantalla de gestión (necesita ver las
 *                           desactivadas); false donde se elige categoría.
 */
export default function useCategories(incluirInactivas = false) {
    const [categorias, setCategorias]     = useState(() => desdeRespaldo());
    const [cargando, setCargando]         = useState(true);
    const [sinCatalogo, setSinCatalogo]   = useState(false);
    const [catalogoVacio, setCatalogoVacio] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const lista = await getCategories(incluirInactivas);
            setSinCatalogo(false);
            setCatalogoVacio(lista.length === 0);

            // Con la lista vacía se siguen mostrando las de siempre. Dejarla
            // vacía mandaría todas las alertas al grupo "Otras", sin ícono ni
            // nombre, como si se hubiera perdido algo.
            setCategorias(lista.length ? lista : desdeRespaldo());
            setCategoryCatalog(lista);
        }
        catch {
            // Con el endpoint caído o sin desplegar se sigue con las de
            // siempre: la gestión de alertas no puede quedar inutilizable
            // porque el catálogo no esté.
            setCategorias(desdeRespaldo());
            setSinCatalogo(true);
            setCatalogoVacio(false);
        }
        finally {
            setCargando(false);
        }
    }, [incluirInactivas]);

    useEffect(() => { cargar(); }, [cargar]);

    return { categorias, cargando, sinCatalogo, catalogoVacio, recargar: cargar };
}


/**
 * Las 12 de siempre con la forma que devuelve la API.
 *
 * Van sin `_id` a propósito: es lo que le permite a la pantalla de gestión
 * darse cuenta de que no son documentos reales y no ofrecer editarlas.
 */
function desdeRespaldo() {
    return Object.entries(RESPALDO).map(([value, m], i) => ({
        value,
        es: m.es,
        en: m.es,
        icon: m.icon,
        color: m.color,
        bg: m.bg,
        order: (i + 1) * 10,
        active: true,
        inUse: 0,
    }));
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import { getBonusCategories } from '@/libs/ajaxClient/menu.fecth.js';

/**
 * Carga el catálogo de categorías de BONIFICACIÓN.
 *
 * No confundir con la categoría operativa de la alerta ('delay', 'food'…): ésa
 * es una lista fija que vive en libs/alerts/categories.js y no se administra. Ésta sí,
 * porque la bonificación se calcula puertas adentro y no la lee ningún sistema
 * externo.
 *
 * Hay TRES situaciones distintas y conviene no mezclarlas, porque la API se
 * despliega a mano y las tres se van a dar de verdad, en este orden:
 *
 *   1. `sinCatalogo`   — el endpoint todavía no existe (404). No se puede
 *                        crear nada hasta desplegar la API.
 *   2. `catalogoVacio` — el endpoint responde pero no hay ninguna categoría.
 *                        Es el estado normal al empezar: hay que crearlas.
 *   3. Todo en orden   — el catálogo real.
 *
 * A diferencia del catálogo operativo, acá no hay lista de respaldo: una
 * categoría de bonificación no existe hasta que alguien la crea, así que una
 * lista vacía es un dato correcto y no una falla que haya que disimular.
 *
 * @param incluirInactivas - true en la pantalla de gestión (necesita ver las
 *                           desactivadas); false donde se elige categoría.
 */
export default function useBonusCategories(incluirInactivas = false) {
    const [categorias, setCategorias]       = useState([]);
    const [cargando, setCargando]           = useState(true);
    const [sinCatalogo, setSinCatalogo]     = useState(false);
    const [catalogoVacio, setCatalogoVacio] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const lista = await getBonusCategories(incluirInactivas);
            setSinCatalogo(false);
            setCatalogoVacio(lista.length === 0);
            setCategorias(lista);
        }
        catch {
            // Con el endpoint caído o sin desplegar la pantalla sigue usable:
            // la bonificación es opcional, así que no poder elegirla no impide
            // crear ni editar alertas.
            setCategorias([]);
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

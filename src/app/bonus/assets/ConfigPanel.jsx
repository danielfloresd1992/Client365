'use client';
import { useState, useEffect, useRef } from 'react';
import { FiShare2, FiList } from 'react-icons/fi';
import ReferenceValues from './ReferenceValues';
import BonusMap from './BonusMap';
import ListaDeReglas from './ListaDeReglas';
import RuleForm from './RuleForm';
import CategoryManager from './categories/CategoryManager';
import useBonusCategories from '@/hook/useBonusCategories.js';
import { reglaNueva, reglaParaFormulario } from './bonusRuleFormat';

// Con prefijo de módulo, como el resto de las claves nuevas. NO se llama
// `mapa-de-bonificacion:*` a propósito: esa familia —el zoom, las cajas— es de
// cosas que pasan ADENTRO del mapa, y esto decide si hay mapa.
const CLAVE_VISTA = 'bonos:vista-de-reglas';
const VISTAS_VALIDAS = ['mapa', 'lista'];

/**
 * CONFIGURACIÓN DE REFERENCIAS.
 *
 * Dos cosas, en el orden en que se usan:
 *
 *   1. Los valores globales — cuánto vale un bono y a qué cambio se paga.
 *   2. El mapa            — qué alertas bonifican, con qué regla y dónde.
 *
 *
 * EL MAPA ES LA PANTALLA
 *
 * No hay una lista de alertas con un selector al lado: hay cajas y cables. La
 * alerta a la izquierda, DÓNDE aplica en el medio —una caja por asignación— y
 * la regla de cada una a la derecha. Arrastrar un cable reapunta la asignación,
 * soltarlo afuera la borra, y cada gesto manda la lista completa al servidor,
 * que la valida junta.
 *
 * Se entra por la alerta y no por la regla porque la misma alerta puede ir con
 * reglas distintas según el establecimiento — y eso solo se ve poniendo la
 * alerta primero y desplegando sus alcances.
 */
export default function ConfigPanel({
    ajustes, cargandoAjustes, guardandoAjustes, onGuardarAjustes,
    reglas, alertas, alcance, cargando, guardando, puedeEditar,
    onGuardarRegla, onBorrarRegla, onEscribirAsignaciones,
}) {

    // null = viendo el mapa. Un objeto = editando esa regla (sin `_id` si es nueva).
    const [editando, setEditando] = useState(null);
    const [gestionando, setGestionando] = useState(false);

    // 'mapa' | 'lista'. Vive acá y no adentro de las vistas porque el
    // `if (editando)` de más abajo desmonta las dos: con el estado adentro,
    // volver de RuleForm devolvería siempre al mapa — y crear reglas es lo que
    // más se hace desde una lista de reglas por categoría.
    const [vista, setVista] = useState('mapa');
    const restaurada = useRef(false);

    // Arranca en 'mapa' y recién DESPUÉS lee lo guardado, por lo mismo que el
    // zoom: en el servidor no hay localStorage, y leerlo en el estado inicial
    // haría que el HTML del servidor y el del navegador no coincidan. Un frame
    // con el mapa es un frame; una hidratación rota se lleva la pantalla entera.
    useEffect(() => {
        if (restaurada.current) return;
        restaurada.current = true;
        try {
            const guardada = window.localStorage.getItem(CLAVE_VISTA);
            // Se valida contra la lista: un valor viejo o editado a mano dejaría
            // las DOS vistas ocultas y la pantalla en blanco.
            if (VISTAS_VALIDAS.includes(guardada)) setVista(guardada);
        }
        catch { /* modo privado: no se recuerda y listo */ }
    }, []);

    useEffect(() => {
        if (!restaurada.current) return;
        try { window.localStorage.setItem(CLAVE_VISTA, vista); }
        catch { /* ver arriba */ }
    }, [vista]);

    // Se arma UNA vez y baja a las dos vistas: así el control no se duplica y,
    // sobre todo, no viaja de lugar al alternar.
    const conmutador = <ConmutadorDeVista vista={vista} onCambiar={setVista} />;

    // El gestor de categorías vive acá porque lo abre el formulario de la regla:
    // así, al cerrarlo, el selector ya tiene lo recién creado sin recargar nada.
    const { categorias, cargando: cargandoCats, sinCatalogo, catalogoVacio, recargar } = useBonusCategories(true);

    const guardar = async (regla) => {
        const guardada = await onGuardarRegla(regla);
        if (guardada) setEditando(null);
    };

    const borrar = async (regla) => {
        const borrada = await onBorrarRegla(regla._id);
        if (borrada) setEditando(null);
    };

    if (editando) {
        return (
            <div className='max-w-[900px]'>
                <button type='button' onClick={() => setEditando(null)}
                    className='mb-3 text-[12.5px] font-semibold text-gray-600 hover:text-gray-900 transition-colors'>
                    {vista === 'lista' ? '← Volver a la lista' : '← Volver al mapa'}
                </button>

                <div className='bg-white rounded-xl shadow-sm border p-5'>
                    <RuleForm
                        // Remontar al cambiar de regla: el formulario arranca de
                        // una copia local, y sin esto seguiría mostrando la anterior.
                        key={editando._id || 'nueva'}
                        valor={editando}
                        guardando={guardando}
                        onGuardar={guardar}
                        onCancelar={() => setEditando(null)}
                        onBorrar={borrar}
                        onGestionarCategorias={() => setGestionando(true)}
                    />
                </div>

                {gestionando && (
                    <CategoryManager
                        categorias={categorias}
                        cargando={cargandoCats}
                        sinCatalogo={sinCatalogo}
                        catalogoVacio={catalogoVacio}
                        onRecargar={recargar}
                        onCerrar={() => { setGestionando(false); recargar(); }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            <ReferenceValues
                ajustes={ajustes}
                cargando={cargandoAjustes}
                guardando={guardandoAjustes}
                puedeEditar={puedeEditar}
                onGuardar={onGuardarAjustes}
            />

            {/* EL MAPA SE OCULTA, NO SE DESMONTA.

                Remontarlo vuelve a pedir el catálogo —`useBonusCategories`
                arranca en `cargando: true` en cada montaje— y esa tanda tardía
                cae con la animación ya encendida: cambia `secciones`, la época
                no coincide, se limpia el cache y se re-mide con el `transform`
                en pleno viaje de un segundo. Los cables quedan apuntando al
                aire hasta el próximo toque de zoom, que es exactamente el bug
                de 8733060 — y el guard de la escala no lo atrapa, porque sólo
                distingue la restauración cuando el lienzo TODAVÍA NO existe, y
                al volver de la lista existe desde el primer render.

                Además acá viven el banco de alertas traídas a mano (`enLienzo`)
                y la asignación a medio armar (`armando`), que son trabajo del
                usuario y no datos del servidor: desmontar los pierde en
                silencio.

                OJO: el envoltorio NO puede llevar una utilidad de display
                —`block`, `flex`, `grid`—, porque le ganaría al
                `[hidden]{display:none}` de la hoja del navegador y el mapa
                quedaría visible igual. Si algún día necesita display, pasar a
                `className={vista === 'mapa' ? '' : 'hidden'}`. */}
            <div hidden={vista !== 'mapa'}>
                <BonusMap
                    reglas={reglas}
                    alertas={alertas}
                    alcance={alcance}
                    cargando={cargando}
                    puedeEditar={puedeEditar}
                    conmutador={conmutador}
                    onEscribirAsignaciones={onEscribirAsignaciones}
                    onEditarRegla={regla => setEditando(reglaParaFormulario(regla))}
                    onNuevaRegla={categoria => setEditando(reglaNueva(categoria || null))}
                />
            </div>

            {/* LA MISMA CONFIGURACIÓN, LEÍDA POR EL OTRO LADO: categoría →
                regla → alcance → alerta. Recibe los mismos datos y los mismos
                callbacks, y el catálogo de categorías se le PASA —ya está
                pedido acá arriba— para no hacer un tercer GET a
                /bonus/categories en la misma pantalla. */}
            <div hidden={vista !== 'lista'}>
                <ListaDeReglas
                    reglas={reglas}
                    alertas={alertas}
                    alcance={alcance}
                    categorias={categorias}
                    sinCatalogo={sinCatalogo}
                    cargando={cargando}
                    puedeEditar={puedeEditar}
                    conmutador={conmutador}
                    onEscribirAsignaciones={onEscribirAsignaciones}
                    onEditarRegla={regla => setEditando(reglaParaFormulario(regla))}
                    onNuevaRegla={categoria => setEditando(reglaNueva(categoria || null))}
                />
            </div>
        </div>
    );
}


/**
 * MAPA O LISTA. Dos formas de ver la misma configuración.
 *
 * DÓNDE VA: en el encabezado de cada tarjeta, pegado al título y antes del
 * `ml-auto`. No es una cuarta pestaña de página —las de page.jsx separan «qué
 * se hace», y ReferenceValues tiene que quedar arriba de las dos vistas igual—
 * y tampoco va en el racimo de la derecha, donde cualquier botón que aparezca
 * o desaparezca —«Reacomodar» va y viene según `aMano > 0`— lo correría de
 * lugar y habría que buscarlo cada vez.
 *
 * CÓMO SE VE: los colores son los de las pestañas de la página, que es el
 * «esto está seleccionado» del módulo, pero la CÁSCARA y la altura son las de
 * ControlesDeZoom. Eso no es capricho: con verde macizo suelto quedaría al lado
 * del «+ Regla», que ya es `bg-[#29c50c] text-white`, y serían dos verdes
 * macizos pegados con significados distintos —uno es estado, el otro crea
 * contenido—. Adentro de la pista blanca se lee como control de cámara,
 * hermano del zoom, que es lo que es. Y la altura total (28 + 4 + 2 = 34px)
 * topa con los `h-8` de la barra sin desalinear nada.
 *
 * `aria-pressed` y no `role='tab'`: es el patrón que usa todo el módulo para un
 * par de botones que eligen entre dos formas de lo mismo, y `role='tablist'`
 * obligaría a manejar flechas y `tabpanel`. El ícono suma porque a 11,5px
 * «Mapa» y «Lista» son dos palabras casi iguales de ancho.
 */
const VISTAS = [
    { key: 'mapa', label: 'Mapa', Icono: FiShare2, ayuda: 'Cajas y cables' },
    { key: 'lista', label: 'Lista', Icono: FiList, ayuda: 'Reglas agrupadas por categoría' },
];

function ConmutadorDeVista({ vista, onCambiar }) {
    return (
        <div role='group' aria-label='Forma de ver las reglas'
            className='inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5'>
            {VISTAS.map(v => (
                <button key={v.key} type='button' onClick={() => onCambiar(v.key)}
                    aria-pressed={vista === v.key} title={v.ayuda}
                    className={`h-7 px-2.5 inline-flex items-center gap-1.5 rounded-md text-[11.5px] font-bold
                                transition-colors
                                focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#29c50c]
                                ${vista === v.key
                                    ? 'bg-[#29c50c] text-white shadow-sm hover:bg-[#1f9a08]'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                    <v.Icono size={13} aria-hidden='true' />
                    {v.label}
                </button>
            ))}
        </div>
    );
}

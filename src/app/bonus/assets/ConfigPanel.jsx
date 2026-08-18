'use client';
import { useState } from 'react';
import ReferenceValues from './ReferenceValues';
import BonusMap from './BonusMap';
import RuleForm from './RuleForm';
import CategoryManager from './categories/CategoryManager';
import useBonusCategories from '@/hook/useBonusCategories.js';
import { reglaNueva, reglaParaFormulario } from './bonusRuleFormat';

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
 * No hay una lista de alertas con un selector al lado: hay cajas y cables. Una
 * regla en el centro, las alertas que la usan a la izquierda, y a dónde aplica a
 * la derecha. Tender un cable asigna, arrastrarlo reasigna, soltarlo afuera
 * desconecta — y cada gesto es una escritura contra los endpoints que ya
 * existen.
 *
 * La razón de fondo es que el reglamento se lee así: una condición y las alertas
 * que la cumplen. Una lista alfabética con un desplegable por fila obligaba a
 * recomponer esa forma en la cabeza, alerta por alerta.
 */
export default function ConfigPanel({
    ajustes, cargandoAjustes, guardandoAjustes, onGuardarAjustes,
    reglas, alertas, alcance, cargando, guardando, puedeEditar,
    onGuardarRegla, onBorrarRegla, onAsignarRegla, onCambiarAlcance,
}) {

    // null = viendo el mapa. Un objeto = editando esa regla (sin `_id` si es nueva).
    const [editando, setEditando] = useState(null);
    const [gestionando, setGestionando] = useState(false);

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
                    ← Volver al mapa
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

            <BonusMap
                reglas={reglas}
                alertas={alertas}
                alcance={alcance}
                cargando={cargando}
                guardando={guardando}
                puedeEditar={puedeEditar}
                onAsignarRegla={onAsignarRegla}
                onCambiarAlcance={onCambiarAlcance}
                onEditarRegla={regla => setEditando(reglaParaFormulario(regla))}
                onNuevaRegla={() => setEditando(reglaNueva())}
            />
        </div>
    );
}

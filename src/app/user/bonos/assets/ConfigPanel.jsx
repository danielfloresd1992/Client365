'use client';
import { useState } from 'react';
import ReferenceValues from './ReferenceValues';
import RulesPanel from './RulesPanel';
import AlertRuleList from './AlertRuleList';
import RuleForm from './RuleForm';

/**
 * CONFIGURACIÓN DE REFERENCIAS — todo lo que decide cuánto se paga, junto.
 *
 * Tres cosas en un mismo contenedor, en el orden en que se usan:
 *
 *   1. Los valores globales — cuánto vale un bono y a qué cambio se paga.
 *   2. Las reglas          — cuántos bonos otorga cada tipo de alerta.
 *   3. Las alertas         — cuál regla le toca a cada una.
 *
 * Las dos listas van LADO A LADO y no una debajo de la otra porque el trabajo
 * es ir y venir entre ellas: se crea una regla y se asigna, se ve que el valor
 * no era el que se quería y se corrige. Con las listas apiladas —o peor, en
 * pestañas separadas— cada asignación obligaba a subir a mirar qué significaba
 * cada regla y volver a bajar.
 *
 * Las dos tienen el mismo alto y su propio scroll. Sin eso no serían dos
 * paneles de un tablero: con trescientas y pico de alertas, esa columna mediría
 * veinte mil píxeles y la de reglas quedaría como un recuadro chico arriba de un
 * vacío enorme.
 *
 *
 * EL EDITOR SE LLEVA TODO EL ANCHO
 *
 * Editar una regla reemplaza las dos columnas en vez de abrirse dentro de la
 * suya. El formulario tiene alcance y excepciones —y las excepciones son una
 * grilla de cuatro campos por fila—: en una columna angosta no entra. Y un
 * diálogo tampoco servía, porque esto ya vive dentro de un contenedor con su
 * propio scroll.
 */
export default function ConfigPanel({
    ajustes, cargandoAjustes, guardandoAjustes, onGuardarAjustes,
    reglas, alertas, alcance, cargando, guardando, puedeEditar,
    onGuardarRegla, onBorrarRegla, onAsignarRegla,
}) {

    // null = viendo el tablero. Un objeto = editando esa regla (sin `_id` si es nueva).
    const [editando, setEditando] = useState(null);

    const guardarRegla = async (regla) => {
        const guardada = await onGuardarRegla(regla);
        if (guardada) setEditando(null);
    };

    const borrarRegla = async (regla) => {
        const borrada = await onBorrarRegla(regla._id);
        if (borrada) setEditando(null);
    };

    if (editando) {
        return (
            <div>
                <button
                    type='button'
                    onClick={() => setEditando(null)}
                    className='mb-3 text-[12.5px] font-semibold text-gray-600 hover:text-gray-900 transition-colors'
                >
                    ← Volver a la configuración
                </button>

                <RuleForm
                    // Remontar al cambiar de regla: el formulario arranca de una
                    // copia local, y sin esto seguiría mostrando la anterior.
                    key={editando._id || 'nueva'}
                    valor={editando}
                    alcance={alcance}
                    guardando={guardando}
                    onGuardar={guardarRegla}
                    onCancelar={() => setEditando(null)}
                    onBorrar={borrarRegla}
                />
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

            {/* Las reglas primero —se definen— y las alertas después —se les
                asigna—. Al apilarse en pantallas angostas queda ese mismo orden,
                que es el que hay que seguir la primera vez.

                `items-start` para que la columna corta no se estire al alto de
                la larga y quede con la mitad vacía. */}
            <div className='grid gap-4 items-start xl:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]'>
                <RulesPanel
                    reglas={reglas}
                    alcance={alcance}
                    cargando={cargando}
                    puedeEditar={puedeEditar}
                    onEditar={setEditando}
                />

                <AlertRuleList
                    alertas={alertas}
                    reglas={reglas}
                    cargando={cargando}
                    puedeEditar={puedeEditar}
                    onAsignar={onAsignarRegla}
                />
            </div>
        </div>
    );
}

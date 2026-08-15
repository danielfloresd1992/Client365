'use client';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FaTags, FaPlus, FaPen, FaTrashAlt, FaEye, FaEyeSlash, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

import { setConfigModal } from '@/store/slices/globalModal.js';
import { iconOf } from '../../lib/categoryIcons.js';
// Se importan con alias para no repetir "bonus" en cada llamada de este
// archivo, que ya trata de una sola cosa.
import {
    createBonusCategory as createCategory,
    updateBonusCategory as updateCategory,
    deleteBonusCategory as deleteCategory,
} from '@/libs/ajaxClient/menu.fecth.js';
import CategoryForm from './CategoryForm.jsx';

/**
 * Pantalla de gestión del catálogo de categorías.
 *
 * Se abre sobre la lista de alertas porque es donde se necesita: uno se da
 * cuenta de que falta una categoría justo cuando está creando la alerta que la
 * necesitaría.
 *
 *
 * BORRAR Y DESACTIVAR NO SON LO MISMO
 *
 * Una categoría que ninguna alerta usa se borra y ya. Una que sí se usa NO se
 * borra: el servidor lo rechaza. Y hace bien — al borrarla, las alertas que la
 * tienen quedarían apuntando a algo que no existe y desaparecerían de la lista
 * sin dar ningún error, que es la peor forma de perder información.
 *
 * Para eso está desactivar: la categoría deja de ofrecerse al crear alertas
 * nuevas, y las que ya la tienen se siguen viendo igual.
 */
export default function CategoryManager({ categorias, cargando, sinCatalogo, catalogoVacio, onRecargar, onCerrar }) {
    const dispatch = useDispatch();

    const [editando, setEditando]   = useState(null);   // categoría | {} para nueva | null
    const [guardando, setGuardando] = useState(false);

    // Sin el endpoint desplegado no hay nada real que editar ni borrar: las
    // acciones se deshabilitan en lugar de fallar al pulsarlas.
    const filasDeRespaldo = sinCatalogo;

    /** Muestra un error usando el mensaje del servidor cuando lo hay. */
    const avisarError = (error, titulo) => {
        dispatch(setConfigModal({
            modalOpen: true,
            title: titulo,
            description: error?.response?.data?.message
                || (error?.response?.status === 403 ? 'No tenés permisos para esta acción.' : 'Ha ocurrido un error.'),
            isCallback: null,
            type: 'error',
        }));
    };

    const guardar = async (datos) => {
        setGuardando(true);
        try {
            if (editando?._id) await updateCategory(editando._id, datos);
            else               await createCategory(datos);

            setEditando(null);
            await onRecargar();
        }
        catch (error) {
            avisarError(error, editando?._id ? 'No se pudo guardar' : 'No se pudo crear');
        }
        finally {
            setGuardando(false);
        }
    };

    const alternarActiva = async (categoria) => {
        try {
            await updateCategory(categoria._id, { active: !categoria.active });
            await onRecargar();
        }
        catch (error) {
            avisarError(error, 'No se pudo cambiar el estado');
        }
    };

    const pedirBorrado = (categoria) => {
        // El servidor decide igual, pero avisar antes evita el viaje y el susto
        // de un error rojo por algo que era previsible.
        if (categoria.inUse > 0) {
            dispatch(setConfigModal({
                modalOpen: true,
                title: 'No se puede eliminar',
                description: `"${categoria.es}" la usan ${categoria.inUse} alerta(s). `
                    + 'Desactivala con el ojo: deja de ofrecerse al crear alertas nuevas y las que ya la tienen no cambian.',
                isCallback: null,
                type: 'warning',
            }));
            return;
        }

        dispatch(setConfigModal({
            modalOpen: true,
            title: `¿Eliminar la categoría "${categoria.es}"?`,
            description: 'Ninguna alerta la usa, así que no se pierde nada.',
            type: 'warning',
            isCallback: async () => {
                try {
                    await deleteCategory(categoria._id);
                    await onRecargar();
                }
                catch (error) {
                    avisarError(error, 'No se pudo eliminar');
                }
            },
        }));
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(17,24,39,0.45)', padding: '20px',
        }}>
            <div style={{
                width: '100%', maxWidth: '760px', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                borderRadius: '18px', border: '1px solid #e6dcc6',
                background: 'linear-gradient(180deg, #fdfbf5 0%, #f8f3e8 100%)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
            }}>
                <div style={{ height: '4px', flexShrink: 0, background: 'linear-gradient(90deg, #29c50c, #6ba823)' }} />

                {/* Cabecera */}
                <div style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '16px 18px', borderBottom: '1px solid #e6dcc6', background: 'rgba(255,255,255,0.55)',
                }}>
                    <span style={{
                        width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #29c50c, #5cc41f)',
                        boxShadow: '0 3px 10px rgba(41,197,12,0.28)',
                    }}>
                        <FaTags size={15} color='#fff' />
                    </span>

                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '16px', color: '#1f2937' }}>Categorías de bonificación</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                            Con las que se agrupan y filtran las alertas
                        </p>
                    </div>

                    {!editando && !sinCatalogo && (
                        <button
                            type='button'
                            onClick={() => setEditando({})}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                                padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: '13px', color: '#fff', whiteSpace: 'nowrap',
                                background: 'linear-gradient(135deg, #29c50c 0%, #1f9a08 100%)',
                                boxShadow: '0 3px 10px rgba(41,197,12,0.30)',
                            }}
                        >
                            <FaPlus size={11} /> Nueva
                        </button>
                    )}

                    <button
                        type='button'
                        onClick={onCerrar}
                        title='Cerrar'
                        style={{
                            width: '34px', height: '34px', flexShrink: 0, borderRadius: '10px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid #e6dcc6', background: '#fff', color: '#6b7280',
                        }}
                    >
                        <FaTimes size={13} />
                    </button>
                </div>

                {/* Cuerpo */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px' }}>

                    {/* Cuando lo que se ve no es el catálogo real hay que decirlo:
                        si no, los botones que faltan parecen un error. Los dos
                        casos se explican distinto porque se resuelven distinto. */}
                    {filasDeRespaldo && (
                        <div style={{
                            display: 'flex', gap: '10px', alignItems: 'flex-start',
                            padding: '13px 15px', marginBottom: '16px', borderRadius: '12px',
                            background: '#fffbeb', border: '1px solid #fde68a',
                        }}>
                            <FaExclamationTriangle size={15} color='#b45309' style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
                                    {sinCatalogo
                                        ? 'El catálogo todavía no está disponible en el servidor'
                                        : 'Todavía no hay ninguna categoría de bonificación'}
                                </p>
                                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#a16207' }}>
                                    {sinCatalogo
                                        ? 'No se pueden crear ni editar hasta que se actualice la API. Las alertas '
                                          + 'funcionan con normalidad: la categoría de bonificación es opcional.'
                                        : 'Creá la primera con el botón de arriba. Después vas a poder elegirla al '
                                          + 'crear o editar una alerta.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {editando ? (
                        <CategoryForm
                            categoria={editando._id ? editando : null}
                            onGuardar={guardar}
                            onCancelar={() => setEditando(null)}
                            guardando={guardando}
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                            {cargando && categorias.length === 0 && (
                                <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
                                    Cargando categorías…
                                </p>
                            )}

                            {categorias.map(c => (
                                <Fila
                                    key={c._id || c.value}
                                    categoria={c}
                                    bloqueada={filasDeRespaldo}
                                    onEditar={() => setEditando(c)}
                                    onAlternar={() => alternarActiva(c)}
                                    onBorrar={() => pedirBorrado(c)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


/** Una categoría en la lista: cómo se ve, cuántas alertas tiene y qué se puede hacerle. */
function Fila({ categoria, bloqueada, onEditar, onAlternar, onBorrar }) {
    const Icono = iconOf(categoria.icon);
    const inactiva = categoria.active === false;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '11px',
            padding: '11px 13px', borderRadius: '12px',
            border: '1px solid #e6dcc6', background: '#fff',
            opacity: inactiva ? 0.6 : 1,
        }}>
            <span style={{
                width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: categoria.bg || '#f3f4f6',
            }}>
                <Icono size={15} color={categoria.color || '#374151'} />
            </span>

            <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                    margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#1f2937',
                    textDecoration: inactiva ? 'line-through' : 'none',
                }}>
                    {categoria.es}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
                    {categoria.en} · {categoria.value}
                </p>
            </div>

            {/* Cuántas alertas la usan: es lo que decide si se puede borrar. */}
            <span style={{
                flexShrink: 0, fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '999px',
                background: categoria.inUse > 0 ? '#eef2e6' : '#f3f4f6',
                color: categoria.inUse > 0 ? '#4d7c0f' : '#9ca3af',
            }}>
                {categoria.inUse || 0} {categoria.inUse === 1 ? 'alerta' : 'alertas'}
            </span>

            {!bloqueada && (
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                    <BotonIcono
                        titulo={inactiva ? 'Activar' : 'Desactivar'}
                        onClick={onAlternar}
                        color={inactiva ? '#1f9a08' : '#6b7280'}
                    >
                        {inactiva ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                    </BotonIcono>

                    <BotonIcono titulo='Editar' onClick={onEditar} color='#1d4ed8'>
                        <FaPen size={11} />
                    </BotonIcono>

                    <BotonIcono titulo='Eliminar' onClick={onBorrar} color='#b91c1c'>
                        <FaTrashAlt size={11} />
                    </BotonIcono>
                </div>
            )}
        </div>
    );
}


function BotonIcono({ titulo, onClick, color, children }) {
    return (
        <button
            type='button'
            title={titulo}
            onClick={onClick}
            style={{
                width: '30px', height: '30px', borderRadius: '9px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #e6dcc6', background: '#fff', color,
            }}
        >
            {children}
        </button>
    );
}

'use client';
import { useCallback, useRef, useState } from 'react';
import { getBonusLedger } from '@/libs/ajaxClient/bonus.fecth';
import ConsultaDeBonos from './ConsultaDeBonos.jsx';
import ResumenGeneral from './ResumenGeneral.jsx';

/**
 * PANEL INFORMATIVO.
 *
 * Consultar lo bonificado en un período. No edita nada, y por eso está aparte:
 * la pantalla de configuración muestra los datos para tocarlos uno por uno, y
 * ninguna de sus partes responde la pregunta que se hace cualquiera que llega
 * — "¿cuánto se bonificó esta quincena, y quién?".
 *
 * Dos piezas, cada una en su archivo:
 *
 *   ConsultaDeBonos   el rango y el operador. Arranca en el mes en curso y
 *                     consulta sola, así que la pantalla abre con datos.
 *   ResumenGeneral    la tabla por operador y, al lado, la comparación de
 *                     quiénes hicieron más bonos netos.
 *
 * ANTES ACÁ HABÍA UN «ESTADO DEL SISTEMA» con el valor del bono, la tasa y
 * cuántas reglas y alertas había cargadas. Eran cuentas sobre datos que la
 * pestaña de configuración ya muestra al lado, y ocupaban el lugar de lo único
 * que no se podía ver en ninguna parte: lo efectivamente bonificado. El valor
 * del bono y la tasa siguen acá, pero como lo que son —el multiplicador del
 * monto—, no como una ficha aparte.
 */
export default function InfoPanel({ ajustes, cargando }) {

    const [datos, setDatos] = useState(null);
    const [consultando, setConsultando] = useState(false);
    const [error, setError] = useState(null);

    // Cada consulta lleva número. Si alguien toca «Consultar» dos veces, la
    // respuesta de la primera puede llegar después de la segunda: sin esto,
    // la vieja pisaría a la nueva y la pantalla mostraría el rango anterior.
    const enCurso = useRef(0);

    const consultar = useCallback(async ({ desde, hasta, operador }) => {
        const turno = ++enCurso.current;

        setConsultando(true);
        setError(null);

        try {
            const respuesta = await getBonusLedger({ desde, hasta, operador, agrupar: 'operador' });
            if (turno !== enCurso.current) return;
            setDatos(respuesta);
        }
        catch (err) {
            if (turno !== enCurso.current) return;
            // El mensaje del servidor tal cual: los dos rechazos que tira
            // —rango de más de 92 días, y demasiadas novedades para agrupar—
            // vienen en español y con el número que hace falta para corregir.
            setError(err?.response?.data?.message || err?.message || 'No se pudo consultar el período.');
            setDatos(null);
        }
        finally {
            if (turno === enCurso.current) setConsultando(false);
        }
    }, []);

    if (cargando) {
        return (
            <section className='bg-white rounded-xl shadow-sm border p-5'>
                <p className='text-[13px] text-gray-500'>Cargando el panel…</p>
            </section>
        );
    }

    return (
        <div className='space-y-4'>
            <ConsultaDeBonos onConsultar={consultar} cargando={consultando} />
            <ResumenGeneral datos={datos} ajustes={ajustes} cargando={consultando && !datos} error={error} />
        </div>
    );
}

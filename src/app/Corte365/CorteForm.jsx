'use client';
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';

import useAuthOnServer from '@/hook/auth';
import useAxios from '@/hook/useAxios';
import LoandingData from '@/components/loandingComponent/loanding';

import LocalCard from './LocalCard';
import parseCorteData from './helpers/parseCorteData';
import formatCorteText from './helpers/formatCorteText';
import calculateDishMetrics from './helpers/calculateDishMetrics';
import calculateTouchMetrics from './helpers/calculateTouchMetrics';


const BOT_URL = 'https://amazona365.ddns.net:4000/bot/img';


export default function CorteForm() {

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;
    const dispatch = useDispatch();
    const { requestAction } = useAxios();

    const [locals, setLocals] = useState([]);
    const [franchises, setFranchises] = useState([]);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);


    /* ── Carga inicial ────────────────────────────────────────────────── */
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // 1) Obtener lista ligera de locales
            const resLocals = await requestAction({ url: '/localforCort', action: 'GET' });
            if (resLocals.status !== 200) return;

            const lightLocals = (resLocals.data || [])
                .filter(l => l.typeMonitoring !== 'perimetral')
           

            // 2) Obtener detalles de cada local en paralelo
            const details = await Promise.allSettled(
                lightLocals.map(l =>
                    requestAction({ url: `/local&manager/id=${l._id}`, action: 'GET' })
                        .then(r => r.status === 200 ? r.data : null)
                )
            );

            const fullLocals = details
                .map(r => r.status === 'fulfilled' ? r.value : null)
                .filter(l => l && l.typeMonitoring !== 'perimeter');

            // 3) Obtener franquicias
            let fr = [];
            try {
                const resFr = await requestAction({ url: '/franchise', action: 'GET' });
                if (resFr.status === 200) fr = resFr.data || [];
            } catch (_) { /* franquicias opcionales */ }

            // 4) Inicializar formData para cada local
            const initial = {};
            for (const local of fullLocals) {
     
                initial[local._id] = buildInitialFormData(local);
            }

            setLocals(fullLocals);
            setFranchises(fr);
            setFormData(initial);
        } catch (err) {
            console.error('Error cargando datos:', err);
        } finally {
            setIsLoading(false);
        }
    };


    /* ── Construir estado inicial para un local ──────────────────────── */
    const buildInitialFormData = (local) => {
        const fd = {
            rotation: '',
            procesos: {},
            toques: {},
        };

        // Procesos según tipo de evaluación
        if (local.dishMenu) {
            if (local.dishMenu.dishEvaluation === 'simple') {
                fd.procesos = { platoFuerte: '' };
            } else {
                fd.procesos = { entrada: '', platoFuerte: '', postre: '' };
            }
        }

        // Toques según managers disponibles
        const managers = (local.managers || [])
            .filter(m => m.status === 'Activo')
            .sort((a, b) => a.numberManager - b.numberManager);

        const isDetailed = local.touchs?.typeEvaluationTouch !== 'simple';

        if (managers.length > 0) {
            const addManager = m => {
                const key = `${m.burden}_${m.name}`;
                fd.toques[key] = isDetailed
                    ? { present: false, primeros: '', otros: '' }
                    : { present: false, total: '' };
            };
            managers.filter(m => m.burden === 'Gerente').forEach(addManager);
            managers.filter(m => m.burden === 'Asistente').forEach(addManager);
        } else {
            // Fallback genérico
            for (let i = 0; i < (local.touchs?.totalManager || 0); i++) {
                const key = `Gerente_${i + 1}`;
                fd.toques[key] = isDetailed
                    ? { present: false, primeros: '', otros: '' }
                    : { present: false, total: '' };
            }
            for (let i = 0; i < (local.touchs?.totalAttendee || 0); i++) {
                const key = `Asistente_${i + 1}`;
                fd.toques[key] = isDetailed
                    ? { present: false, primeros: '', otros: '' }
                    : { present: false, total: '' };
            }
        }

        return fd;
    };


    /* ── Actualizar un campo del formulario de un local ───────────────── */
    const handleChange = useCallback((localId, field, value) => {
        setFormData(prev => ({
            ...prev,
            [localId]: { ...prev[localId], [field]: value },
        }));
    }, []);


    /* ── Submit ────────────────────────────────────────────────────────── */
    const handleSubmit = async e => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            const parsed = parseCorteData(formData, locals);
            const username = user?.username || user?.name || '';

            // Texto formateado para bot
            const text = formatCorteText(parsed, username);

            // Métricas (para futuro uso con imágenes)
            const dishMetrics = calculateDishMetrics(locals, parsed);
            const touchMetrics = calculateTouchMetrics(franchises, locals, parsed);

            console.log('Corte parsed:', parsed);
            console.log('Dish metrics:', dishMetrics);
            console.log('Touch metrics:', touchMetrics);

            // Enviar corte al backend
            await requestAction({
                url: '/SendCorteDoc365',
                action: 'POST',
                body: {
                    corte: parsed,
                    date: new Date(),
                    userId: user?.userId || user?._id || '',
                },
            });

            // Enviar texto al bot (no bloquea si falla)
            try {
                const fd = new FormData();
                fd.append('my-text', text);
                await fetch(BOT_URL, { method: 'POST', body: fd }).catch(() => {});
            } catch (_) { /* bot es opcional */ }

            dispatch(setConfigModal({
                modalOpen: true,
                title: 'Aviso',
                description: 'Corte enviado con éxito',
                type: 'successfull',
                isCallback: null,
            }));

            // Reset formulario
            const reset = {};
            for (const local of locals) {
                reset[local._id] = buildInitialFormData(local);
            }
            setFormData(reset);

        } catch (err) {
            console.error('Error enviando corte:', err);
            dispatch(setConfigModal({
                modalOpen: true,
                title: 'Error',
                description: 'Ocurrió un error al enviar el corte',
                type: 'error',
                isCallback: null,
            }));
        } finally {
            setIsSubmitting(false);
        }
    };


    /* ── Fecha y turno actual ─────────────────────────────────────────── */
    const now = new Date();
    const turno = now.getHours() >= 17 ? 'Nocturno' : 'Diurno';
    const dateStr = now.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });


    /* ── Render ────────────────────────────────────────────────────────── */
    if (isLoading) return <LoandingData title='Cargando establecimientos...' />;


    const group = locals.length > 0 && locals.reduce((acc, item) => {
            const { franchiseReference } = item;
            const name = franchiseReference?.name_franchise;
            if (!acc[name]) {
                acc[name] = [];
            }
            acc[name].push(item);
            return acc;
        }, {});
    
        console.log(group)


    return (
        <div className='w-full h-full overflow-y-auto'>

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className='px-6 py-5 border-b border-[#1a3c2a]/60'>
                <div className='max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3'>
                    <div>
                        <h1 className='text-lg font-bold'>
                            Corte por hora
                        </h1>
                        <p className='text-emerald-800 text-xs mt-0.5'>
                            Rotaciones, procesos y toques de gerente
                        </p>
                    </div>
                    <div className='flex items-center gap-4'>
                        <div className='text-right'>
                            <p className='text-xs text-gray-500'>{dateStr}</p>
                            <p className={`text-xs font-bold ${turno === 'Nocturno' ? 'text-indigo-400' : 'text-yellow-400'}`}>
                                Turno {turno}
                            </p>
                        </div>
                        <div className='w-px h-8 bg-white/10' />
                        <p className='text-xs text-gray-400'>
                            {user?.username || user?.name || ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Formulario ──────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className='max-w-5xl mx-auto px-4 py-6'>

                {locals.length === 0 ? (
                    <p className='text-center text-gray-600 text-sm mt-10'>
                        No hay establecimientos configurados para corte.
                    </p>
                ) : 
                (
                    
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

                        {Object.entries(group).map(([key, list], index) => {
                            console.log(key)

                            return list.map(local => {
                                return(
                                    <LocalCard
                                        key={local._id}
                                        local={local}
                                        formValues={formData[local._id]}
                                        onChange={(field, value) => handleChange(local._id, field, value)}
                                    />
                                );
                            })
                        })}

                  
                    </div>
                )}

                {locals.length > 0 && (
                    <div className='mt-6 flex justify-center'>
                        <button
                            type='submit'
                            disabled={isSubmitting}
                            className='px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-colors'
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar corte'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

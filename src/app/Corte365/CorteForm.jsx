'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import axios from 'axios';
import { toJpeg } from 'html-to-image';

import useAuthOnServer from '@/hook/auth';
import useAxios from '@/hook/useAxios';
import LoandingData from '@/components/loandingComponent/loanding';
import { groupByFranchiseComprehensive } from '@/libs/parser/estableshment';
import LocalCard from './LocalCard';
import parseCorteData from './helpers/parseCorteData';
import formatCorteText from './helpers/formatCorteText';
import calculateDishMetrics from './helpers/calculateDishMetrics';
import calculateTouchMetrics from './helpers/calculateTouchMetrics';
import IndicatorProcesses from './indicators/IndicatorProcesses';
import IndicatorTouches from './indicators/IndicatorTouches';
import { arrGroup } from '@/libs/data/group';





export default function CorteForm() {

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;
    const dispatch = useDispatch();
    const clients = useSelector(state => state.clients);
    const [locals, setLocals] = useState([]);
    const { requestAction } = useAxios();

    const groupSeleted = arrGroup.filter(g => g.name === 'Indicadores de Amazonas365');

    const BOT_URL = `${process.env.NEXT_PUBLIC_SOCKET_AVA_CHAT}/bot/imgV2/number=${groupSeleted[0].key}`;



    const [franchises, setFranchises] = useState([]);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Métricas calculadas para renderizar indicadores ocultos
    const [dishMetrics, setDishMetrics] = useState([]);
    const [touchMetrics, setTouchMetrics] = useState([]);

    // Refs para captura de imágenes
    const processRef = useRef(null);
    const touchRef = useRef(null);


    /* ── Carga inicial ────────────────────────────────────────────────── */
    useEffect(() => {
        clients && loadData(clients);
    }, [clients]);



    const loadData = async (list) => {
        try {
            setIsLoading(true);


            // 2) Obtener detalles de cada local en paralelo
            const details = await Promise.allSettled(
                list.map(l =>
                    requestAction({ url: `/local&manager/id=${l._id}`, action: 'GET' })
                        .then(r => r.status === 200 ? r.data : null)
                )
            );

            console.log(details);

            const fullLocals = details
                .map(r => r.status === 'fulfilled' ? r.value : null)
                .filter(l => l && l.typeMonitoring.toLowerCase() === 'analytical' || l.typeMonitoring.toLowerCase() === 'completo');

            console.log(fullLocals);


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


    /* ── Capturar indicadores como imágenes y enviar al bot ────────────── */
    const captureAndSendImages = async (dishData, touchData) => {

        const sendImage = async (element, name) => {
            // html-to-image necesita que el elemento esté visible en el viewport.
            // Temporalmente lo movemos a left:0 para la captura.
            const prevLeft = element.style.left;
            const prevZIndex = element.style.zIndex;
            const prevPointerEvents = element.style.pointerEvents;
            element.style.left = '0';
            element.style.zIndex = '-1';
            element.style.pointerEvents = 'none';

            try {
                // Dar un frame al browser para aplicar estilos
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

                const dataUrl = await toJpeg(element, {
                    quality: 0.5,
                    backgroundColor: '#ffffff',
                    pixelRatio: 1,
                });

                const base64 = dataUrl.split(';base64,')[1];
                const fd = new FormData();
                fd.append('my-file', base64);
                fd.append('type', 'image/jpeg');
                fd.append('my-text', name);
                await axios.post(BOT_URL,fd );
            }
            catch (err) {
                console.error(`Error capturando imagen "${name}":`, err);
            }
            finally {
                // Restaurar posición oculta
                element.style.left = prevLeft;
                element.style.zIndex = prevZIndex;
                element.style.pointerEvents = prevPointerEvents;
            }
        };

        // Esperar a que React renderice los indicadores ocultos
        await new Promise(r => setTimeout(r, 500));

        // 1) Capturar indicadores de procesos
        if (processRef.current && dishData.length > 0) {
            const name = processRef.current.getAttribute('data-name') || 'Indicadores de procesos';
            await sendImage(processRef.current, name);
        }

        // 2) Capturar cada grupo de indicadores de toques
        if (touchRef.current && touchData.length > 0) {
            // Mover el wrapper padre a left:0 temporalmente
            const parent = touchRef.current;
            const prevParentLeft = parent.style.left;
            parent.style.left = '0';
            parent.style.zIndex = '-1';

            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            const groups = parent.querySelectorAll('.touch-indicator-group');
            for (const group of groups) {
                const name = group.getAttribute('data-name') || 'Indicadores de toques';
                try {
                    const dataUrl = await toJpeg(group, {
                        quality: 0.5,
                        backgroundColor: '#ffffff',
                        pixelRatio: 1,
                    });
                    const base64 = dataUrl.split(';base64,')[1];
                    const fd = new FormData();
                    fd.append('my-file', base64);
                    fd.append('type', 'image/jpeg');
                    fd.append('my-text', name);
                    await axios.post(BOT_URL, fd );
                } catch (err) {
                    console.error(`Error capturando imagen "${name}":`, err);
                }
            }

            parent.style.left = prevParentLeft;
            parent.style.zIndex = '';
        }
    };


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

            // Calcular métricas y renderizar indicadores ocultos
            const dMetrics = calculateDishMetrics(locals, parsed);
            const tMetrics = calculateTouchMetrics(franchises, locals, parsed);

            setDishMetrics(dMetrics);
            setTouchMetrics(tMetrics);

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
                await fetch(BOT_URL, { method: 'POST', body: fd }).catch(() => { });
            }
            catch (_) { /* bot es opcional */ }

            // Capturar y enviar imágenes de indicadores al bot
            try {
                await captureAndSendImages(dMetrics, tMetrics);
            }
            catch (_) { /* imágenes son opcionales */ }

            dispatch(setConfigModal({
                modalOpen: true,
                title: 'Aviso',
                description: 'Corte enviado con éxito',
                type: 'successfull',
                isCallback: null,
            }));

            // Reset formulario y métricas
            const reset = {};
            for (const local of locals) {
                reset[local._id] = buildInitialFormData(local);
            }
            setFormData(reset);
            setDishMetrics([]);
            setTouchMetrics([]);

        }
        catch (err) {
            console.error('Error enviando corte:', err);
            dispatch(setConfigModal({
                modalOpen: true,
                title: 'Error',
                description: 'Ocurrió un error al enviar el corte',
                type: 'error',
                isCallback: null,
            }));
        }
        finally {
            setIsSubmitting(false);
        }
    };


    /* ── Fecha y turno actual ─────────────────────────────────────────── */
    const now = new Date();
    const turno = now.getHours() >= 17 ? 'Nocturno' : 'Diurno';
    const dateStr = now.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });


    /* ── Render ────────────────────────────────────────────────────────── */
    if (isLoading) return <LoandingData title='Cargando establecimientos...' />;





    return (
        <div className='w-full h-full overflow-y-auto pt-[84px] sm:pt-0'>

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
                            {Object.entries(groupByFranchiseComprehensive(locals)).map(([key, list]) => {
                                console.log(key, list)
                                return list.map(local => {
                                    return (
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
                    <div className='mt-6 flex justify-center px-4 sm:px-0'>
                        <button
                            type='submit'
                            disabled={isSubmitting}
                            className='w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-colors'
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar corte'}
                        </button>
                    </div>
                )}
            </form>

            {/* ── Indicadores ocultos (para captura como imagen) ───── */}
            <IndicatorProcesses ref={processRef} data={dishMetrics} />
            <IndicatorTouches ref={touchRef} data={touchMetrics} />
        </div>
    );
}

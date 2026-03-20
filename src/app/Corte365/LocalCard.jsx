'use client';
import { arrayBufferToBase64 } from '@/libs/script/arrayTo64';


export default function LocalCard({ local, formValues, onChange }) {
    if (!local || !formValues) return null;

    const { dishMenu, touchs, managers } = local;

    const activeManagers = (managers || [])
        .filter(m => m.status === 'Activo')
        .sort((a, b) => a.numberManager - b.numberManager);

    const gerentes = activeManagers.filter(m => m.burden === 'Gerente');
    const asistentes = activeManagers.filter(m => m.burden === 'Asistente');
    const isDetailedTouch = touchs?.typeEvaluationTouch !== 'simple';

    const setRotation = v => onChange('rotation', v);
    const setProceso = (key, v) => onChange('procesos', { ...formValues.procesos, [key]: v });
    const setToque = (key, field, v) =>
        onChange('toques', { ...formValues.toques, [key]: { ...formValues.toques[key], [field]: v } });

    const togglePresence = key => {
        const current = formValues.toques[key];
        onChange('toques', { ...formValues.toques, [key]: { ...current, present: !current.present } });
    };

    const imgSrc = local.img?.data?.data
        ? arrayBufferToBase64(local.img.data.data, local.img.contentType || 'image/png')
        : null;

    const INPUT_CLS = 'w-full text-gray-800 border border-[#333] rounded-lg px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition-colors';
    const INPUT_SM_CLS = 'flex-1 text-gray-800 font-black border border-[#333] rounded-lg px-2 py-1.5 text-xs  text-center placeholder:text-gray-600 disabled:bg-[#dddddd] disabled:text-gray-700 focus:outline-none focus:border-emerald-500';
    const LABEL_CLS = 'text-[11px] font-semibold text-gray-600 uppercase tracking-wide';


    const renderTouchRow = (managerKey, label) => {
        const t = formValues.toques[managerKey];
        if (!t) return null;

        return (
            <div key={managerKey} className='flex items-center gap-2 py-2 border-b border-[#2a2a2a] last:border-0'>
                <input
                    type='checkbox'
                    checked={t.present}
                    onChange={() => togglePresence(managerKey)}
                    className='w-4 h-4 accent-emerald-500 shrink-0 cursor-pointer'
                />
                <span className={`text-xs min-w-[120px] ${t.present ? 'text-gray-200' : 'text-gray-600 line-through'}`}>
                    {label}
                </span>

                {isDetailedTouch ? (
                    <>
                        <input type='number' placeholder='1ros' disabled={!t.present}
                            value={t.present ? (t.primeros ?? '') : ''}
                            onChange={e => setToque(managerKey, 'primeros', e.target.value)}
                            className={INPUT_SM_CLS} />
                        <input type='number' placeholder='otros' disabled={!t.present}
                            value={t.present ? (t.otros ?? '') : ''}
                            onChange={e => setToque(managerKey, 'otros', e.target.value)}
                            className={INPUT_SM_CLS} />
                    </>
                ) : (
                    <input type='number' placeholder={t.present ? 'toques' : 'ausente'} disabled={!t.present}
                        value={t.present ? (t.total ?? '') : ''}
                        onChange={e => setToque(managerKey, 'total', e.target.value)}
                        className={INPUT_SM_CLS} />
                )}
            </div>
        );
    };

    const buildTouchList = () => {
        if (managers && managers.length > 0) {
            return [
                ...gerentes.map(m => ({ key: `${m.burden}_${m.name}`, label: `${m.burden} ${m.name}` })),
                ...asistentes.map(m => ({ key: `${m.burden}_${m.name}`, label: `${m.burden} ${m.name}` })),
            ];
        }
        const list = [];
        for (let i = 0; i < (touchs?.totalManager || 0); i++)
            list.push({ key: `Gerente_${i + 1}`, label: `Gerente ${i + 1}` });
        for (let i = 0; i < (touchs?.totalAttendee || 0); i++)
            list.push({ key: `Asistente_${i + 1}`, label: `Asistente ${i + 1}` });
        return list;
    };

    const touchList = buildTouchList();


    return (
        <div
            className='border border-[#2a2a2a] rounded-xl overflow-hidden shadow-lg'
            style={{ order: local.order ?? 0 }}
        >
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className='bg-gradient-to-r from-emerald-900 to-emerald-800 px-4 py-3 flex items-center justify-between gap-3'>
                <h3 className='text-sm font-bold text-white truncate'>{local.name}</h3>
                {imgSrc && (
                    <img src={imgSrc} alt={local.name}
                        className='w-8 h-8 rounded-md object-cover bg-white/10 shrink-0' />
                )}
            </div>

            <div className='p-4 flex flex-col gap-4'>

                {/* ── Rotaciones ───────────────────────────────────────── */}
                <div>
                    <label className={LABEL_CLS}>Nº de rotaciones</label>
                    <input className='text-zinc-950.' type='number' min='0'
                        value={formValues.rotation ?? ''}
                        onChange={e => setRotation(e.target.value)}
                        className={`${INPUT_CLS} mt-1`} />
                </div>

                {/* ── Procesos ─────────────────────────────────────────── */}
                {dishMenu && (
                    <div className='w-full'>
                        <p className={`${LABEL_CLS} mb-2`}>Procesos</p>

                        {dishMenu.dishEvaluation === 'simple' ? (
                            <div>
                                <label className='text-xs text-gray-400'>
                                    Nº de procesos {dishMenu.mainDish?.toLowerCase()}
                                </label>
                                <input type='number' min='0'
                                    value={formValues.procesos.platoFuerte ?? ''}
                                    onChange={e => setProceso('platoFuerte', e.target.value)}
                                    className={`${INPUT_CLS} mt-1`} />
                            </div>
                        ) : (
                            <div className='flex flex-col gap-2 w-full'>
                                {[
                                    { key: 'entrada', label: dishMenu.appetizer || 'Entrada' },
                                    { key: 'platoFuerte', label: dishMenu.mainDish || 'Plato fuerte' },
                                    { key: 'postre', label: dishMenu.dessert || 'Postre' },
                                ].map(({ key, label }) => (
                                    <div className='w-full' key={key}>
                                        <label className='text-[10px] text-gray-500'>{label}</label>
                                        <input type='number' min='0'
                                            value={formValues.procesos[key] ?? ''}
                                            onChange={e => setProceso(key, e.target.value)}
                                            className={`${INPUT_SM_CLS} w-full mt-0.5`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Toques de gerente ────────────────────────────────── */}
                {touchList.length > 0 && (
                    <div className='w-full'>
                        <p className={`${LABEL_CLS} mb-1`}>Toques de gerente</p>
                        {isDetailedTouch && (
                            <div className='flex items-center gap-2 py-1 mb-1'>
                                <span className='w-4 shrink-0' />
                                <span className='text-[9px] text-gray-600 min-w-[120px]'>Manager</span>
                                <span className='flex-1 text-[9px] text-gray-600 text-center'>1ros toques</span>
                                <span className='flex-1 text-[9px] text-gray-600 text-center'>Otros toques</span>
                            </div>
                        )}
                        {touchList.map(({ key, label }) => renderTouchRow(key, label))}
                    </div>
                )}
            </div>
        </div>
    );
}

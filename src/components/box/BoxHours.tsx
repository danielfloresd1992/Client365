import { FaTrashAlt, FaMoon } from 'react-icons/fa';

interface Hour {
    start: string;
    end: string;
}

interface Item {
    key: string;
    hours: Hour;
    type?: 'analytical' | 'perimeter';
}

interface BoxHoursProps {
    arr: Item[];
    deleteHour: (key: string) => void;
    /** Si viene, la tarjeta del rango es clickeable y abre el formulario de edición. */
    onEdit?: (item: Item) => void;
}

// Paleta por tipo de monitoreo
const TYPE_META = {
    analytical: { label: 'Analítico',  bg: '#ecfdf5', color: '#047857', ring: '#a7f3d0' },
    perimeter:  { label: 'Perimetral', bg: '#fff7ed', color: '#c2410c', ring: '#fed7aa' },
} as const;

/** Duración en horas contemplando el corrido (fin ≤ inicio → cruza medianoche). */
function durationHours(start: string, end: string): number {
    const s = Number(String(start).split(':')[0]) || 0;
    const e = Number(String(end).split(':')[0]) || 0;
    return e > s ? e - s : (24 - s) + e;
}

/** "07:00:00" → "07:00" */
const hhmm = (t: string) => String(t ?? '').slice(0, 5);


export default function BoxHours({ arr, deleteHour, onEdit }: BoxHoursProps): JSX.Element {
    return (
        <>
            {arr.map((item, index) => {
                const meta      = TYPE_META[item.type ?? 'analytical'] ?? TYPE_META.analytical;
                const hours     = durationHours(item.hours.start, item.hours.end);
                const overnight = hhmm(item.hours.end) <= hhmm(item.hours.start);

                return (
                    <div
                        key={index}
                        onClick={onEdit ? () => onEdit(item) : undefined}
                        title={onEdit ? 'Editar rango' : undefined}
                        className={`w-[90%] rounded-lg flex flex-col gap-1.5 p-2.5 ${onEdit ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        style={{
                            minHeight: `${Math.max(hours * 22, 64)}px`,
                            background: meta.bg,
                            border: `1px solid ${meta.ring}`,
                        }}
                    >
                        {/* Tipo + eliminar */}
                        <div className='flex items-center justify-between'>
                            <span
                                className='inline-flex items-center gap-1 rounded-full px-2 py-[1px] text-[10px] font-bold'
                                style={{ color: meta.color, background: '#ffffffcc', border: `1px solid ${meta.ring}` }}
                            >
                                {meta.label}
                                {overnight && <FaMoon size={8} title='Horario corrido' />}
                            </span>

                            <button
                                type='button'
                                title='Eliminar rango'
                                onClick={e => { e.stopPropagation(); deleteHour(item.key); }}
                                className='text-slate-400 hover:text-red-500 transition-colors'
                            >
                                <FaTrashAlt size={12} />
                            </button>
                        </div>

                        {/* Horas */}
                        <div className='text-[13px] font-bold text-slate-800 leading-none'>
                            {hhmm(item.hours.start)} <span className='text-slate-400 font-normal'>–</span> {hhmm(item.hours.end)}
                        </div>

                        {/* Total */}
                        <div className='text-[11px] text-slate-500'>
                            {hours} h{overnight ? ' · corrido' : ''}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
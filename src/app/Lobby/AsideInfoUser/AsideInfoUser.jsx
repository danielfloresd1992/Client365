import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ListUser from './ListAppManager';
import ListUserExpress from './ListExpress';
import Image from 'next/image';
import { FiFilter, FiX } from 'react-icons/fi';



export default function AsideInfoUser({ onApplyPublicationFilter, onClearPublicationFilter }) {

    const establishments = useSelector(state => state.clients) || [];
    const [dateFrom, setDateFrom] = useState('');
    const [dateUntil, setDateUntil] = useState('');
    const [establishmentId, setEstablishmentId] = useState('');
    const [filterError, setFilterError] = useState('');

    const selectedEstablishment = useMemo(() => {
        return establishments.find(item => item?._id === establishmentId || item?.id === establishmentId);
    }, [establishments, establishmentId]);

    const applyFilter = () => {
        if (!dateFrom || !dateUntil) {
            setFilterError('Selecciona fecha desde y hasta.');
            return;
        }

        if (new Date(`${dateFrom}T00:00:00`) > new Date(`${dateUntil}T23:59:59`)) {
            setFilterError('La fecha desde no puede ser mayor que hasta.');
            return;
        }

        setFilterError('');
        if (typeof onApplyPublicationFilter === 'function') {
            onApplyPublicationFilter({
                dateFrom,
                dateUntil,
                establishmentId,
                establishmentName: selectedEstablishment?.name || ''
            });
        }
    };

    const clearFilter = () => {
        setDateFrom('');
        setDateUntil('');
        setEstablishmentId('');
        setFilterError('');
        if (typeof onClearPublicationFilter === 'function') onClearPublicationFilter();
    };


    return (
        <aside className='componentAside border10 contentStatic'>
            <div className='aside-contents lobby-aside-filterSection'>
                <div className='lobby-aside-filterBox'>
                    <p className='lobby-aside-filterTitle'>Filtro de publicaciones</p>

                    <label className='lobby-aside-filterField'>
                        <span>Desde</span>
                        <input
                            type='date'
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className='lobby-aside-filterInput'
                        />
                    </label>

                    <label className='lobby-aside-filterField'>
                        <span>Hasta</span>
                        <input
                            type='date'
                            value={dateUntil}
                            onChange={(e) => setDateUntil(e.target.value)}
                            className='lobby-aside-filterInput'
                        />
                    </label>

                    <label className='lobby-aside-filterField'>
                        <span>Establecimiento (opcional)</span>
                        <select
                            value={establishmentId}
                            onChange={(e) => setEstablishmentId(e.target.value)}
                            className='lobby-aside-filterInput'
                        >
                            <option value=''>Todos</option>
                            {
                                establishments.map((item, index) => (
                                    <option key={item?._id || item?.id || index} value={item?._id || item?.id || ''}>
                                        {item?.name}
                                    </option>
                                ))
                            }
                        </select>
                    </label>

                    <div className='lobby-aside-filterActions'>
                        <button className='lobby-aside-filterBtn lobby-aside-filterBtn--apply' onClick={applyFilter}>
                            <FiFilter size={14} />
                            Aplicar
                        </button>
                        <button className='lobby-aside-filterBtn lobby-aside-filterBtn--clear' onClick={clearFilter}>
                            <FiX size={14} />
                            Quitar filtro
                        </button>
                    </div>

                    {
                        filterError && <p className='lobby-aside-filterError'>{filterError}</p>
                    }
                </div>
            </div>

            <div className='aside-contents lobby-aside-connected'>
                <div className='usersContain lobby-aside-usersContain'>
                    <div className='lobby-title-row lobby-title-row--compact __width-complete __center_center __border-sub'>
                        <div className='lobby-title-icon lobby-title-icon--compact'>
                            <Image width={16} height={16} alt='ico-global' src='/img/global-50.png' />
                        </div>
                        <p className='usersContain-title lobby-title-text'>Conectados · App Manager</p>
                    </div>
                    <ListUser />
                </div>
            </div>
            <div className='aside-contents lobby-aside-connected'>
                <div className='usersContain lobby-aside-usersContain'>
                    <div className='lobby-title-row lobby-title-row--compact __width-complete __center_center __border-sub'>
                        <div className='lobby-title-icon lobby-title-icon--compact'>
                            <Image width={16} height={16} alt='ico-global' src='/img/global-50.png' />
                        </div>
                        <p className='usersContain-title lobby-title-text'>Conectados · Express</p>
                    </div>
                    <ListUserExpress />
                </div>
            </div>
        </aside>
    );
}
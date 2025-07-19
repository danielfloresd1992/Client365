'use client';
import { useState, memo } from 'react';
import Table from '@/components/tablet_component/Table.jsx';
import CellClient from './assets/CellClient';
//mport getListClient from '@/libs/ajaxServer/getListClient';
import ItenCellClien from './assets/ItenCellClien';

import { useSingleFetch } from '@/hook/ajax_hook/useFetch';




function TabletClient() {


    const { data, fetchData, loading } = useSingleFetch({ resource: '/localLigth', method: 'get' }, true);


    if (loading) return null;


    return (
        <Table dataHead={['Número', 'Orden de apilamiento', 'Nombre', 'Logo', 'Horario', 'Manager', 'Configuración de plato']} >
            {
                data.map((item, index) => (
                    <tr style={{ order: item.order }} key={index} >
                        <CellClient data={item} index={index} />
                    </tr>
                ))
            }
            <ItenCellClien />
        </Table>
    );
}


export default memo(TabletClient)
'use client';
import { useSelector } from 'react-redux';
import CellClient from './CellClient';


export default function ItenCellClien(){

    const newEstablishment = useSelector(state => state.newEstablishment);

    
    return(
        newEstablishment.map((establishment, index) => (
            <tr style={{ order: establishment.order }} key={ index } >
                <CellClient data={ establishment } index={ index }/>
            </tr>
        ))
    );
}
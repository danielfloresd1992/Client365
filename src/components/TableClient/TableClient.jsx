import Table from '@/components/tablet_component/Table.jsx';
import CellClient from './assets/CellClient';
import getListClient from '@/libs/ajaxServer/getListClient';
import ItenCellClien from './assets/ItenCellClien';



export default async function TabletClient(){

    const listClient = await getListClient(true);

    return(
        <Table dataHead={[ 'Número', 'Orden de apilamiento', 'Nombre', 'Logo', 'Horario', 'Manager', 'Configuración de plato' ]} >
            {
                listClient.map((item, index) => (
                    <tr style={{ order: item.order }} key={ index } >
                        <CellClient data={ item } index={ index }/> 
                    </tr> 
                ))
            } 
            <ItenCellClien />
        </Table>
    );
}
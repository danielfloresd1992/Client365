
import Aside from './assets/BannerConaint';
import ListClients from '@/components/TableClient/list_client';
import FormComponent from './assets/FormComponent';


export default function Content() {


    return (
        <>
            <Aside />
            <div className='w-[calc(100%-256px)] h-full overflow-y-scroll'>
                <ListClients />
            </div>

            <FormComponent />
        </>
    );
}
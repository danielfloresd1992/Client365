
import Aside from './assets/BannerConaint';
import TabletClient from '@/components/TableClient/TableClient';
import FormComponent from './assets/FormComponent';


export default function Content() {


    return (
        <>
            <Aside />
            <div className='w-[calc(100%-256px)] h-full overflow-y-scroll'>
                <TabletClient />
            </div>

            <FormComponent />
        </>
    );
}
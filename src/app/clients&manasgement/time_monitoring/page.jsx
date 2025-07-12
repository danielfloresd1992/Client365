import { Suspense } from 'react';
import Layautbody from './assets/layautBody';


export default function page(){


    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <Layautbody />
        </Suspense>
    );
}
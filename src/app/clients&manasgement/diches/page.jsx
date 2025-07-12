import { Suspense } from 'react';
import Layautbody from './assests/layautBody.jsx';


export default function Page() {

    return(
        <Suspense fallback={<div>Cargando...</div>}>
            <Layautbody />
        </Suspense>
    );  
}
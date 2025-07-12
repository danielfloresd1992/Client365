'use client';
import { useSelector, useDispatch } from 'react-redux';
import { setTypeForm } from '@/store/slices/typeForm';

import FormFranchise from './FormFranchise';
import FormClient from './FormClient';
import ButtonRadiusBack from '@/components/buttons/ButtonRadiusBack';



export default function FormComponent(){

    const dispatch = useDispatch();
    const typeForm = useSelector(state => state.typeForm);



    const printTypeForm = typeForm => {
        'use client';
        if(typeof typeForm === 'string'){
            if(typeForm === 'create-franchise') return <FormFranchise />
            else if(typeForm === 'create-client') return <FormClient />
        }
        else if(typeof typeForm === 'object'){

            if(typeForm.type === 'diches') return// <FormDiche client={ typeForm.data } id={ typeForm.idData } />
            if(typeForm.type === 'create-client') return <FormClient id={ typeForm.idData } action={ closeWindows } />
        }  
    };


    const closeWindows = () => {
        dispatch(setTypeForm(null));
    };
    

    return(
        typeForm ? 
        (
            <div className='boxModal-Component __starForm scrolltheme1 __padding4rem'>
                
                {
                    printTypeForm(typeForm)
                }
                <div
                    style={{ position: 'fixed', top: '80px', right: '40px', zIndex: '100' }}
                >
                    <ButtonRadiusBack action={ closeWindows } />
                </div>
            </div>
        )
        :
        (
            null
        )
    );
}
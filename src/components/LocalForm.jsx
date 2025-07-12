'use client';
import { useEffect, useState } from 'react';
import useAxios from '../../libs/useAxios';
import IP from '../../../public/utils/dataFecth';
import { arrayBufferToBase64 } from '../../../public/utils/arrayTo64';


export default function LocalForm({ data }){

    const { requestAction } = useAxios();
    const [ localState, setLocalState ] = useState(null);
   

    useEffect(() => {
        requestAction({ url: `https://${IP}/local&manager/id=${ data._id }`, action: 'GET' })
            .then(response => {
                if(response.status === 200){
                    setLocalState(response.data);
                }
            })
            .catch(err => {
                console.log(err);

            });
    }, []);


    return(
        localState && localState.typeMonitoring === 'completo' ? 
        (
            <div className='form-corte-inputContain' style={{ padding: '.5rem', width: '100%' }}>
                <div className='__align-center' style={{ justifyContent: 'space-between' }}>         
                    <p  className='divContentNovelties-pTitle __text__oneLine'>{ localState.name }</p>
                    <img 
                        className='divContentNovelties-img' 
                        src={ arrayBufferToBase64( localState.img.data.data, 'image/png' ) }
                    />
                </div>
                <hr />
               
                <label classsName htmlFor='rotation'>
                    <p>Nº de rotaciones</p>
                    <input
                        className='form-input'
                        type='number'
                        id='rotation'
                    />
                </label>
            </div>
        )
        :
        (
            null
        )        
    );
}
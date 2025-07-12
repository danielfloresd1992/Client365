'use client';
import { useContext, useEffect, useState } from 'react';
import { ImgContext } from '@/contexts/imgContext';



export default function ZoomImg(){


    const { src, closeImg } = useContext(ImgContext);
    const [ zoom, setZoom ] = useState(50);
    
    useEffect(() => {
        src ? document.body.style.overflow = 'hidden': document.body.style.overflow = 'auto';
    }, [ src ]);


    

    return(
        <div 
            className={ 'boxModal-Component __boxModal-Component-imgZoom scrolltheme1' }
            style={ { display: src ?  'flex' : 'none' }}
            onClick={ e => {
                    console.log(e.target.className);
                    if(e.target.className === 'boxModal-Component __boxModal-Component-imgZoom scrolltheme1') closeImg();
                } 
            }
        >
            <label className='label-zoom'>
                Zoom
                <input 
                className='label-zoom-input drag'
                type='range' 
                value={ zoom }
                min='40' 
                max='200' 
                step={ 1 }
                
                onChange={ e => {
                    console.log(e.target.value);
                        setZoom(e.target.value) 
                    }
                }
                />
            </label>                                                                                                                                                
               
            <img 
                
                src={ src } 
                draggable={ false }
                style={{ width : '50%', width: `${ zoom }%` }} 
            />
              
        </div>
    )
}
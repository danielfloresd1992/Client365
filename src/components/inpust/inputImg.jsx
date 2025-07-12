'use cluent';
import { isMobile } from 'react-device-detect';
import { useState, useEffect, useRef } from 'react';
import compressAndReadImg from '@/libs/compressAndReadImg';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';

export default function InputImg({ maxCount = 3, setImg = null }){

    const [ arrImgState, setArrImgState ] = useState([]);
    const dispatch = useDispatch();
    const previewRef = useRef(null);


    useEffect(() => {

        setImg( arrImgState );

    }, [ arrImgState ])

    const prevent = e => {
        e.preventDefault();
    };


    const catchFile = file => {
        compressAndReadImg(file, 0.6,(data, err) => {
            if(err){
                let msm = null;
                typeof err === 'string' ? msm  = err : msm = 'algo a salido mal';
                dispatch(setConfigModal(
                    {
                        modalOpen: true,
                        title: 'Error',
                        description: err,
                        isCallback: null,
                        type: 'error'
                    }
                ));
            }
            else{
                if(arrImgState.length < maxCount){
                    data.name = new Date().getTime();
                    setArrImgState(state => state = [ data, ...state ]);
                    previewRef.current.src = data.result;
                }
                else{
                    setImg(arrImgState, `Máximo de imagenes el de ${maxCount}` )
                }
                
            }
        });
    };


    return(
        <div className='__center_center columns __oneGap'>
        
            <div
                className='zone-drop'
                onDragLeave={ prevent }
                onDragOver={ prevent }
                onDragStart={ prevent }
                onDragEnter={ prevent }
                onDrop={e => {
                    e.preventDefault();
                    catchFile(e.dataTransfer.files[0]);
                }}
                style={ isMobile ? { border: 'none' } : { border: 'dotted 2px #073066' } }
            >
                {
                    isMobile ?
                    (
                        null
                    )
                    :
                    (
                        <p>Arrastre una imagen aqui</p>
                    )
                }
                            
                <img 
                    ref={ previewRef }
                    className='zoneDrop-img' 
                />
            </div>
            {
                isMobile ?
                (
                    null
                )
                :
                (
                    <p className='__width-complete' style={{ textAlign: 'center' }}>o tambien</p>
                )
            }
        
            <label
                className='__width-complete __label'
                style={{ 
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'center',
                    padding: '.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                }}
            >   
                Seleccionar desde una ruta
            <input 
                style={{ display: 'none' }}
                type='file' 
                className='__input'
                onChange={e => catchFile(e.target.files[0])}
            />
            </label>
            {
               arrImgState.length > 0 ?
               (
                    <div className='__width-complete __flexRowFlex __oneGap'>
                        {
                            arrImgState.map((img, index)=> (
                                <img 
                                    className='__hoverDrop'
                                    src={ img.result } 
                                    tabIndex={0}
                                    alt='item' key={ index } 
                                    style={{ width: '60px' }} 
                                    onClick={() => { previewRef.current.src = img.result }} 
                                    onFocus={e => { e.target.style.outline = '2px solid #15d7aa' }}
                                    onBlur={e => { e.target.style.outline = 'none' } }
                                    onDoubleClick={e => {
                                        const arrFill = arrImgState.filter(imgFill => imgFill.name !== img.name);
                                        previewRef.current.src = arrFill.length > 0 ? arrFill[0].result : '';
                                        setArrImgState([ ...arrFill ]);
                                    }}
                               />
                            ))
                        }
                    </div>
               )
               :
               (
                    null
               )
            }
        </div>
    )
}
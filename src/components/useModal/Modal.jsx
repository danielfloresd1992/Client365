'use client';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeModal } from '@/store/slices/globalModal.js';



export default function Modal(){

    
    const selectModal = useSelector(state => state.modal);
    const dispatch = useDispatch()
 

    const close = () => {
        dispatch(closeModal());
    };


    const closeScroll = () => {
        //document.body.style.overflow = 'hidden';
    };


    const openScroll = () => {
        //document.body.style.overflow = 'auto';
    };


    const returnHeaderModal = typeAlert => {
        if(selectModal.modalOpen) closeScroll();

        if(typeAlert === 'error'){
            return(
                <>
                    <img src='data:image/png;base64,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' style={{ width: '60px' }} />
                    <h2 style={{ color: '#8f8f8f', textAlign: 'center' }}>{ selectModal.title }</h2>
                </>
            )
        }
        else if(typeAlert === 'warning'){
            return(
                <>
                    <img src='data:image/png;base64,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' style={{ width: '60px' }} />
                    <h2 style={{ color: '#8f8f8f', textAlign: 'center' }}>{ selectModal.title }</h2>
                </>
            )
        }
        else if(typeAlert === 'successfull'){
            return(
                <>
                    <img src='data:image/png;base64,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' style={{ width: '60px' }} />
                    <h2 style={{ color: '#8f8f8f', textAlign: 'center' }}>{ selectModal.title }</h2>
                </>
            )
        }
        else if(typeAlert === 'close_session'){
            return(
                <>
                    <img src='data:image/png;base64,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' style={{ width: '60px' }} />
                    <h2 style={{ color: '#8f8f8f', textAlign: 'center' }}>{ selectModal.title }</h2>
                </>
            )
        }
        else if(typeAlert === 'await'){
            return(
                <>
                    <div className='lds-spinner'><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                    <h2 style={{ color: '#8f8f8f', textAlign: 'center' }}>{ selectModal.title }</h2>
                </>
            )
        }
        else if(typeAlert === 'exit'){
            if(typeof selectModal.isCallback !== 'function') throw new Error('extrictly are one function to method isCallback')
            return(
                <>
                    <img src='data:image/png;base64,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' style={{ width: '60px' }} />
                    <h2 style={{ color: '#8f8f8f', textAlign: 'center' }}>{ selectModal.title }</h2>

                    <div className='boxModal-contentItems'>
                        <p className='boxModal-description'>{ selectModal.description }</p>
                    </div>
                    <div className='boxModal-contentItems'>
                        <button
                            className='btn-item'
                            onClick={ () => {
                                selectModal.isCallback();
                                openScroll();
                                close();
                            }}
                        > Aceptar 
                        </button>
                    </div>
                </>
            )
        }
        else{
            
            openScroll();
          
        }
    };


    return(
      
        <div className='boxModal-Component' style={ selectModal.modalOpen ?  { display: 'flex' } : { display: 'none' } }>
            <div className='boxModal' style={ selectModal.type === 'await' ? { justifyContent: 'center' } : { justifyContent: 'space-between' }}>
                <div className='boxModal-contentItems'>
                    <div className='boxModal-headerItems'>
                        {
                            returnHeaderModal(selectModal.type)
                        }
                    </div>
                </div>
                {
                    selectModal.type === 'await'  || selectModal.type === 'exit'?
                        (
                            null
                        )
                        :
                        (
                            <>
                                <div className='boxModal-contentItems'>
                                    <p className='boxModal-description'>{ selectModal.description }</p>
                                </div>
                                <div className='boxModal-contentItems'>
                                    {
                                        typeof selectModal.isCallback === 'function' ? 
                                        (
                                            <>
                                                <button
                                                    className='btn-item'
                                                    onClick={ () => {
                                                        selectModal.isCallback();
                                                        openScroll();
                                                        close();
                                                    }}
                                                > Aceptar 
                                                </button>
                                                <button
                                                    className='btn-item'
                                                    onClick={ () => {
                                                        close();
                                                        openScroll();
                                                    }}
                                                    style={{ backgroundColor: '#afafaf' }}
                                                > Cancelar 
                                                </button>
                                            </>
                                        )
                                        :
                                        (
                                            <button
                                                className='btn-item'
                                                onClick={ () => {
                                                    close();
                                                    openScroll();
                                                }}
                                            > Cerrar
                                            </button>
                                        )
                                    }
                                </div>
                            </>
                        )
                }
            </div>
        </div>
    );
}

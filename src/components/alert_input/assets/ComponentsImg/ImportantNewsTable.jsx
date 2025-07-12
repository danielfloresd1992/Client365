'use client';
import { useEffect, useRef, useCallback } from 'react';
import {  useSelector, useDispatch } from 'react-redux';
import { toJpeg } from 'html-to-image';
import groupedNewsByEstablishment from './groupNovelty';
import { removeItemFromToArray } from '@/store/slices/dateNoveltyForList';
import getCurrentTime from '@/libs/getCurrentTime';
import sendTextJarvis from '@/libs/sendMsmJarvis';
import GROUP_KEY from '@/libs/API_JARVIS';



export default function ImportantNewsTable({ data }){

    const shitfDate = useSelector(state => state.alertLiveDate);
    const dispatch = useDispatch();
    const groupNovelty = groupedNewsByEstablishment(data);
    const sectionHtmlRef = useRef(null);
    let key = useRef(true);

    
    useEffect(() => {
        createImg();
    }, [  ]);



    const createImg = useCallback(() => {
        toJpeg(sectionHtmlRef.current)
            .then(image => {
                if(key.current){
                    key.current = false;
                    sendTextJarvis(`*Indicadores de novedades*\n${data.dataEstablishment.name}\nTurno: ${ shitfDate?.shift }\nNota: En fase Beta`, GROUP_KEY  , false, null, image )
                        .then(response => {
                        })
                        .catch(err => {
                            console.log(err);
                        })
                        .finally(() => {
                            dispatch( removeItemFromToArray(data.dataEstablishment.idCreate) );
                        });
                }
            })
            .catch(err => {
                console.log(err);
            })
    }, [ shitfDate ]);


    return(
        <div 
            ref={ sectionHtmlRef }
            className='bgWhite'
            style={{
                width: '450px'
            }}
        >
            <div 
                style={{
                    width : '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'

                }}
            >
                <p>{ groupNovelty.dataEstablishment.name } { getCurrentTime() }</p>
            </div>
            <div className='__width-complete'>
               <p>Devolución de plato: { groupNovelty.data['Posible devolución de plato'] ? groupNovelty.data['Posible devolución de plato'].count : 0 }</p>
               <p>Devolución de bebida: { groupNovelty.data['Posible devolución de bebida'] ? groupNovelty.data['Posible devolución de bebida'].count : 0 }</p>
               <p>Devolución de postre: { groupNovelty.data['Posible devolución de postre'] ? groupNovelty.data['Posible devolución de postre'].count : 0 }</p>
               <p>Devolución de pedido: { groupNovelty.data['Posible devolución de pedido'] ? groupNovelty.data['Posible devolución de pedido'].count : 0 }</p>
               <p>Demora de primera atención: { groupNovelty.data['Demora de primera atención'] ? groupNovelty.data['Demora de primera atención'].count : 0 }</p>
               <p>Demora de limpieza: { groupNovelty.data['Demora de limpieza'] ? groupNovelty.data['Demora de limpieza'].count : 0 }</p>
            </div>
        </div>
    )
}
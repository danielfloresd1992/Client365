'use client';
import {  useEffect ,useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import getRportLiveRequest from '@/libs/ajaxServer/getRportLiveRequest';
import { setReportForImg } from '@/store/slices/alertLiveStoreForImg';



export default function BannerConfigAlert(){

    
    const isAdminSession = useSelector(state => state.isAdminSession);
    const reportAlertDate = useSelector(state => state.alertLiveDate);
    const reportAlertLiveState = useSelector(state => state.reportAlertLive);
    const dispatch = useDispatch();
    const bannerRef = useRef(null);
    const idMowRef = useRef(false);
    const offSetPosition = useRef({
        offsetLeft: 0, 
        offsetTop: 0
    });


    const goalDay = reportAlertDate?.goalDay;
    const alertCount = reportAlertLiveState?.reduce((total, item) => { return item?.line !== 'P' && typeof item.alert === 'number' ? total + item.alert : total}, 0)
    const important = reportAlertLiveState?.reduce((total, item) => { return item.important ? total + item.important : total}, 0);
    const failed = reportAlertLiveState?.reduce((total, item) => { return item.failed ? total + 1 : total}, 0);




    useEffect(() => {
        if(!isAdminSession){
            bannerRef.current.parentNode.parentNode.style.height = '40px';
            bannerRef.current.parentNode.parentNode.style.overflow = 'hidden';
        }
    }, [isAdminSession]);

    

    const handlerOnClickRequest = () => {
        getRportLiveRequest()
            .then(response => {
                dispatch(setReportForImg(response.data));
            })
            .catch(err => {
                console.log(err);
            });
    }


    return(
        <div className='header __wrap'
            style={{  cursor: 'move', top: 'unset', width: '570px',height: 'unset', left: 'unset', backgroundColor: 'rgb(115 116 117)' }}
            ref={ bannerRef }
            id='banner-3030'
            onMouseDown={e => {
                if(e.target.id === 'banner-3030'){
                    
                }
                idMowRef.current = true;
                    offSetPosition.current.offsetLeft = e.target.parentNode.parentNode.offsetLeft - e.clientX + 5;
                    offSetPosition.current.offsetTop = e.target.parentNode.parentNode.offsetTop - e.clientY + 5;
            }}
            onMouseUp={e => {
                idMowRef.current = false;
            }}
            onMouseLeave={e => {
                idMowRef.current = false;
            }}
            onMouseMove={e => {
                if(e.target.id === 'banner-3030'){
                    if(idMowRef.current){
                        e.target.parentNode.parentNode.style.left = `${ offSetPosition.current.offsetLeft + e.clientX }px`;
                        e.target.parentNode.parentNode.style.top = `${ offSetPosition.current.offsetTop + e.clientY }px`;
                    }
                }
            }}
        >
            <div 
                className='__center_center __never-draggable'
                style={{  justifyContent: 'space-between', width: '80%'}}
            >
                <h4 className='t-white __never-draggable'>Reporte de alertas</h4>
                <div className='__center_center __never-draggable'>
                    
                </div>
            </div>
            <div 
                    className='__flexRowFlex __oneGap'
                    style={{ padding: '.2rem 0 0 0', zIndex: '20000' }}
                >
                    <button 
                        className='__pointer'
                        style={{  }}
                        title='Generar reporte'
                        onClick={ handlerOnClickRequest }
                    >
                        <img className='__never-pointer' style={{width: '20px' }} src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAyUlEQVR4nO3UsU4CURCF4duBoSD0WKGdLwc+hiIPRG2C76AEKBYjtfVnNk7lks2u3NvxV5u9yTnJzJ9J6UppMMQKR1R4qf/lLFhpssxZcIzQOR7juypRsMhegBtsz4zoKUf4COsI/MZXLPkZg4tswBivEX7AfTYbMMFbvO8wu8SGNt4x7RQeBfVY/trQxgdu+xQsu9jgd0SbeN/jrmvBMEqqVhtSY8n1aB9SbjQ1PWW/RRjELoreos/St6gqdov62Pdv9LDvSjrHD3ImK1d4iq3tAAAAAElFTkSuQmCC' alt="" />
                    </button>

                    <button 
                        className='__pointer'
                        title='Minimizar'
                        onClick={e => {
                            if(e.target.parentNode.parentNode.parentNode.parentNode.style.height === '40px'){
                                e.target.parentNode.parentNode.parentNode.parentNode.style.height = 'auto';
                                e.target.parentNode.parentNode.parentNode.parentNode.style.overflow = 'auto';
                                
                            }
                            else{
                                e.target.parentNode.parentNode.parentNode.parentNode.style.height = '40px';
                                e.target.parentNode.parentNode.parentNode.parentNode.style.overflow = 'hidden';
                            }
                            
                        }}
                    >
                        <img className='__never-pointer' style={{width: '20px' }} src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA3klEQVR4nO3ZsRGCQBCF4SsDtCRsBywA28JAKhINNPqdczZgGANghOX0ffly73hEbAgi8ruAA9AAd9Z3s7OLueFPbEc9581HD6AE8rAyILezn5ZlfBPA2YbKRVOOABwtSzNlKH5/URacAZll6aYMvYWNYGoeXeDLUAPOUAPOUAPOUAPOUAPOUAPOUAPOUAPOUAPOUAPOUAMGaFlem/oFLotdwAv/eIHOZlb/rT4E7C3LNYxlm5GoCon+Xi96C44K2C2a8oN4poWfvuCwB9SkumIaNNH0Fh7pLPlEJCThBQcjVFwbYHs1AAAAAElFTkSuQmCC' alt="" />
                    </button>
                </div>
            <div className='__width-complete __never-draggable flex __oneGap' style={{ height: '30px', display: 'flex', alignItems: 'center',     justifyContent: 'space-between' }}>
                {
                    reportAlertLiveState ? 
                        <>  
                             {
                                goalDay ?
                                    <p style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }} className={ 't-white' }>Total: <b>{ alertCount }</b></p>
                                :
                                    <p style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }} className='t-white'>Total: { reportAlertLiveState?.reduce((total, item) => { return item?.line !== 'P' ? total + item.alert : total}, 0) }</p>
                             }
                            
                            <p style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }} className='t-white'>Resaltantes: { important }</p>
                            {
                                goalDay ?
                                    <p className='t-white __never-draggable'
                                        style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }}
                                        id='repeating-text'
                                    > 
                                        Meta: <b style={{ color: 'red' }}>{goalDay}</b>
                                    </p>
                                :
                                    null
                            } 
                            <p style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }} className='t-white'>Caido: { failed }</p>
                            <p className='t-white __never-draggable'
                                style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }}
                                id='repeating-text'
                            > 
                                Turno: {reportAlertDate?.shift}
                            </p>
                            <p className='t-white __never-draggable'
                                style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }}
                                id='repeating-text'
                            > 
                                fecha: {reportAlertDate?.date}
                            </p>
                        </>
                    :
                        null
                }
            </div>
        </div>
    )
}
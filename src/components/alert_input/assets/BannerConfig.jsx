'use client';
import { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import getRportLiveRequest from '@/libs/ajaxServer/getRportLiveRequest';
import { setReportForImg } from '@/store/slices/alertLiveStoreForImg';



export default function BannerConfigAlert() {


    const reportAlertDate = useSelector(state => state.alertLiveDate);
    const reportAlertLiveState = useSelector(state => state.reportAlertLive);
    const dispatch = useDispatch();
    const bannerRef = useRef(null);



    const goalDay = reportAlertDate?.goalDay;
    const alertCount = reportAlertLiveState?.reduce((total, item) => { return item?.line !== 'P' && typeof item.alert === 'number' ? total + item.alert : total }, 0)
    const important = reportAlertLiveState?.reduce((total, item) => { return item.important ? total + item.important : total }, 0);
    const failed = reportAlertLiveState?.reduce((total, item) => { return item.failed ? total + 1 : total }, 0);




    const handlerOnClickRequest = () => {
        getRportLiveRequest()
            .then(response => {
                dispatch(setReportForImg(response.data));
            })
            .catch(err => {
                console.log(err);
            });
    };


    return (
        <div className='relative p-[0_1rem] h-[30px] w-full bg-[rgb(105_191_127)] flex items-center justify-between'
            ref={bannerRef}
            id='banner-3030'
        >
            <div
                className=''
            >
                <h4 className='t-white'>Reporte de alertas</h4>
            </div>

            {
                goalDay ?
                    <p style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }} className={'t-white'}>Total: <b>{alertCount}</b></p>
                    :
                    <p style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }} className='t-white'>Total: {reportAlertLiveState?.reduce((total, item) => { return item?.line !== 'P' ? total + item.alert : total }, 0)}</p>
            }
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

            <div
                className='flex items-center justify-between gap-[.5rem]'

            >
                <button
                    className='__pointer'
                    style={{}}
                    title='Generar reporte'
                    onClick={handlerOnClickRequest}
                >
                    <img className='__never-pointer' style={{ width: '20px' }} src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAyUlEQVR4nO3UsU4CURCF4duBoSD0WKGdLwc+hiIPRG2C76AEKBYjtfVnNk7lks2u3NvxV5u9yTnJzJ9J6UppMMQKR1R4qf/lLFhpssxZcIzQOR7juypRsMhegBtsz4zoKUf4COsI/MZXLPkZg4tswBivEX7AfTYbMMFbvO8wu8SGNt4x7RQeBfVY/trQxgdu+xQsu9jgd0SbeN/jrmvBMEqqVhtSY8n1aB9SbjQ1PWW/RRjELoreos/St6gqdov62Pdv9LDvSjrHD3ImK1d4iq3tAAAAAElFTkSuQmCC' alt="" />
                </button>


            </div>
            {/*
 <div className='__width-complete __never-draggable flex __oneGap' style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {
                    reportAlertLiveState ?
                        <>
                            {
                                goalDay ?
                                    <p style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }} className={'t-white'}>Total: <b>{alertCount}</b></p>
                                    :
                                    <p style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }} className='t-white'>Total: {reportAlertLiveState?.reduce((total, item) => { return item?.line !== 'P' ? total + item.alert : total }, 0)}</p>
                            }

                            <p style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }} className='t-white'>Resaltantes: {important}</p>
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
                            <p style={{ fontSize: '.8rem', backgroundImage: '-moz-element(#text-to-repeat)' }} className='t-white'>Caido: {failed}</p>
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
            */}

        </div>
    )
}
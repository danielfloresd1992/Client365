'use client';
import AppManagerConfigStorange from '@/libs/script/app_manager_config_DB';
import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import InputBorderBlue from "@/components/inpust/InputBorderBlue";
import axiosStand from '@/libs/ajaxClient/axios.fetch';
import Img from '@/components/Img';
import { addReportForArr } from '@/store/slices/alertLiveStore';
import { addDateNoveltyForList } from '@/store/slices/dateNoveltyForList';
import socket from '@/libs/socket/socketIo';
import useAuthOnServer from '@/hook/auth';




export default function BoxClientInputs({ dataEstablishment = null, dataForRequest, isFailed, schedule, setSpeack }) {


    const isDaylightSavingTimeState = useSelector(state => state.isDaylightSavingTime);
    const isAdmindSession = useSelector(state => state.isAdminSession);
    const reportAlertLiveState = useSelector(state => state.reportAlertLive);
    const reportDateState = useSelector(state => state.alertLiveDate);

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;


    const dispatch = useDispatch();
    const boxContentRef = useRef(null);
    const isFiledEstablishment = isFailed.filter(data => data.idLocal === dataEstablishment._id);
    const textColorRef = useRef();

    const selectDataReport = reportAlertLiveState.length > 0 ? reportAlertLiveState.filter(data => data?.establishment?._id === dataEstablishment._id)[0] : null;


    useEffect(() => {   //actualiza desde otro clientes que actualizacen
        let isMount = true;
        const recibEventSocketEventHandler = data => {
            if (isMount) {

                const belongsToThisEstablishment = user && data.establishment._id === dataEstablishment._id && user._id !== data.editedBy.sessionId.split('-')[0];
                const isDocumentNow = user && data.document.date === dataForRequest.date && data.document.shift === dataForRequest.shift;

                if (belongsToThisEstablishment && isDocumentNow) {
                    dispatch(addReportForArr(data));
                }
            }
        };
        socket.on('update-report-alert-live', recibEventSocketEventHandler);
        return () => {
            socket.off('update-report-alert-live', recibEventSocketEventHandler);
            isMount = false;
        };
    }, [user, reportDateState]);



    useEffect(() => { //  update  failed establishment
        if (!user) return;
        if (user && reportAlertLiveState.length > 0) {
            setDataAlertLiveRequest({ ...selectDataReport, failed: isFiledEstablishment.length > 0 ? true : false })
        }
    }, [isFailed, user]);



    useEffect(() => {
        if (user && isAdmindSession && selectDataReport) {
            const line = AppManagerConfigStorange.get(`${dataEstablishment.name}`);
            if ((!(selectDataReport?.line)) && line) {
                const data = { ...selectDataReport, line: line };
                setDataAlertLiveRequest(data);
            }
        }
    }, [user, selectDataReport]);



    useEffect(() => {  //  bucle de activación de monitoreo
        let isMount = true;
        let loop;
        loop = setInterval(() => {
            const date = new Date();

            if (date.getHours() > 12 && date.getHours() < 23) {
                if (date.getMinutes() === 59 && date.getSeconds() === 0) {
                    setDateNoveltyForList();
                }
            }


            if (schedule.length > 0 && boxContentRef.current !== null && reportAlertLiveState.length > 0 && selectDataReport) {
                const dayRules = schedule[0].dayMonitoring.filter(date => date.dayMonitoring === new Date().getDay());
                let activateMonitoringBoolean = false;

                if (!isMount) return;
                let date = new Date();

                dayRules.filter(dateRule => {
                    const HOUR_START = Number(dateRule.hours.start.split(':')[0]) + Number(dateRule.hours.start.split(':')[1] / 60);
                    const HOUR_END = Number(dateRule.hours.end.split(':')[0]) + Number(dateRule.hours.end.split(':')[1]) / 60;
                    const dateLive = date.getHours() + date.getMinutes() / 60;
                    if (dateLive >= HOUR_START && dateLive < HOUR_END) activateMonitoringBoolean = true;
                });
                if (activateMonitoringBoolean) {   // si es activo
                    if (!boxContentRef.current.classList.contains('onMonitoring')) {
                        //    setSpeack(`Activar monitoreo en ${dataEstablishment.name}`)  
                        const data = { ...selectDataReport, monitoring: true };
                        textColorRef.current = '#000';
                        setDataAlertLiveRequest(data);

                    }
                }
                else {
                    if (boxContentRef.current.classList.contains('onMonitoring')) {  // si es inactivo
                        //  setSpeack(`Monitoreo finalizado en ${dataEstablishment.name}`);
                        const data = { ...selectDataReport, monitoring: false };
                        textColorRef.current = '#fff'
                        setDataAlertLiveRequest(data);
                    }
                }
            }
            else {
                if (schedule.length < 1 && selectDataReport) {
                    if (!selectDataReport?.noSetSchedule) {
                        const data = { ...selectDataReport, noSetSchedule: 'sin definir' }
                        setDataAlertLiveRequest(data);
                    }
                }
            }
        }, 1000);

        return () => {
            isMount = false;
            clearInterval(loop);
        }
    }, [schedule, isDaylightSavingTimeState, reportAlertLiveState, selectDataReport]);



    const setDataAlertLiveRequest = useCallback(async dataStablishment => {
        try {
            if (isAdmindSession) {
                if (!dataStablishment.establishment._id) return;
                const monitoring = typeof dataStablishment.monitoring === 'boolean' ? `&monitoring=${dataStablishment.monitoring}` : '';
                const noSetSchedule = dataStablishment.noSetSchedule ? `&noSetSchedule=${dataStablishment.noSetSchedule}` : ''
                const lineBelonging = dataStablishment.line ? `&line=${dataStablishment.line}` : '';
                const dvrFailedBoolean = typeof dataStablishment.failed === 'boolean' ? `&failed=${dataStablishment.failed}` : '';
                const alert = dataStablishment.alert ? `&alert=${dataStablishment.alert}` : '';
                const important = dataStablishment.important ? `&important=${dataStablishment.important}` : '';
                const url = `/alertNoveltie/recordsLive?date=${reportDateState.date}&shift=${reportDateState.shift}&id=${dataStablishment.establishment._id}${alert}${important}${lineBelonging}${dvrFailedBoolean}${monitoring}${noSetSchedule}`;
                const response = await axiosStand.put(url);
                if (response.status === 200) dispatch(addReportForArr(dataStablishment));
            }
        }
        catch (error) {
            console.log(error);
        }
    }, [reportAlertLiveState, isAdmindSession]);



    useEffect(() => {
        //setDateNoveltyForList();
    }, []);


    const setDateNoveltyForList = useCallback(async () => {
        try {
            const date = `${(0 + '' + (new Date().getMonth() + 1)).substr(-2)}-${(0 + '' + (new Date().getDate())).substr(-2)}-${(new Date().getFullYear())}`;
            if (dataEstablishment?.franchise === 'La Francisca' && isAdmindSession) {
                const shift = dataForRequest.shift === 'diurno' ? 'day' : dataForRequest.shift === 'noctunro' ? 'night' : null;
                const response = await axiosStand(`/noveltie/new?establishmentName=${dataEstablishment.name}&since=${date}&shift=${shift}`);
                if (response.status === 200) dispatch(addDateNoveltyForList({ dataEstablishment: { ...dataEstablishment, idCreate: Date.now() }, data: response.data }));
            }

        }
        catch (error) {
            console.log(error);
        }
    }, [dataEstablishment, isAdmindSession, dataForRequest]);



    return (
        reportAlertLiveState.filter(data => data?.establishment?._id === dataEstablishment._id).length > 0 ?
            <div
                className={`flex __flex-between ${selectDataReport.monitoring ? 'onMonitoring' : 'offMonitoring'}`}
                style={{
                    position: 'relative',
                    padding: '.5rem 1rem',
                    outline: 'rgb(176 217 122 / 61%) solid 1px',
                    order: dataEstablishment.order
                }}
                ref={boxContentRef}
            >

                <div
                    className='__center_center columns __midGap'
                    style={{
                        width: '100px',

                    }}
                >
                    <Img idLocal={dataEstablishment._id} style={{ width: '50px', height: '40px' }} />
                    <p className='__text-center' style={{ color: selectDataReport.monitoring ? '#000' : '#fff' }}>{dataEstablishment.name}</p>
                </div>


                <div className='__width-complete __center_center columns __oneGap'>

                    <div className='__width-complete __center_center' style={{ justifyContent: 'space-evenly' }}>
                        <div >
                            <InputBorderBlue
                                textLabel='Alertas'
                                important={false}
                                disable={user && !user.super || !isAdmindSession}
                                type='number'
                                min={'0'}
                                valueDefault={'0'}
                                value={String(selectDataReport.alert)}
                                eventChengue={text => {
                                    const data = { ...selectDataReport, alert: Number(text) };
                                    setDataAlertLiveRequest(data);
                                }}
                            />
                        </div>

                        <div
                            style={{ width: '100px' }}
                        >
                            <InputBorderBlue
                                textLabel='Resaltantes'
                                important={false}
                                type='number'
                                disable={user && !user.super || !isAdmindSession}
                                min={0}
                                value={String(selectDataReport.important)}
                                eventChengue={text => {
                                    const data = { ...selectDataReport, important: Number(text) };
                                    setDataAlertLiveRequest(data);
                                }}
                            />
                        </div>

                        <div
                            style={{ width: '100px' }}
                        >
                            <InputBorderBlue
                                textLabel='Linea'
                                important={true}
                                disable={user && !user.super || !isAdmindSession}
                                type='select'
                                value={selectDataReport?.line}
                                childSelect={[
                                    { value: '1', text: 'Linea 1' },
                                    { value: '2', text: 'Linea 2' },
                                    { value: '3', text: 'Linea 3' },
                                    { value: '4', text: 'Linea 4' },
                                    { value: '5', text: 'Linea 5' },
                                    { value: 'P', text: 'Perimetral' },
                                    { value: 'C', text: 'Central' }
                                ]}
                                eventChengue={text => {
                                    AppManagerConfigStorange.set(`${dataEstablishment.name}`, text.toUpperCase());
                                    const data = { ...selectDataReport, line: String(text) };
                                    setDataAlertLiveRequest(data);
                                }}
                            />
                        </div>
                    </div>

                    <div className='__width-complete'>
                        {
                            selectDataReport.editedBy ?
                                (
                                    <>
                                        <p className='__text-center' style={{ fontSize: '.8rem', color: '' }} >Editado por {selectDataReport.editedBy.name}</p>
                                    </>
                                )
                                :
                                (
                                    <>
                                    </>
                                )
                        }
                    </div>
                </div>

                {
                    isFiledEstablishment.length > 0 ?
                        (
                            <div
                                className='__center_center'
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'rgb(0 0 0 / 18%)',
                                    display: 'flex'
                                }}
                            >
                                <p
                                    className='t-white'
                                    style={{
                                        fontFamily: 'inherit',
                                        fontSize: '2rem',
                                        backgroundColor: '#ff0000a8',
                                        padding: '.5rem',
                                        width: '100%',
                                        textAlign: 'center'
                                    }}
                                > ¡CAIDO! </p>
                            </div>
                        )
                        : null
                }
            </div>
            :
            null
    );
}
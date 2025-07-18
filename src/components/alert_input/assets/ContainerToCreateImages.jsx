'use client';
import { useEffect, useRef, useContext, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeReportForImg } from '@/store/slices/alertLiveStoreForImg';
import { toJpeg } from 'html-to-image';
import sendTextJarvis from '@/libs/sendMsmJarvis';
import GROUP_KEY from '@/libs/ajaxClient/API_JARVIS';
import getCurrentTime from '@/libs/time/getCurrentTime';
import calculateGoalData from '@/libs/script/parserDataForReporAlertGoal';
import ImportantNewsTable from './ComponentsImg/ImportantNewsTable';
import useAuthOnServer from '@/hook/auth';





export default function ContainerToCreateImages({ schedule }) {

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const reportLiveForImg = useSelector(state => state.reportLiveForImg);
    //  const dateNoveltyForListSelector = useSelector(store => store.dateNoveltyForList);

    const dispatch = useDispatch();
    const sectionHtmlRef = useRef(null);
    const secondImgRef = useRef(null);
    const styleTd = { color: '#000', textAlign: 'center', padding: '.2rem 0', fontSize: '.9rem' };
    const textRed = { color: 'red' };
    const textBold = { fontWeight: 'Bold' };
    const styleFailed = { backgroundColor: 'red', color: '#fff' };
    const styleSecoundTable = { borderCollapse: 'collapse' };
    const borderOfcell = { border: '1px solid #000' };

    const resultGoalData = reportLiveForImg ? calculateGoalData(reportLiveForImg, schedule) : null;
    const totalAlertWithoutPerimeter = reportLiveForImg?.data?.reduce((total, item) => { return item.line !== 'P' ? total + item.alert : total }, 0);
    const totalAlertPerimeter = reportLiveForImg?.data?.reduce((total, item) => { return item.line === 'P' ? total + item.alert : total }, 0)



    useEffect(() => {
        let isMount = true;

        if (isMount && reportLiveForImg) createAndSend();

        return () => {
            isMount = false;
        }
    }, [reportLiveForImg]);



    const createAndSend = useCallback(async () => {
        try {

            const caption = `*Reportes de alertas en vivo📋*\nFecha: ${reportLiveForImg.createdAt}\nHora: ${getCurrentTime()}\nTurno: ${reportLiveForImg.shift} ${reportLiveForImg.shift === 'diurno' ? '☀' : '🌙'}`
            const toImgAlert = await toJpeg(sectionHtmlRef.current);
            const resFirtImg = await sendTextJarvis(caption, GROUP_KEY, false, null, toImgAlert);

            /*
            const caption2 = `*Reportes del turno📋*\nFecha: ${reportLiveForImg.createdAt}\nHora: ${getCurrentTime()}\nTurno: ${reportLiveForImg.shift}${reportLiveForImg.shift === 'diurno' ? '☀' : '🌙' }${user ? `\nResponsable: ${user.name} ${user.surName}` : ''}\n\nNota: Aun en versión Beta`;
            const toImgAlert2 = await toJpeg(secondImgRef.current);
            const resFirtImg2 = await sendTextJarvis(caption2, GROUP_KEY, false, null, toImgAlert2);
            */
        }
        catch (err) {
            console.log(err);
        }
        finally {
            dispatch(removeReportForImg());
        }
    }, [dataSessionState, reportLiveForImg]);



    const addResult = object => {
        let countTotal = 0;
        for (let entries in object) {
            if (entries !== 'line_P') countTotal += object[entries].count;
        }
        return countTotal;
    };



    const calculateGoalAverage = object => {
        if (!resultGoalData) return;

        const resultArr = [];
        Object.keys(object).forEach(keyItem => {
            resultArr.push(((resultGoalData[keyItem].total / (reportLiveForImg.goalDay / addResult(resultGoalData) * resultGoalData[keyItem].count)) * 100).toFixed())
        });
        let add = resultArr.reduce((total, value) => Number(total) + Number(value), 0);
        let average = add / resultArr.length;
        return average.toFixed();
    };



    return (
        <div className='__center_center'
            style={{
                top: '70px',
                left: 0,
                position: 'absolute',
                flexDirection: 'row',
                gap: '2rem'
            }}
        >
            {
                reportLiveForImg && user ?
                    <>
                        <div
                            className='__width-complete'
                            ref={sectionHtmlRef}
                            style={{
                                width: '710px',
                                backgroundColor: '#fff',
                            }}
                        >
                            <div className='__width-complete __center_center __oneGap' style={{ backgroundColor: 'rgb(90 144 0 / 82%)' }}>
                                <p
                                    style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>Reporte de alertas {reportLiveForImg.shift} {reportLiveForImg.createdAt}</p> <img style={{ width: '30px' }} src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAACXBIWXMAAAsTAAALEwEAmpwYAAADN0lEQVR4nO2aT0iUQRjGHypQSHd3Ri0KjKJupUhRULCgJy0DA11rVwrs4B8SDNLqEKRSVGBehIK6S0JidUtL2QzSToqBHjylBnXIU5G67Bvzfbu6/uMbzZ35luaBB4aZd799frzvN3tZwMjIyMjIyMgolUQMncRBSTVDJ9wiYuhXANwHt4gYppMOzPEVbhDtxW7iiCoAjlIOMnTzgrJxQgGs7Wwcd8M4h5QBMwTdANyqELhFNy+Io1sZMMcLNwCPKQQe1QsL7CCGXwpH+rf4Tn3AXhxS2F3bXhzUB8xQohyYoVgfMMd16aD70omK8omqSojqArZDJUSF+faZPHSjTuCnUiELDhDVVhA1BNe3OCvIlQV+og+YYVAKdiPQ1ZaBZhjQCfzNcYxXd/Z2DVFHq+1bNWs7vT/NCXhWDyyHx7Eb4p1NBGpvIRp4RxQetC3W7XdX1hTmyXTZqwP4lFOwhaqzKzubCJsIndDpBXGROQFn4aQO4CtOwSLiJo6BRDva1sLGHH3ctlQXEWPtDHxZPTDDfadgiwnv79yDOxsCW2exOuszziN9Twdwj1OwOTGeMZCp+hBF3vevgRV7U3WhpbqfQYmRZnipHpjji1OwSf/ypTVbfYGGmxtWQIv1p6Zr1lm8bsIvcWlxjKuFBXYSxx+nYMN70mkhNtbRhiD1lxXRm8pSGrnZaPl1oJT6yoqsM+vCqq2gkRyHnyXb8wTsUgecgyMSoWjGBxo6lrvUvfn6i/S5sph6z/kti7XYi58PHc2lWZ/zcy17cFgdsA/npUJx0GCmDR3v9HoWZwI27JGEtd/jUnXADE2yweY56G0mqCc7jcb9edaltFgXsCzWYq8nK82qEbWbAL6hDpjjuXQw8XvMQaNeUHcGqGuVxd6Y167ZzDOJ45lK4A+bDGd5kYOmfaBJr22xFntbeRZxhFUC/9hiyO0zw3c1sB5w7bBxe8CTD8xwRjvocpdPJx+Y46p20GVXqwB+5ALQuB8mH5jhlYtGulcF8KSLgCeSQ9lMLXEHyrvDl8q7PrrBIktitu0EppSwAd6qdHfOdJjMSMO8w/+i5v/tlob175lUsAE2MjIyMkIK6S9n33fSD5qR1QAAAABJRU5ErkJggg==' />
                            </div>
                            <table className='__width-complete table'>
                                <thead>
                                    <tr>
                                        <td style={{ ...styleTd, ...textBold }}>Nombre</td>
                                        <td style={styleTd}>Alertas</td>
                                        <td style={styleTd}>Resaltante</td>
                                        <td style={styleTd}>Estatus</td>
                                        <td style={styleTd}>Falla con dvr</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        reportLiveForImg.data.map((item, index) => (
                                            <tr key={index}>
                                                <td style={{ ...styleTd, ...textBold }}>{item.establishment.name}</td>
                                                <td style={styleTd}>{item.alert}</td>
                                                <td style={{ ...styleTd, ...textRed }}>{item.important}</td>
                                                <td style={styleTd}>{
                                                    item.noSetSchedule ? 'Horarion sin definir' :
                                                        item.monitoring ? 'activo' : 'inactivo'
                                                }</td>
                                                <td style={item.failed ? { ...styleTd, ...styleFailed } : styleTd}>{item.failed ? 'Si' : 'No'}</td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                            <div className='__padding1rem' >
                                <p style={textBold}>Total: {totalAlertWithoutPerimeter}</p>
                                <p style={textBold}>Resaltantes: {reportLiveForImg.data.reduce((total, item) => { return item.important ? total + item.important : total }, 0)}</p>
                                <p style={textBold}>Totales de falla con dvr: {reportLiveForImg.data.reduce((total, item) => { return item.faided ? total + item.faided : total }, 0)}</p>
                            </div>
                        </div>

                        {/*
                            resultGoalData ?
                                <div
                                    className='__width-complete'
                                    ref={ secondImgRef }
                                    style={{
                                        width: '510px',
                                        backgroundColor: '#fff',
                                    }}
                                >
                                    <div 
                                        className='__width-complete __oneGap'
                                    
                                    >
                                        <div 
                                            className='__width-complete __center_center __oneGap'
                                            style={{ backgroundColor: 'rgb(90 144 0 / 82%)' }}
                                        >
                                            <h3  style={{ fontWeight: 'bold', fontSize: '1.1rem', color:'#fff'  }}> Evaluación de turno </h3>
                                        </div>
                                        <div style={{ padding: '.5rem' }}>
                                            <p>Metas del turno: {reportLiveForImg.goalDay}</p>
                                            <p>Total de alertas: {totalAlertWithoutPerimeter}</p>
                                            <p>Total de alertas perimetrales: {totalAlertPerimeter}</p>
                                        </div>
                                        <table className='__width-complete' style={styleSecoundTable}>
                                            <thead>
                                                <tr>
                                                    <td style={{...styleTd, ...borderOfcell, ...textBold}}>Linea</td>
                                                    <td style={{...styleTd, ...borderOfcell, ...textBold}}>Meta por linea</td>
                                                    <td style={{...styleTd, ...borderOfcell, ...textBold}}>Alertas total por linea</td>
                                                    <td style={{...styleTd, ...borderOfcell, ...textBold}}>%</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    Object.keys(resultGoalData).map(keyItem => (
                                                        keyItem !== 'line_P' ?
                                                            <tr key={ keyItem }>
                                                                <td style={{...styleTd, ...borderOfcell}}>Linea: { keyItem.split('_')[1] }</td>
                                                                <td style={{...styleTd, ...borderOfcell}}>{ Number(reportLiveForImg.goalDay / (addResult(resultGoalData)) * resultGoalData[keyItem].count).toFixed() }</td>
                                                                <td style={{...styleTd, ...borderOfcell}}>{ resultGoalData[keyItem].total }</td>
                                                                <td style={{...styleTd, ...borderOfcell}}>{ (( resultGoalData[keyItem].total / (reportLiveForImg.goalDay / addResult(resultGoalData) * resultGoalData[keyItem].count)) * 100).toFixed() }%</td>
                                                            </tr>
                                                        :
                                                            null
                                                    ))
                                                }
                                                <tr >
                                                    
                                                    <td style={{...styleTd, ...borderOfcell, ...textBold}} colSpan='3'>Porcentaje del día</td>
                                                    <td style={{...styleTd, ...borderOfcell}}>{ calculateGoalAverage(resultGoalData) }%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            
            
                            :
                                null
                        */}
                    </>
                    :
                    null
            }

            {/*
                dateNoveltyForListSelector.map((item, index) => (
                    <ImportantNewsTable data={ item } key={ index } />
                ))
            */}
        </div>

    );
}


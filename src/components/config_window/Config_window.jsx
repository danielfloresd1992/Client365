'use client';
import { isMobile } from 'react-device-detect';
import { useSelector, useDispatch } from 'react-redux';
import { setOpenWindowConfig } from '@/store/slices/configModalStore';
import SectionConfigVoice from './assets/config_voices';
import ConfigIsAdmin from './assets/configIsAdmin';
import ResetClientsNow from './assets/reloadClientButton';
import ChangueDaylightSavingTime from './assets/changueDaylightSavingTim';
import ListDayGoal from './assets/configArr';



export default function Config_window() {

    const isOpenWindowState = useSelector(store => store.configModal);
    const dispatch = useDispatch();

    const handlerCloseWindow = () => {
        dispatch(setOpenWindowConfig(false));
    }


    return (
        !isMobile && isOpenWindowState ?

            <div className='__border-smoothed bdGray scrolltheme1'
                style={{
                    position: 'fixed',
                    height: '50vh',
                    width: '500px',
                    bottom: 0,
                    top: 0,
                    margin: 'auto',
                    zIndex: '3000'
                }}
            >
                <div className='header __width-complete'
                    style={{
                        position: 'sticky',
                        height: '40px'
                    }}
                >
                    <h3 className='t-white'>Configuración</h3>
                    <div className='__height-complete __center_center'>
                        <button
                            className='__pointer __center_center'
                            onClick={handlerCloseWindow}
                        >
                            <img style={{ height: '30px', width: '30px' }} className='__width-complete __height-complete __never-pointer' src='/img/ico-close.png' />
                        </button>
                    </div>
                </div>

                <div className='flex columns __padding1rem __width-complete __height-complete __oneGap'>

                    <hr />
                    <ResetClientsNow />
                    <hr />
                    <ConfigIsAdmin />
                    <hr />
                    <ListDayGoal />
                    <hr />
                    <ChangueDaylightSavingTime />
                </div>
            </div>
            :
            null
    );
}
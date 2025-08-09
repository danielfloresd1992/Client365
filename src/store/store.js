import { configureStore } from '@reduxjs/toolkit';;
import modal from './slices/globalModal';
import clients from './slices/Client';
import typeForm from './slices/typeForm';
import voice from './slices/voice';
import voiceDefinitive from './slices/voiceDefinitive';
import configModalStore from './slices/configModalStore';
import isAdminSession from './slices/boolean_admin_session';
import volumeVoiceDefinitive from './slices/volumeVoiceDefinitive';
import alertLiveStore from './slices/alertLiveStore';
import reportLiveForImg from './slices/alertLiveStoreForImg';
import alertLiveDateStore from './slices/alertLiveDateStore';
import isDaylightSavingTime from './slices/isDaylightSavingTimeStore';
import dateNoveltyForListStore from './slices/dateNoveltyForList';
import newEstablishmentStore from './slices/newEstablishment';
import sessionStore from '@/store/slices/session'
import filterClientReducer from '@/store/slices/filterAlert';



const store = configureStore({
    reducer: {
        modal,
        configModal: configModalStore,
        clients: clients,
        typeForm: typeForm,
        voice: voice,
        voiceDefinitive: voiceDefinitive,
        isAdminSession: isAdminSession,
        volumeVoiceDefinitive: volumeVoiceDefinitive,
        reportAlertLive: alertLiveStore,
        alertLiveDate: alertLiveDateStore,
        isDaylightSavingTime, isDaylightSavingTime,
        reportLiveForImg: reportLiveForImg,
        dateNoveltyForList: dateNoveltyForListStore,
        newEstablishment: newEstablishmentStore,
        session: sessionStore,
        filterClientList: filterClientReducer
    }
});


export default store;
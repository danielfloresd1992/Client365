import { useContext } from 'react';
import { ModalContext } from '@/contexts/modalContext';
import { UserContext } from '@/contexts/userContext';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';


export default function useErrorAut(){

    const { logout } = useContext(UserContext);
    const router = useRouter();
    const dispatch = useDispatch();

    const handleSessionExpiration = () => {
        logout();
        router.replace('/');
    };

    const showSessionExpiredModal = () => {
        dispatch(setConfigModal(
            {
                modalOpen: true,
                title: 'Sesión caducada',
                description: 'La sesión se cierra luego de 30 minutos de inactividad',
                isCallback: handleSessionExpiration,
                type: 'exit',
            }
        ))
    };

    return {
        showSessionExpiredModal,
    };
}

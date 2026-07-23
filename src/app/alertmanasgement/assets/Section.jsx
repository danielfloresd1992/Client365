'use client';
import { useState, useEffect } from 'react';
import useAuthOnServer from '@/hook/auth';

//view

import { Form } from './view/FormReact.jsx';
import { ListMenu } from './view/ListMenu.jsx';
import IP from '@/libs/ajaxClient/dataFecth';


//fetching de data
import useAxios from '@/hook/useAxios.jsx';
import axiosStand from '@/libs/ajaxClient/axios.fetch.js';
import { sendMenu, putMenu } from './model/menu.model.js';




export default function Section() {


    const [menuIndividual, setMenuIndividual] = useState(null);
    const [addManuState, setAddManuState] = useState(null);
    const [locals, setLocals] = useState(null);
    // El formulario solo se muestra al seleccionar una alerta o al crear una nueva
    const [showForm, setShowForm] = useState(false);
    // Se incrementa tras guardar (crear/editar) para forzar el refetch de la lista
    const [savedTick, setSavedTick] = useState(0);

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const { requestAction } = useAxios();



    useEffect(() => {
        requestAction({ url: `/localLigth`, action: 'GET' })
            .then(response => {
                setLocals(response.data);
            })
            .catch(err => {
                console.log(err);
            });
        return () => {

        };
    }, [menuIndividual]);



    const selectNoveltie = id => {
        axiosStand.get(`/menu/id=${id}`)
            .then(response => {
                setMenuIndividual({ ...response.data[0] });
                setShowForm(true);   // mostrar el formulario al seleccionar una alerta
            })
            .catch(err => {
                console.log(err);
            });
    };


    // Abrir el formulario en modo "crear" (sin alerta seleccionada)
    const createNewAlert = () => {
        setMenuIndividual(null);
        setShowForm(true);
    };


    // Cerrar el formulario y volver a la lista
    const closeForm = () => {
        setMenuIndividual(null);
        setShowForm(false);
    };


    const resetNoveltie = () => {
        setMenuIndividual(null);
    };


    const addMenu = menu => {
        setAddManuState(menu)
    };


    const resetAddManuState = () => {
        setAddManuState(null);
    };


    return (
        <>
            {
                locals ?
                    (
                        <>
                            <ListMenu
                                setMenu={selectNoveltie}
                                resetNoveltie={resetNoveltie}
                                newMENU={addManuState}
                                resetAddManuState={resetAddManuState}
                                onCreateNew={createNewAlert}
                                expanded={true}
                                refreshKey={savedTick}
                                selectedId={menuIndividual?._id}
                            />
                            {showForm && (
                                <Form
                                    menuIndividual={menuIndividual}
                                    local={locals}
                                    resetNoveltie={resetNoveltie}
                                    putMenuProps={putMenu}
                                    createMenu={sendMenu}
                                    addMenu={addMenu}
                                    user={user}
                                    onClose={closeForm}
                                    onSaved={() => setSavedTick(t => t + 1)}
                                />
                            )}
                        </>
                    )
                    :
                    (null)
            }
        </>
    );
}
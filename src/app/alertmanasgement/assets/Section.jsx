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
            })
            .catch(err => {
                console.log(err);
            });
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
                                modal={null}
                                newMENU={addManuState}
                                resetAddManuState={resetAddManuState}
                            />
                            <Form
                                menuIndividual={menuIndividual}

                                local={locals}
                                resetNoveltie={resetNoveltie}
                                putMenuProps={putMenu}
                                createMenu={sendMenu}
                                modal={null}
                                addMenu={addMenu}
                                user={user}
                            />
                        </>
                    )
                    :
                    (null)
            }
        </>
    );
}
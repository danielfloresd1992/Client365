'use client';
import { useState, useEffect } from 'react';
import useAuthOnServer from '@/hook/auth';

//view

import { Form } from './view/FormReact.jsx';
import { ListMenu } from './view/ListMenu.jsx';
import IP from '@/libs/dataFecth';


//fetching de data
import useAxios from '@/hook/useAxios.jsx';
import axiosStand from '@/libs/axios.fetch.js';
import { sendMenu, putMenu } from './model/menu.model.js';




export default function Section() {

    const [menuIndividual, setMenuIndividual] = useState(null);
    const [addManuState, setAddManuState] = useState(null);

    const [locals, setLocals] = useState(null);

    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;

    const { requestAction } = useAxios();

    useEffect(() => {
        requestAction({ url: `https://${IP}/localLigth`, action: 'GET' })
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
        axiosStand.get(`https://${IP}/menu/id=${id}`)
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
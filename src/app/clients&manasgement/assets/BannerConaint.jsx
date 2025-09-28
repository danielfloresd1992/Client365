'use client';
import { useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setConfigModal } from '@/store/slices/globalModal';
import { setTypeForm } from '@/store/slices/typeForm';
import BannerBetween from '@/components/Header/BannerBetween';
import AsideGreen from '../../../components/aside/aside_green/aside_layaut';
import ButtonForBanner from '@/components/buttons/ButtonForBanner';
import useAuthOnServer from '@/hook/auth';
import Image from 'next/image';


import key_search from '@/libs/script/search';


export default function BannerContain({ clients }) {


    const [searchResultState, setSearchResultState] = useState({ result: [], init: false, await: false });
    const refSearch = useRef(null);

    const dispatch = useDispatch();
    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;


    const validateAuthorization = useCallback(callback => {
        if (!user?.admin) {
            dispatch(setConfigModal({
                title: 'Error',
                description: 'No tienes autorización para ejecutar esta función',
                type: 'error',
                modalOpen: true,
                isCallback: null
            }));
        }
        else {
            callback();
        }
    }, [dataSessionState]);





    const handdlerChangeInputSearch = (e) => {
        setSearchResultState({ ...searchResultState, await: true, init: true })
        const textInput = e.target.value;
        const result = key_search(clients, ['name'], textInput);
        setSearchResultState({ result: result, init: true, await: false });
    };



    const handdlerClickOption = (item) => {
        const elementHtml = document.getElementById(`${item._id}-${item.name}`);
        setSearchResultState({ result: [], init: false, await: false });
        refSearch.current.value = '';
        elementHtml.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        elementHtml.classList.add('seleted-element');
    };



    return (
        <AsideGreen
            title='Gestion de clientes'
            urlIco='/ico/icons8-menú-50.png'

        >
            <div className='relative w-full flex flex-col items-center gap-[1.5rem]'>
                <div className='relative w-full flex flex-col'>
                    <div className='bg-[#0c6d33] p-[0_.4rem] border-[2px] border-[#ffffff] rounded-[5px] flex items-center'>
                        <div className=''>
                            <img style={{ filter: 'invert(1)' }} className='w-[17px] h-[17px]' draggable={false} src='/ico/seach/search.svg' />
                        </div>

                        <input
                            className='bg-transparent w-full h-full text-[.7rem] p-[.4rem_1rem] text-white outline-none focus:outline-none active:outline-none'
                            placeholder='Buscar establecimiento'
                            type='text'
                            name='search_clients'
                            ref={refSearch}
                            disabled={!(Array.isArray(clients) && clients.length > 0)}
                            onChange={handdlerChangeInputSearch}
                        />
                    </div>
                    <div className='absolute p-[0] top-[31.5px] bg-[#ffffffe0] w-full min-h-[0px] max-h-[300px] overflow-y-scroll'>
                        {
                            searchResultState.result.length > 0 && searchResultState.result.map(item => {


                                return (
                                    <p
                                        className='text-[#000] text-[.8rem] p-[.3rem_.4rem] hover:bg-gray-300 cursor-pointer'
                                        key={item._id}
                                        onClick={() => {
                                            handdlerClickOption(item);
                                        }}
                                    >{item.name}</p>
                                )

                            })
                        }
                    </div>

                </div>


                <div className='w-full'>
                    <ButtonForBanner
                        ico='/ico/icons8-franquicia-50.png'
                        value='Crear Franquicia'
                        actionButton={() => {
                            validateAuthorization(() => {
                                dispatch(setTypeForm('create-franchise'));
                            })
                        }} />
                    <ButtonForBanner
                        ico='/ico/icons8-tienda-30.png'
                        value='Crear cliente'
                        actionButton={() => {
                            validateAuthorization(() => {
                                dispatch(setTypeForm('create-client'));
                            });
                        }} />
                </div>
            </div>
        </AsideGreen >
    );
}
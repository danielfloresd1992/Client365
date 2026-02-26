'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';



export default function AsideNav() {

    const [hiddenState, setHiddenState] = useState(false);

    useEffect(() => {
        const savedState = localStorage.getItem('asideNavHidden');
        if (savedState !== null) {
            setHiddenState(JSON.parse(savedState));
        }
    }, []);

    const menuItems = [
        { name: 'Horario y Guardias', path: `/user`, icon: '/ico/icons8-calendario-64.png' },
        { name: 'Consultar Asistencia', path: `/user/asistencia`, icon: '/ico/icons8-filtrar-.32.png' },
        { name: 'Gestión de Perfiles', path: `/user/config`, icon: '/ico/icons8-lista-50.png' },
    ];



    const handdlerClickToogleHidden = () => {
        const newState = !hiddenState;
        setHiddenState(newState);
        localStorage.setItem('asideNavHidden', JSON.stringify(newState));
    };




    return (
        <div className={`relative h-full transition-all duration-300 ${hiddenState ? 'w-[250px]' : 'w-[0px]'} max-[599px]:absolute max-[599px]:top-0 max-[599px]:left-0 max-[599px]:z-[200] max-[599px]:h-full`}>
            <aside className={`absolute top-0 left-0 h-full bg-white rounded-lg border transition-all duration-300 overflow-hidden flex flex-col justify-between ${hiddenState ? 'w-[250px] p-2 opacity-100' : 'w-[0px] p-0 opacity-0 border-transparent'}`}>
                <div className='w-[232px] h-full flex flex-col justify-between'>
                    <div className='w-full'>
                        <div className='w-full flex items-center flex-row gap-[.5rem] p-3 border rounded-lg mb-4'>
                            <Image src='/ico/icons8-horario-48.png' alt='ico-title-sidebar-users' width={20} height={20} />
                            <h2 className="text-[.9rem] font-semibold text-gray-600 whitespace-nowrap">Panel de Empleado</h2>
                        </div>

                        <nav className='w-full'>
                            <div>
                                <p className='text-gray-400 font-semibold text-[.7rem] p-[10px] whitespace-nowrap'>Tipos de consultas</p>
                            </div>
                            <div className='w-full'>
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className='contrast-[.5] flex text-gray-500 text-[12px] font-semibold items-center gap-3 p-3 rounded-lg hover:bg-[aliceblue] hover:contrast-[1] transition-colors whitespace-nowrap'
                                    >
                                        <Image src={item.icon} alt='item' width={15} height={15} />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </nav>
                    </div>
                    <div className='w-full'>
                        <button className='w-full flex text-gray-500 text-[.8rem] font-semibold items-center gap-3 p-3 rounded-lg bg-[aliceblue] transition-color whitespace-nowrap'>Volver</button>
                    </div>
                </div>
            </aside>

            <div className='absolute top-[0] right-[-50px] z-10'>
                <button
                    type='button'
                    title='Ocultar o mostrar'
                    className='rounded-[50px] w-[40px] h-[40px] bg-black flex justify-center items-center'
                    onClick={handdlerClickToogleHidden}
                >
                    <img className='w-[50%] h-[50%]' src={hiddenState ? '/ico/icons8-flecha-izquierda-larga-24.png' : '/ico/icons8-flecha-derecha-larga-48.png'} alt='ico-show-aside' />
                </button>
            </div>
        </div>
    )
}

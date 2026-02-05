'use client';
import AsideGreen from '@/components/aside/aside_green/aside_layaut';

import BannerBetween from '@/components/Header/BannerBetween';
import Image from 'next/image';
import ButtonForBanner from '@/components/buttons/ButtonForBanner';


export default function BannerContain({ openClone, reset, establishment = '' }){


    return(
        <AsideGreen

            title='Gestion de horario'
            urlIco='/ico/icons8-reloj-50.png'
        >

            <div className='w-full'>
                <h3 className='color-white'>{ establishment ? `: ${establishment.name}` : ''}</h3>
            </div>
            
            <div className='w-full'>
                <ButtonForBanner ico='/ico/icons8-repetir-50.png' value='Resetear' actionButton={ reset } />
                <ButtonForBanner ico='/ico/icons8-agregar-base-de-datos-50.png' value='Clonar horario' actionButton={ openClone } />
            </div>
        </AsideGreen>
    );
}
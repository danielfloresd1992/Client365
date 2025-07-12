'use client';
import BannerBetween from '@/components/Header/BannerBetween';
import Image from 'next/image';
import ButtonForBanner from '@/components/buttons/ButtonForBanner';


export default function BannerContain({ openClone, reset, establishment = '' }){


    return(
        <BannerBetween>
            <div className='flex __oneGap'>
                <h3>Gestion de horario{ establishment ? `: ${establishment.name}` : ''}</h3>
                <Image src='/ico/icons8-reloj-50.png' alt='ico-relg' width={25} height={25} />
            </div>
            
            <div className='flex __midGap'>
                <ButtonForBanner ico='/ico/icons8-cita-recurrente-50.png' value='Resetear' actionButton={ reset } />
                <ButtonForBanner ico='/ico/icons8-copiar-50.png' value='Clonar horario' actionButton={ openClone } />
                <ButtonForBanner url='' ico='/ico/gira-a-la-izquierda-32.png' value='volver' />
            </div>
        </BannerBetween>
    );
}
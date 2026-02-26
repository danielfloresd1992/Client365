import Image from 'next/image'
import ListClient from './ListClient.jsx';
import LiItemGrey from '@/components/ListItem/LiItemGray.jsx';


export default function Nav() {


    return (
        <nav className='listRoute border10 rounded-sm overflow-hidden'>
            <div className='aside-contents'>
                <div className='listRoute-a-menuTitle'>
                    <div className='lobby-title-row __width-complete __center_center __border-sub __midGap __midPadding'>
                        <div className='lobby-title-icon'>
                            <Image width={20} height={20} alt='ico-cubo' src='/img/cubo-50.png' />
                        </div>
                        <p className='usersContain-title lobby-title-text'>Centro de operaciones</p>
                    </div>
                    <ul className='listRoute-a-menuTitle scrolltheme1'>
                        <LiItemGrey urlImage='/img/aceptar-la-base-de-datos-30.png' textTitle='Corte por hora' urlLink='/Corte365' />
                        <LiItemGrey urlImage='/img/corporate-67.png' textTitle='Gestión de clientes' urlLink='/clients&manasgement' />
                        <LiItemGrey urlImage='/img/carta-50.png' textTitle='Gestión de alertas' urlLink='/alertmanasgement' />
                        <LiItemGrey urlImage='/img/analistica-web-48.png' textTitle='Panel analítico' urlLink='/#' />
                        <LiItemGrey urlImage='/ico/icons8-grupo-de-usuario-24.png' textTitle='Gestión del personal' urlLink='/user' />
                    </ul>
                </div>
            </div>
            <div className='aside-contents'>
                <div className='listRoute-a-menuTitle'>
                    <div className='lobby-title-row __width-complete __center_center __border-sub __midGap __midPadding'>
                        <div className='lobby-title-icon'>
                            <Image width={20} height={20} alt='ico-global' src='/img/grupos-de-usuarios-50.png' />
                        </div>
                        <p className='usersContain-title lobby-title-text'>Clientes activos</p>
                    </div>

                    <ListClient />
                </div>
            </div>
        </nav>
    )
}
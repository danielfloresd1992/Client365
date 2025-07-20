import Image from 'next/image'
import ListClient from './ListClient.jsx';
import LiItemGrey from '@/components/ListItem/LiItemGray.jsx';


export default function Nav(){
    

    return(
        <nav className='listRoute border10'>
            <div className='aside-contents'>
                <div className='listRoute-a-menuTitle'>
                    <div className='__width-complete __center_center __border-sub __midGap __midPadding'>
                        <Image width={30} height={30} alt='ico-cubo' style={{ filter: 'brightness(0.5)' }} src='/img/cubo-50.png' />
                        <p className='usersContain-title'>Administración de recursos</p>
                    </div>
                    <ul className='listRoute-a-menuTitle scrolltheme1'>
                        <LiItemGrey urlImage='/img/aceptar-la-base-de-datos-30.png' textTitle='Corte por hora' urlLink='/Corte365' />
                        <LiItemGrey urlImage='/img/corporate-67.png' textTitle='Gestion de clientes' urlLink='/clients&manasgement' />
                        <LiItemGrey urlImage='/img/carta-50.png' textTitle='Gestion de alertas' urlLink='/alertmanasgement' />
                        <LiItemGrey urlImage='/img/analistica-web-48.png' textTitle='analytical' urlLink='/#' />
                    </ul>
                </div>
            </div>
            <div className='aside-contents'>
                <div className='listRoute-a-menuTitle'>
                    <div className='__width-complete __center_center __border-sub __midGap __midPadding'>
                        <Image width={30} height={30} alt='ico-global' style={{ filter: 'brightness(0.5)' }} src='/img/grupos-de-usuarios-50.png' />
                        <p className='usersContain-title'>Nuestro clientes</p>
                    </div>
                    
                    <ListClient />
                </div>
            </div>
        </nav>
    )
}
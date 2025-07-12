import ListUser from './ListAppManager';
import ListUserExpress from './ListExpress';
import Image from 'next/image';



export default function AsideInfoUser() {


    return (
        <aside className='componentAside border10 contentStatic'>
            <div className='aside-contents'>
                <div className='usersContain'>
                    <div className='__width-complete __center_center __border-sub __midGap __midPadding'>
                        <Image width={30} height={30} alt='ico-global' src='/img/global-50.png' style={{ filter: 'opacity(0.7)' }} />
                        <p className='usersContain-title'>Conectador por App-manager</p>
                    </div>
                    <ListUser />
                </div>
            </div>
            <div className='aside-contents'>
                <div className='usersContain'>
                    <div className='__width-complete __center_center __border-sub __midGap __midPadding'>
                        <Image width={30} height={30} alt='ico-global' src='/img/global-50.png' style={{ filter: 'opacity(0.7)' }} />
                        <p className='usersContain-title'>Usuarios conectador por express</p>
                    </div>
                    <ListUserExpress />
                </div>
            </div>
        </aside>
    );
}
import ListUser from './ListAppManager';
import ListUserExpress from './ListExpress';
import Image from 'next/image';



export default function AsideInfoUser() {


    return (
        <aside className='componentAside border10 contentStatic'>
            <div className='aside-contents'>
                <div className='usersContain'>
                    <div className='lobby-title-row __width-complete __center_center __border-sub __midGap __midPadding'>
                        <div className='lobby-title-icon'>
                            <Image width={20} height={20} alt='ico-global' src='/img/global-50.png' />
                        </div>
                        <p className='usersContain-title lobby-title-text'>Conectados · App Manager</p>
                    </div>
                    <ListUser />
                </div>
            </div>
            <div className='aside-contents'>
                <div className='usersContain'>
                    <div className='lobby-title-row __width-complete __center_center __border-sub __midGap __midPadding'>
                        <div className='lobby-title-icon'>
                            <Image width={20} height={20} alt='ico-global' src='/img/global-50.png' />
                        </div>
                        <p className='usersContain-title lobby-title-text'>Conectados · Express</p>
                    </div>
                    <ListUserExpress />
                </div>
            </div>
        </aside>
    );
}
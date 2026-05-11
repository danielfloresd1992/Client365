'use client';
import Link from 'next/link';

export default function List({ data }) {


    return (
        <li style={{ order: data.order }} className='lobby-client-item'>
            <Link href={`/establishment/${data._id}`} className='listRoute-a lobby-client-link'>
                <div className='lobby-client-avatar'>
                    <img
                        src={data?.image || '/img/corporate-67.png'}
                        alt='ico-locality'
                        className='lobby-client-avatar-img'
                    />
                </div>
                <div className='lobby-client-content'>
                    <p className='__textGrayForList lobby-client-name'>{data?.name || 'Cliente sin nombre'}</p>
                    <span className='lobby-client-meta'>Cliente</span>
                </div>
            </Link>
        </li>

    )
}
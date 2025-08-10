'use client';
import Image from 'next/image';

export default function List({ data }) {


    return (
        <li style={{ order: data.order }}>
            <a className='listRoute-a'>
                <div>
                    <img
                        src={data?.image}
                        alt='ico-locality'
                        className='w-[25px] h-[23px] bg-[#ddd]'
                    />
                </div>
                <p className='__textGrayForList' >{data.name}</p>
            </a>
        </li>

    )
}
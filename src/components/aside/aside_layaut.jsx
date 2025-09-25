import ButtonForBanner from '../buttons/ButtonForBanner';
import Image from 'next/image';


export default function AsideGreen({ title, urlIco, children }) {
    return (
        <aside className='w-[256px] h-full bg-[#31c967] text-black flex flex-col justify-between overflow-hidden rounded-[10px]'>
            <div className='flex flex-col items-center gap-[2rem]  p-4'>
                <div className='w-full flex flex-col gap-[.5rem]'>
                    <div className='relative w-full flex flex-row items-center justify-center gap-[.5rem]'>
                        {
                            urlIco ?
                                <div className='absolute left-[0px]'>
                                    <Image src={urlIco} alt={`ico-${title}`} width={20} height={20} />
                                </div>
                                :
                                null
                        }
                        <h1 className='font-bold text-center text-white'>{title}</h1>
                    </div>
                    <hr />
                </div>

                <div className='w-full flex flex-col gap-[.5rem]'>
                    {children}
                </div>
            </div>


            <div className='w-full bg-[#0c6d33]'>
                <ButtonForBanner url='' ico='/ico/gira-a-la-izquierda-32.png' value='volver' />
            </div>
        </aside>
    )

}
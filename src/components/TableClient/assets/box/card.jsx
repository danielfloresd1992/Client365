import PieceLoader from '@/components/loandingComponent/piece_loader';
import DataFormart from '@/libs/time/dateFormat.js';
import './style.css';




export default function Card({ client, editFunction }) {



    return (
        <div className='cardClient' >
            {
                client ?
                    <>
                        <div className='w-full p-[.5rem_0] bg-[#ddd] flex items-center justify-center'>
                            <div className='w-[160px] h-[120px]'>
                                <img className='w-full h-full bg-[#ddd]' src={client?.image} alt={`logo-${client?.name}`} />
                            </div>
                        </div>

                        <div>
                            <p className='text-black'>{client?.name}</p>
                        </div>
                        <div className='w-full flex flex-col gap-[.5rem] p-[.5rem]'>
                            <div className='w-full flex justify-center'>
                                <button
                                    className='flex itens-center gap-[.3rem] p-[.1rem_.4rem] text-[0.7rem] border border-solid border-[#3349e1] text-[#3349e1] rounded-[3px] font-medium'
                                    onClick={editFunction}
                                >
                                    <img className='w-[5px]' src='/ico/lapiz_ico.png' alt='edit-ico' />Editar parametros
                                </button>
                            </div>
                            <div className='text-[.8rem] w-full'>
                                <p className='text-[#636262]'>Monitoreo: <span>{client?.status}</span></p>
                                <p className='text-[#636262]'>Idioma: <span>{client?.lang}</span></p>
                            </div>
                            <p className='text-[#000000] text-[.6rem] font-medium'>Creación: <span>{DataFormart.formatDateApp(client?.date)}</span></p>
                        </div>
                    </>
                    :
                    <PieceLoader />
            }

        </div>
    )
}
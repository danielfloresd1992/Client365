'use client';


interface IFormLayautProps{
    setSubmit: (e: any) => void,
    style?: React.CSSProperties | null | undefined,
    children: React.ReactNode,
    control?: any
}


export default function FormLayaut({ setSubmit, style = null, children}: IFormLayautProps){


    const styleFormLayaut: React.CSSProperties = {
        position: 'relative',
        margin: 'auto',
        width: '400px',  
        borderRadius: '.5rem', 
        boxShadow: '4px 10px 19px -19px rgba(87, 87, 87, 1)', 
        display: 'flex',     
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style
    }

    return <form onSubmit={e => { e.preventDefault(); setSubmit(e) }} className='bgWhite __padding1rem' style={ styleFormLayaut }>{ children }</form>
}
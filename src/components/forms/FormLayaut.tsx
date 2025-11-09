'use client';


interface IFormLayautProps{
    setSubmit: (e: any) => void,
    style?: React.CSSProperties | null | undefined,
    children: React.ReactNode,
    control?: any
}


export default function FormLayaut({ setSubmit, style = null, children}: IFormLayautProps){


    return <form onSubmit={e => { e.preventDefault(); setSubmit(e) }} className='form-layout' >{ children }</form>
}
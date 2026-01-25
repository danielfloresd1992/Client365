'use client';


interface IFormLayautProps{
    setSubmit: (e: any) => void,
    style?: React.CSSProperties | null | undefined,
    children: React.ReactNode,
    control?: any,
    max: any
}


export default function FormLayaut({ setSubmit, style = null, children, max=false}: IFormLayautProps){
    return <form onSubmit={e => { e.preventDefault(); setSubmit(e) }} className='form-layout' style={{
        minWidth: max ? '80%': 'none',
        height: 'auto',
        backgroundColor: '#f0f0f0',
        padding: '2rem',
        boxShadow: '2px 2px 10px #505050'
    }} >{ children }</form>
}
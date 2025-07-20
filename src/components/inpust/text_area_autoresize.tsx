import { useState, useEffect, useRef, ReactNode, memo, use } from 'react';


type Props = {
    value: string,
    changeEvent: (value: string) => void,
    disabled: boolean,
    invalidText: boolean,
    editedBy: string | null
}



export default memo(function TextAreaAutoResize({ value, changeEvent, disabled, invalidText, editedBy }: Props): ReactNode {

    const [valueState, setValueState] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const refContent = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (refContent.current && inputRef.current) {
            inputRef.current.style.height = 'auto'; // Reset the height to auto to calculate the new height
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`; // Set the height to the scrollHeight

            refContent.current.style.height = 'auto'; // Reset the height to auto to calculate the new height
            refContent.current.style.height = `${Number(inputRef.current.scrollHeight) + 10}px`; // Set the height to the scrollHeight
        }
    }, [valueState]);

    useEffect(() => setValueState(value), []);



    return (
        <div className='w-full p-[1rem_0] h-[fit-content] border border-custom-gray rounded-md bg-[#d3d3d3]'>
            <div className='w-full p-[.1rem_.5rem_.5rem_.5rem] flex justify-between items-center'>
                <p>Texto para el cliente</p>
                {
                    editedBy ? <p>Editado por {editedBy}</p> : null
                }
            </div>
            
            <div className='paper p-[.5rem_0]' ref={refContent}>
                <div className='paper-content'>
                    <textarea
                        className='w-full h-auto resize-none '
                        style={invalidText === false ? { textDecoration: 'line-through', color: 'black' } : {}}
                        title='Escribe aquí para editar'
                        onChange={e => setValueState(e.target.value)}
                        onBlur={e => changeEvent(e.target.value)}
                        value={valueState}
                        ref={inputRef}
                        disabled={disabled}
                    >
                    </textarea>
                    <hr />
                </div>
            </div>
        </div>
    )
})
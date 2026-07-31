import { useState, useEffect, useRef, ReactNode, memo } from 'react';
import Image from 'next/image';
import { useDispatch } from 'react-redux';
import EmojiContainer from '@/components/emojis/emojis_seletion';
import { setConfigModal } from '@/store/slices/globalModal';
import type { Props } from '@/types/textAreaAutoresize';




// Cantidad de líneas iniciales que quedan bloqueadas cuando lockFirstTwoLines está activo
const LOCKED_LINES = 2;

// Devuelve el bloque de las primeras N líneas (la zona protegida) de un texto
const getLockedPrefix = (text: string): string =>
    text.split('\n').slice(0, LOCKED_LINES).join('\n');

///




export default memo(function TextAreaAutoResize({ value, changeEvent, disabled, invalidText, editedBy, lockFirstTwoLines = false }: Props): ReactNode {


    const [valueState, setValueState] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const refContent = useRef<HTMLDivElement>(null);
    const buttonEmojiRef = useRef<HTMLButtonElement>(null);
    const dispatch = useDispatch();



    useEffect(() => {
        if (refContent.current && inputRef.current) {
            inputRef.current.style.height = 'auto'; // Reset the height to auto to calculate the new height
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`; // Set the height to the scrollHeight

            refContent.current.style.height = 'auto'; // Reset the height to auto to calculate the new height
            refContent.current.style.height = `${Number(inputRef.current.scrollHeight) + 10}px`; // Set the height to the scrollHeight
        }
    }, [valueState]);

    useEffect(() => setValueState(value), []);



    // ¿El cambio propuesto altera alguna de las dos primeras líneas bloqueadas?
    const isLockedRegionModified = (nextValue: string): boolean =>
        lockFirstTwoLines && getLockedPrefix(nextValue) !== getLockedPrefix(valueState);


    // Avisa por el modal global por qué no se pueden editar las dos primeras líneas
    const notifyLockedEdit = () => {
        dispatch(setConfigModal({
            modalOpen: true,
            title: 'Edición bloqueada',
            description: 'Las dos primeras líneas están protegidas y no se pueden modificar para no alterar los datos del cliente. Puedes editar el texto a partir de la tercera línea.',
            isCallback: null,
            type: 'warning'
        }));
    };


    // Aplica el cambio salvo que toque la zona bloqueada (en ese caso se revierte y se avisa)
    const handleChange = (nextValue: string) => {
        if (isLockedRegionModified(nextValue)) {
            notifyLockedEdit();
            return;
        }
        setValueState(nextValue);
        changeEvent(nextValue);
    };




    return (
        <div className='w-full h-[fit-content] border border-custom-gray  bg-[#d3d3d3]'>
            <div className='w-full p-[.5rem] flex justify-between items-center text-[12px] font-semibold text-gray-500'>
                <p className=''>Texto para el cliente</p>
                {
                    editedBy ? <p>Editado por <span className='font-bold text-primary-700'>{editedBy}</span></p> : null
                }
            </div>



            <div className='paper p-[.5rem_0]' ref={refContent}>
                <div className='paper-content'>
                    <textarea
                        className='w-full h-auto resize-none '
                        style={invalidText === false ? { textDecoration: 'line-through', color: 'black' } : {}}
                        title='Escribe aquí para editar'
                        onChange={e => handleChange(e.target.value)}
                        onBlur={e => changeEvent(e.target.value)}
                        value={valueState}
                        ref={inputRef}
                        disabled={disabled}
                    >
                    </textarea>
                    <hr />
                </div>
            </div>



            <div className='w-full  p-[.5rem]  flex justify-between items-center'>
                <div className='w-full relative'>
                    <button
                        className='flex items-center justify-center'
                        type='button'
                        ref={buttonEmojiRef}
                        title='Insertar emojis'
                    >
                        <Image
                            src='/ico/icons8-winking-face-48.png'
                            width={25}
                            height={25}
                            alt='ico-emoji' />
                    </button>
                    <div className='relative w-full bottom-[-300px]'>
                        <EmojiContainer
                            buttonRef={buttonEmojiRef.current}
                            elementTexttHtml={inputRef.current}
                            getEmoji={(newText: string) => {
                                if (isLockedRegionModified(newText)) {
                                    notifyLockedEdit();
                                    return;
                                }
                                setValueState(newText);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
})
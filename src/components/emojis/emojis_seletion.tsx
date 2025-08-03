'use client';
import React, { useState, useRef, useEffect } from 'react';
import emojis from '@/libs/data/emojis';

type Tprops = {
    getEmoji: (emoji: string) => void;
    buttonRef: HTMLButtonElement | null;
    elementTexttHtml: HTMLInputElement | HTMLTextAreaElement | null;
};

const RECENT_EMOJIS_KEY: string = 'recentEmojis';
const MAX_RECENT_EMOJIS: number = 10;




export default function EmojiContainer({ getEmoji, buttonRef, elementTexttHtml }: Tprops) {

    const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
    const [lastUsedEmoji, setLastUsedEmoji] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    const containEmojisRef = useRef<HTMLDivElement>(null);
    const cursorPositionRef = useRef<{ start: number, end: number } | null>(null);




    // Guardar posición del cursor antes de abrir el emoji picker
    const saveCursorPosition = () => {
        if (!elementTexttHtml) return;
        cursorPositionRef.current = {
            start: elementTexttHtml.selectionStart || 0,
            end: elementTexttHtml.selectionEnd || 0
        };
    };



    // Restaurar posición del cursor
    const restoreCursorPosition = () => {
        if (!elementTexttHtml || !cursorPositionRef.current) return;

        setTimeout(() => {
            elementTexttHtml.selectionStart = cursorPositionRef.current?.start || 0;
            elementTexttHtml.selectionEnd = cursorPositionRef.current?.end || 0;
            elementTexttHtml.focus();
        }, 0);
    };



    // Cargar emojis recientes al inicio
    useEffect(() => {
        const savedRecentEmojis = localStorage.getItem(RECENT_EMOJIS_KEY);
        if (savedRecentEmojis) {
            try {
                const parsed = JSON.parse(savedRecentEmojis);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setRecentEmojis(parsed);
                    setLastUsedEmoji(parsed[0]);
                }
            } catch (e) {
                console.error('Error parsing recent emojis', e);
            }
        }
    }, []);





    // Guardar emojis recientes en localStorage
    useEffect(() => {
        if (recentEmojis.length > 0) {
            localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(recentEmojis));
        }
    }, [recentEmojis]);




    // Manejar clics fuera del contenedor y en el botón de emojis
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containEmojisRef.current && !containEmojisRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false);
                restoreCursorPosition();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick, false);

        const handlerClick = (e: MouseEvent) => {
            saveCursorPosition(); // Guardar posición antes de mostrar
            setShowEmojiPicker(prev => !prev);
        };

        if (buttonRef) buttonRef.addEventListener('click', handlerClick);


        return () => {
            if (buttonRef) {
                buttonRef.removeEventListener('click', handlerClick);
            }
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [buttonRef, showEmojiPicker]);



    // Restaurar posición cuando se muestra el picker
    useEffect(() => {
        if (showEmojiPicker) {
            restoreCursorPosition();
        }
    }, [showEmojiPicker]);




    // Actualizar lista de emojis recientes
    const updateRecentEmojis = (emoji: string) => {
        setRecentEmojis(prev => {
            const withoutCurrent = prev.filter(e => e !== emoji);
            const newRecent = [emoji, ...withoutCurrent];
            return newRecent.slice(0, MAX_RECENT_EMOJIS);
        });
        setLastUsedEmoji(emoji);
    };




    // Insertar emoji en la posición correcta
    const insertEmoji = (emoji: string) => {
        if (!elementTexttHtml || !cursorPositionRef.current) return;

        const { start, end } = cursorPositionRef.current;
        const text = elementTexttHtml.value;

        // Insertar emoji en la posición guardada
        const newText = text.substring(0, start) +
            emoji +
            text.substring(end, text.length);

        elementTexttHtml.value = newText;

        // Actualizar posición del cursor
        const newCursorPos = start + emoji.length;
        elementTexttHtml.selectionStart = newCursorPos;
        elementTexttHtml.selectionEnd = newCursorPos;

        // Notificar al componente padre
        getEmoji(newText);

        // Actualizar emojis recientes
        updateRecentEmojis(emoji);

        // Cerrar el selector
        //setShowEmojiPicker(false);

        // Restaurar foco y posición
        setTimeout(() => {
            elementTexttHtml.focus();
            elementTexttHtml.selectionStart = newCursorPos;
            elementTexttHtml.selectionEnd = newCursorPos;
        }, 0);
    };






    return showEmojiPicker ? (
        <div
            ref={containEmojisRef}
            className='z-[101] absolute w-full h-[300px] bottom-[100%] left-0 bg-white p-3 border rounded-lg shadow-lg flex flex-wrap gap-2 overflow-hidden'
            id='contain-emojis'
        >
            <div className='w-full h-[200px] overflow-y-auto'>
                <div className='w-full p-[.2rem_0.5rem]'>
                    <p className='text-center'>Emojis por categorias</p>
                </div>
                {emojis.map((category, indexCategory) => (
                    <div className='w-full' key={indexCategory}>
                        <div className='w-full'>
                            <p className='text-center text-[#515151] text-sm'>{category.category}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {category.list.map((emoji, index) => (
                                <button
                                    key={`${emoji}${index}`}
                                    className="text-2xl hover:bg-gray-100 rounded-lg p-1 transition-transform hover:scale-125"
                                    onClick={() => insertEmoji(emoji)}
                                    type='button'
                                    aria-label={`Insertar emoji ${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className='w-full h-[100px] overflow-y-auto'>
                <div className='w-full p-[.2rem_0.5rem]'>
                    <p className='text-center'>Recientes</p>
                </div>
                <div className="flex flex-wrap gap-1">
                    {recentEmojis.map((emoji, index) => (
                        <button
                            key={`recent-${index}`}
                            className={`text-2xl p-1 rounded-lg transition-all ${emoji === lastUsedEmoji
                                ? 'bg-blue-100 scale-110 border border-blue-300'
                                : 'hover:bg-gray-100'
                                }`}
                            onClick={() => insertEmoji(emoji)}
                            type='button'
                            aria-label={`Insertar emoji ${emoji}`}
                            title={emoji === lastUsedEmoji ? "Último usado" : ""}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    ) : null;
}
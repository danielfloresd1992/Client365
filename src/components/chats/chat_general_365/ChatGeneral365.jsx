'use client';
import { useEffect } from 'react';



export default function ChatGeneral365({ addAlert }) {




    useEffect(() => {

        addAlert({ title: 'Chat365', description: 'Este es el chat' })
    }, []);




    return (
        <div className='w-full h-full'>
            <h1>Chat365</h1>
        </div>
    )
}
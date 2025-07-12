import Image from 'next/image';


export default function ButtonRadiusBack({ action }){

    return(
        <button 
            className='button-circle smooth'
            style={{
                position: 'fixed',
                right: '50px',
                top: '50px'
            }}
            onClick={ action }
        >
                <Image 
                    src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADeUlEQVR4nO2ZXU/TUBjHz50monJhgAWlW2nXrdt4SQyfQ0ycZt/GCyUYb+BC2CRCNtqNvXQwBihgTCQI8QMQ4gVD1nZt120XoryM5JgzIMG66WQdrsl+yf/iuTk9//Y55znPKQBNmjSpGiIqeawRKQ2MiJVT3GRUKlpjEgRGnLyVk4oUJ0NrTDaWATunuKm4XLTFZUghcQYyYJ9T3LZZuWifVaAN6cwEMAJ0IuuhE8oJnVCgfU6BWhPn6YTWhDUqQRIpIkEinCmpe+ZMIRHiSEERmlnh2MwICsbwnzGG92EM/4SayN7Uf/ILWQ89r5zQ81lIJ5D0M2FhT2VmhJKwaf47FuAnOpk0qZsBx4IqOZJZ6EAGrsSEALsCwjHmT7/AJlPXazbQ5dt6WTJwxSawgAC7/PxGV2DXVLMJ7PXWKJ2Q/4sJzM+nO6fSPTWbuDOy7W4b3S62jW7Di7rseD3+zA1zmKe6Q8IDS1B8gwfF/J9MYJOpjppNtI/tuDvGd4od4zvwXEAn8HD+Ns6KzyyM+KNSOhEjX67V/KB2347b5E0VTd4URAI6g7PifQsj8uW/RPqpLg9p9311m3yposm3W5dCRgTSd8ua8PPfdEklhMmb8nR4d/dAncDRl2DFgzJb7CtgFHBWHCpT7PbrUrHrAY4WdpndyTzNPwZGwRISJrV1AmN4LzAKOCsMaosdNi1sAqNgLhW7Xyu2mRVkYBTosNzy21GcEQ+BUSAC6i3t2cnCGsgAFeYp7QHQEjJQCpER+aH2FIsHhQ1gFIioNFXmKD4OjAAWL7RaI5mCtp8gQplHwAiQMWlY2xR1h8V9tDOBRofkMgMUJx9oOzsinPGBRscRz92zcZKgbU/JqHRERiUcNDI0pw7Y47JQrscmY9IQaFR644VWOqEM03PKYbmLAmtMWicWdWgp9YL+ILc4E1mbc14ddCSVKXpeKVS67aA4eY8Oy7V3YviMuI4F+LVq497l/Hrfch72vkPKwZ63Z1rKQdeiWpJz4VSOClc2tll5j4pLLqAHKA9RIak27l/Jwz6ky5qYUz7RSR3e/Dlo0Iv/BP4W96/m4eVMKEf2hPJc95x3LamlN1Nt3L9agP9iwpFU9x0LqteVrNNW2beSX3Muqh+rjfvfF9Yqm1CPXEs52bWU23QtqmPOZM6NFnZdJt6kSZMmTUAV/ATYzc4C8EyDtAAAAABJRU5ErkJggg==' 
                    width={50}
                    height={30}
                    alt='back'
                />
        </button>
    )
}


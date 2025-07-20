

export default function FixedBottomBar({ children }: any): React.JSX.Element {
    return (
        <footer className='w-full h-[30px] fixed bottom-0 bg-green-600'
            style={{
                zIndex: 1000
            }}
        >
            <div className='relative w-full h-[30px]'>
                {
                    children || (
                        <div className='w-full h-full flex items-center justify-center'>
                            <p className='text-sm text-white'> © {new Date().getFullYear()} Jarvis365. Todos los derechos reservados.</p>
                        </div>
                    )
                }
            </div>
        </footer>
    );
}
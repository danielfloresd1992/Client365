

export default function FixedBottomBar({ children }: any): React.JSX.Element {
    return (
        <footer className='w-full h-[30px] fixed bottom-0 bg-green-400'>
            <div className='relative w-full h-[30px]'>
                {
                    children || (
                        <p className='text-sm'>
                            © {new Date().getFullYear()} Jarvis365. Todos los derechos reservados.
                        </p>
                    )
                }
            </div>
        </footer>
    );
}
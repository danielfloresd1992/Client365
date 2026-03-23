export const metadata = {
    title: 'Detalle del establecimiento',
    description: 'Vista detallada del establecimiento',
};

export default function EstablishmentLayout({ children }) {
    return (
        <section className='w-full h-full overflow-y-auto'>
            {children}
        </section>
    );
}

import AsideNav from './assets/Aide_nav';



export default function UserLayout({ children }) {

    return (
        <div className="w-full flex h-full bg-gray relative">
            <AsideNav />
            <main className="flex-1 p-[0px_.5rem] overflow-hidden">
                <div className="w-full h-full">
                    {/* Contenido Dinámico */}
                    {children}
                </div>
            </main>
        </div>
    );
}




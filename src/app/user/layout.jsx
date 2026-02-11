import Link from 'next/link';

export default function UserLayout({ children, params }) {
  const { id } = params;

  const menuItems = [
    { name: 'Horario y Guardias', path: `/user/${id}/horario`, icon: '📅' },
    { name: 'Consultar Asistencia', path: `/user/${id}/asistencia`, icon: '📊' },
    { name: 'Gestión de Perfil', path: `/user/${id}/config`, icon: '⚙️' },
  ];

    return (
        <div className="w-full flex h-full bg-gray-50">
            {/* Sidebar Fijo */}
            <aside className="w-[300px] h-full bg-slate-900 text-white p-6 sticky top-0">
                <h2 className="text-xl font-bold mb-8 text-blue-200">Panel de Empleado</h2>
                <nav className="space-y-2">
                    {menuItems.map((item) => (
                        <Link 
                            key={item.path} 
                            href={item.path}
                            className="flex text-white items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                        <span>{item.icon}</span>
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </aside>

                {/* Contenido Dinámico */}
            <main className="w-[calc(100%-300px)] flex-1 p-[0px_.5rem]">
                <div className="w-full h-full">
                {children}
                </div>
            </main>
        </div>
    );
}
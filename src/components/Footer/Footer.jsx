import Image from "next/image";

export default function Footer() {
    return (
        <footer className='w-full bg-gradient-to-br from-[#eef6e4] via-[#e3efd2] to-[#d9e8c0] border-t border-[#c8dbae]'>
            <div className='max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6'>
                    {/* Brand column */}
                    <div className='sm:col-span-2 lg:col-span-1 space-y-4'>
                        <Image
                            src='/RBG-Logo-AMAZONAS 365-Original.png'
                            alt='logo-amazonas365'
                            width={200}
                            height={140}
                            className='w-full max-w-[180px] h-auto object-contain'
                        />
                        <p className='text-sm text-slate-600 leading-relaxed'>
                            Gestión y gerencia remota 24/7 los 365 días del año. Tu herramienta para controlar y asegurar la operación diaria de tu negocio.
                        </p>
                    </div>

                    {/* Services column */}
                    <div className='space-y-3'>
                        <h4 className='text-sm font-bold text-slate-800 uppercase tracking-wider'>Plataformas</h4>
                        <ul className='space-y-2'>
                            <li>
                                <a href='/auth' className='text-sm text-slate-600 hover:text-[#4e8300] transition-colors'>
                                    Jarvis365
                                </a>
                            </li>
                            <li>
                                <a href='https://jarvis365reporte.netlify.app/' target='_blank' rel='noreferrer' className='text-sm text-slate-600 hover:text-[#4e8300] transition-colors'>
                                    Reportes365
                                </a>
                            </li>
                            <li>
                                <a href='https://jarvis-express.netlify.app/' target='_blank' rel='noreferrer' className='text-sm text-slate-600 hover:text-[#4e8300] transition-colors'>
                                    JarvisExpress
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Company column */}
                    <div className='space-y-3'>
                        <h4 className='text-sm font-bold text-slate-800 uppercase tracking-wider'>Empresa</h4>
                        <ul className='space-y-2'>
                            <li className='text-sm text-slate-600'>Supervisión operativa</li>
                            <li className='text-sm text-slate-600'>Asistencia gerencial</li>
                            <li className='text-sm text-slate-600'>Reportes estratégicos</li>
                            <li className='text-sm text-slate-600'>Detección de oportunidades</li>
                        </ul>
                    </div>

                    {/* Contact column */}
                    <div className='space-y-3'>
                        <h4 className='text-sm font-bold text-slate-800 uppercase tracking-wider'>Contacto</h4>
                        <a
                            href='https://api.whatsapp.com/send?phone=13038757299&text=%C2%A1Hello!%20I%20want%20more%20info%20about%20%40amazonas365_%20'
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#4e8300] transition-colors'
                        >
                            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'><path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' /></svg>
                            +1 303-875-7299
                        </a>

                        {/* Social links */}
                        <div className='pt-2'>
                            <p className='text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2'>Síguenos</p>
                            <div className='flex items-center gap-3'>
                                <a href='https://www.facebook.com/p/365amazonas-100083619180267/?_rdr' target='_blank' rel='noreferrer' className='w-9 h-9 rounded-lg bg-white/70 border border-[#c8dbae] flex items-center justify-center hover:bg-[#4e8300] hover:border-[#4e8300] group transition-all'>
                                    <Image src='/ico/social/facebook-48.png' width={20} height={20} alt="facebook" className="group-hover:brightness-0 group-hover:invert transition-all" />
                                </a>
                                <a href='https://www.instagram.com/amazonas365_/' target='_blank' rel='noreferrer' className='w-9 h-9 rounded-lg bg-white/70 border border-[#c8dbae] flex items-center justify-center hover:bg-[#4e8300] hover:border-[#4e8300] group transition-all'>
                                    <Image src='/ico/social/instagram-48.png' width={20} height={20} alt="instagram" className="group-hover:brightness-0 group-hover:invert transition-all" />
                                </a>
                                <a href='https://www.linkedin.com/company/amazonas365/?originalSubdomain=es' target='_blank' rel='noreferrer' className='w-9 h-9 rounded-lg bg-white/70 border border-[#c8dbae] flex items-center justify-center hover:bg-[#4e8300] hover:border-[#4e8300] group transition-all'>
                                    <Image src='/ico/social/linkedin-48.png' width={20} height={20} alt="linkedin" className="group-hover:brightness-0 group-hover:invert transition-all" />
                                </a>
                                <a href='https://x.com/amazonas365?lang=es' target='_blank' rel='noreferrer' className='w-9 h-9 rounded-lg bg-white/70 border border-[#c8dbae] flex items-center justify-center hover:bg-[#4e8300] hover:border-[#4e8300] group transition-all'>
                                    <Image src='/ico/social/twitterx-50.png' width={20} height={20} alt="x" className="group-hover:brightness-0 group-hover:invert transition-all" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className='mt-8 sm:mt-10 pt-6 border-t border-[#c8dbae]/60 flex flex-col sm:flex-row items-center justify-between gap-3'>
                    <p className='text-xs text-slate-500 text-center sm:text-left'>
                        &copy; {new Date().getFullYear()} Amazonas365. Todos los derechos reservados.
                    </p>
                    <p className='text-xs text-slate-500'>
                        Tu herramienta los 365 días del año
                    </p>
                </div>
            </div>
        </footer>
    );
}

'use client';
import SharedAside, {
    AsideSection,
    AsideActionButton,
} from '../../assets/SharedAside';


export default function BannerContain({ openClone, reset, establishment = '' }) {

    return (
        <SharedAside
            title='Gestión de horario'
            subtitle={establishment ? establishment.name : 'Horario del local'}
            icon='/ico/icons8-reloj-50.png'
            footerText={establishment ? `Local: ${establishment.name}` : null}
        >
            <AsideSection label='Acciones'>
                <AsideActionButton icon='/ico/icons8-repetir-50.png' label='Resetear' onClick={reset} />
                <AsideActionButton icon='/ico/icons8-agregar-base-de-datos-50.png' label='Clonar horario' onClick={openClone} />
            </AsideSection>
        </SharedAside>
    );
}

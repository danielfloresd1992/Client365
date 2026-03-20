/**
 * Página de Gestión de Gerentes
 * Migración de la vista Pug (crudManager) a Next.js/React
 * Ruta: /clients&manasgement/managers
 */
import { Suspense } from 'react';
import LoandingData from '@/components/loandingComponent/loanding';
import ManagerLayaut from './assets/ManagerLayaut';


export default function ManagersPage() {
    return (
        <Suspense fallback={<LoandingData title='Cargando gerentes' />}>
            <ManagerLayaut />
        </Suspense>
    );
}

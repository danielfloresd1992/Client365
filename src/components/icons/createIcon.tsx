import type { ReactElement, ReactNode } from 'react';
import type { IconProps, IconComponent } from '@/types/icon';

// Fábrica de iconos del set: crea un componente SVG tipado con los defaults
// comunes (24×24, sin relleno, trazo `currentColor` de 2px con puntas
// redondeadas). Las props del llamador se aplican DESPUÉS de los defaults, así
// se pueden sobreescribir: `size`, `className` (Tailwind), `color`,
// `strokeWidth`, `onClick`, `aria-*`, `style`, etc.
//
// Uso: export const BellIcon = createIcon('BellIcon', <>…paths…</>);
// Luego: <BellIcon />  ·  <BellIcon size={18} className="text-rose-500" />
export function createIcon(displayName: string, paths: ReactNode): IconComponent {
    const Icon = ({ size = 24, ...props }: IconProps): ReactElement => (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width={size}
            height={size}
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
            {...props}
        >
            {paths}
        </svg>
    );
    return Object.assign(Icon, { displayName });
}

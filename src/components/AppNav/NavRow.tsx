import Link from 'next/link';
import type { ReactElement } from 'react';
import type { NavItem } from '@/config/nav.types';
import type { AppDockTheme } from './appDock.theme';
import { navigationIconFor } from './navigationIconRegistry';

/**
 * Una fila del menú: icono y etiqueta que aparece al expandir el riel.
 *
 * No sabe qué iconos existen ni cómo se ve el dock. Lo primero se lo pregunta
 * al registro, lo segundo llega por el tema — así, agregar un icono con
 * necesidades propias o cambiar los colores no obliga a tocar este archivo.
 */
export default function NavRow({ item, active, theme }: {
    item: NavItem;
    active: boolean;
    theme: AppDockTheme;
}): ReactElement {

    const { Icon, selfColored, size } = navigationIconFor(item.icon);

    // El teñido lleva el icono a blanco sobre la fila activa. Los que traen su
    // propio color quedan afuera: el filtro los borraría.
    const tinte = active && !selfColored ? theme.iconActiveTint : '';

    return (
        <Link
            href={item.path}
            title={item.name}
            aria-current={active ? 'page' : undefined}
            className={`${theme.row} ${active ? theme.rowActive : theme.rowInactive}`}
        >
            <span className={`${theme.iconBox} ${tinte}`}>
                <Icon size={size ?? theme.iconSize} />
            </span>
            <span className={`${theme.label} ${active ? theme.labelActive : ''}`}>
                {item.name}
            </span>
        </Link>
    );
}

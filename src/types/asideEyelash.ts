import type { ReactNode } from 'react';

export type Prop = {
    position: 'l' | 'r' | undefined
    title: string,
    urlIco: string | undefined | null
    eyelash: 0 | 1 | 2 | 3
    open: true | undefined
    children: ReactNode | ((addAlert: any) => ReactNode);
    scrollY: Boolean,
    isDrag: boolean,
}

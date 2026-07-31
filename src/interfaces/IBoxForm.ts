interface Iprops {
    close: () => void,
    idLocal: string,
    dayNumber: number | undefined,
    pushDateDay: (day: Day) => void,
    /** Rango existente a editar; si viene, el formulario abre precargado. */
    initial?: Day | null,
}

interface Hours {
    start: string;
    end: string;
}

interface Day {
    key: string;
    hours: Hours;
    dayMonitoring: number | undefined;
    idLocal: string;
    type: 'analytical' | 'perimeter';
}

export type { Iprops, Hours, Day }

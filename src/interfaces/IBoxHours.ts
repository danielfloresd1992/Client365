interface Hour {
    start: string;
    end: string;
}

interface Item {
    key: string;
    hours: Hour;
    type?: 'analytical' | 'perimeter';
}

interface BoxHoursProps {
    arr: Item[];
    deleteHour: (key: string) => void;
    /** Si viene, la tarjeta del rango es clickeable y abre el formulario de edición. */
    onEdit?: (item: Item) => void;
}

export type { Hour, Item, BoxHoursProps }

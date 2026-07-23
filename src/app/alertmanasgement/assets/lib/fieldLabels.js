/**
 * Etiquetas legibles de los campos del documento Menu (alerta).
 *
 * Se usan para traducir las claves que viaja la auditoría (`updateByUser.change[].key`
 * y `lastEditors[].changedFields`) a texto entendible en la UI: tanto en la lista
 * (quién cambió qué) como en el historial dentro del formulario.
 */
const FIELD_LABELS = {
    es:                               'Título ES',
    en:                               'Título EN',
    titleForDocumentReport:           'Título de reporte',
    textHeader:                       'Encabezado',
    especial:                         'Tiempo especial',
    amountOfSomething:                'Contador',
    table:                            'Mesa',
    time:                             'Tiempo',
    timeUnique:                       'Tiempo único',
    category:                         'Categoría',
    isArea:                           'Área',
    managerReferenceTitle:            'Ref. gerente (título)',
    managerReferenceId:               'Ref. gerente',
    isDescriptionPerson:              'Descripción de persona',
    photos:                           'Fotos',
    car:                              'Vehículo',
    rulesForBonus:                    'Bono (antiguo)',
    bonusCalculationRules:            'Bono',
    useOnlyForTheReportingDocument:   'Uso en reporte',
    useOfLiveAlertForTheCustomer:     'Alerta en vivo',
    noSubtitleInTheReport:            'Sin subtítulo',
    groupingInTheReport:              'Agrupación',
    descriptionNoteForReportDocument: 'Nota de reporte',
    doesItrequireVideo:               'Requiere video',
};

/** Devuelve la etiqueta legible de un campo; si no está mapeado, la clave cruda. */
const labelFor = key => FIELD_LABELS[key] ?? key;

export { FIELD_LABELS, labelFor };

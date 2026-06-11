'use strict';
/**
 * objectDefaultClient — valores por defecto de un establecimiento nuevo.
 * Usado por FormClient.jsx en modo creación.
 */
const clientDefault = {
    location: '',
    franchise: '',
    name: '',
    idLocal: '',
    franchiseReference: {
        name_franchise: '',
        franchise: '',
    },
    isActive: true,
    typeMonitoring: '',
    lang: '',
    touchs: {
        totalManager: '',
        totalAttendee: '',
        typeEvaluationTouch: '',
        isRequiredeEvaluation: false,
        isEvaluationGroup: false,
    },
    timestamps: {
        createdAt: {},
        updatedAt: [],
    },
    alertLength: 'extended',
    image: '',
};

export default clientDefault;

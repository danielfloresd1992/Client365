'use strict';
/**
 * objectDefaultClient — valores por defecto de un establecimiento nuevo.
 * Usado por FormClient.jsx en modo creación.
 */
const clientDefault = {
    
    establishment: {
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
    },

    timeServices: {
        TableCleaning: '00:00:00',
        firstAtenttion: '00:00:00'
    }

};

export default clientDefault;

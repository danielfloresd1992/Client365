'use strict';
const clientDefault = {
    location: '',
    franchise: '',
    name: '',
    idLocal: '',

    franchiseReference:{
        name_franchise: '',
        franchise: ''
    },

    isActive: true,

    status: 'activo',
    typeMonitoring: '',
    order: '',
    lang: '',

    touchs: {
        totalManager: '',
        totalAttendee: '',
        typeEvaluationTouch: '',
        isRequiredeEvaluation: false,
        isEvaluationGroup: false
    },

    dishMenu: {  
        appetizer: '',
        mainDish: '' ,
        dessert: '',
        
        dishEvaluation: '',
        isRequiredeEvaluation: false,
        isEvaluationGroup: false
    },


    timestamps: {
        createdAt : {},
        updatedAt : []
    },


    alertLength: 'extended',

    
    image: ''
};

export default clientDefault;
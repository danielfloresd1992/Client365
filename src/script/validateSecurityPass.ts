import  { SecurityLevel } from '@/types/types_for_utility';


const returnColorStyle: any = {
    '-1': 'red',
    '0': 'gray',
    '1': 'red',
    '2': 'orange',
    '3': 'yellow',
    '4': 'green'
};







const validateSecurityPass = (pass: string | undefined):SecurityLevel => {
    if(!pass) throw new Error('params type string is undefined');

    let securityLevel: SecurityLevel = { level: 0, msm: 'La contraseña debe Tener mayúsculas y minúsculas' , pass: false, color: 'gray' };

    const REGEX_UPPERCASE_AND_LOWERCASE: RegExp = new RegExp('^(?=.*[A-Z])(?=.*[a-z]).+$');
    const REGEX_NUMERICAL: RegExp = new RegExp('^(?=.*\\d).+$');
    const CHART_ESPECIAL: RegExp = new RegExp('^(?=.*[-+_!@#$%^&*.,?]).+$');

    
    if(REGEX_UPPERCASE_AND_LOWERCASE.test(pass)){  
        securityLevel.level = securityLevel.level + 1;
    }
    else{
        securityLevel.msm = 'La contraseña debe Tener mayúsculas y minúsculas';
    }

    if(REGEX_NUMERICAL.test(pass)){  
        securityLevel.level = securityLevel.level + 1;
    }
    else{
        securityLevel.msm = 'Debe tenter caracteres numéricos';
    }


    if(CHART_ESPECIAL.test(pass)){  
        securityLevel.level = securityLevel.level + 1;
    }
    else{
        securityLevel.msm = 'Debe tenter caracteres especiales';
    }

    if(pass.length > 7){
        securityLevel.level = securityLevel.level + 1;
    }
    else{
        securityLevel.msm = 'La contraseña debe tener como mínimo 8 caracteres';
    }

    if(securityLevel.level < 0) securityLevel.level = 0;
    if(securityLevel.level === 4){
        securityLevel.pass = true;
        securityLevel.msm = 'Contraseña segura';
    }

    
        

    if(pass.indexOf(' ') > -1){
        securityLevel.level = -1;
        securityLevel.pass = false;
        securityLevel.msm = 'no puede haber espacios vacíos';
    }


    securityLevel.color = returnColorStyle[ Number(securityLevel.level) ];



    return securityLevel;
};


export default validateSecurityPass;
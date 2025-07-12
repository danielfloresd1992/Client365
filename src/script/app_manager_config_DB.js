'use client'; 

export default class AppManagerConfigStorange{

    static nameDataBase = 'AppManagerConfig';

    static set = (item, value) => {
        
        let getDataBase = this._private_management_database();

        getDataBase[item] = value;
        const resSave = JSON.stringify(getDataBase);
        localStorage.setItem(this.nameDataBase, resSave);
    }

    static get(item){
        const isExistsDataBase = this._private_management_database();
        if(!isExistsDataBase){ 
            return null;
        }
        else{
            const isExistsItem = isExistsDataBase[item];
            if(isExistsItem){
                return isExistsDataBase[item];
            }
            return null;
        }
    }

    static _private_management_database(){
        const isExistsDataBase = localStorage.getItem(this.nameDataBase);
        if(!isExistsDataBase){ 
            localStorage.setItem(this.nameDataBase, '{}');
            return {}
        }
        else{
            return JSON.parse(isExistsDataBase);
        }
    }
}
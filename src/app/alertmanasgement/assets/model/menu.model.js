import axiosStand from '@/libs/ajaxClient/axios.fetch';




const getMenuAll = (category, callback) => {
    // withAudit=true → el backend agrega createdBy (creador) y lastEditors
    // (últimas 3 personas que editaron). Opt-in para no inflar otros consumidores.
    axiosStand.get(`/menu?withAudit=true`)
        .then(response => {
            let menuList = [];
            const categoryList = [];
            response.data.forEach(menu => {
                if (categoryList.indexOf(menu.category) < 0) {
                    categoryList.push(menu.category);
                }
                // Normalización defensiva: la UI nunca recibe undefined aunque el
                // backend aún no traiga la autoría (docs viejos / sin desplegar).
                const normalized = {
                    ...menu,
                    createdBy: menu.createdBy ?? null,
                    lastEditors: Array.isArray(menu.lastEditors) ? menu.lastEditors : []
                };
                if (category === 'all') {
                    menuList.push(normalized);
                }
                else if (menu.category === category) {
                    menuList.push(normalized);
                }
            });

            callback(null, { menuList, categoryList });
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        })
};




const getMenuById = (id, callback) => {
    axiosStand.get(`/menu/id=${id}`)
        .then(response => {
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        });
};




const sendMenu = (body, callback) => {
    axiosStand.post(`/menu`, body)
        .then(response => {
            console.log()
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        });
};




const putMenu = (body, callback) => {
    axiosStand.put(`/menu/put`, body)
        .then(response => {
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        });
};




const deleteMenu = (id, callback) => {
    axiosStand.delete(`/menu/id=${id}`)
        .then(response => {
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        })
};




// Bloquea o desbloquea una alerta (solo administradores). Con isLocked en
// true, el backend rechaza la edición y el borrado del documento con 423.
const lockMenu = (id, isLocked, callback) => {
    axiosStand.patch(`/menu/lock/id=${id}`, { isLocked })
        .then(response => {
            callback(null, response);
        })
        .catch(err => {
            console.log(err);
            callback(err, null);
        });
};




const getLocalLigth = async callback => {
    try {
        const listLocal = await axiosStand.get(`/localLigth`);
        callback(null, listLocal.data);
    }
    catch (err) {
        callback(err);
    }
}




export { getMenuAll, getMenuById, sendMenu, putMenu, deleteMenu, lockMenu, getLocalLigth };
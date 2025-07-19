
export type FetchOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
};



export type FranchiseT =
    | { resource: '/franchise', method: 'post', body: any }
    | { resource: '/franchise', method: 'get' }
    | { resource: `/franchise/establishments/${string}`, method: 'get' }
    | { resource: `/franchise/${string}`, method: 'delete', body: any };

export type EstablishmentT =
    | { resource: '/localLigth', method: 'get' }
    | { resource: '/establishment', method: 'get' }
    | { resource: `/establishment?AllEstablishment=${string}`, method: 'get' }
    | { resource: `/local/id=${string}`, method: 'get' }
    | { resource: `/local/id=${string}?populate=dishes`, method: 'get' }
    | { resource: `/local`, method: 'post', body: any }
    | { resource: `/local/${string}`, method: 'put', body: any }
    | { resource: `/local/${string}?populate=dishes`, method: 'put', body: any };

export type MenuT =
    | { resource: '/menu', method: 'get' }
    | { resource: `/menu/id=${string}`, method: 'get' }
    | { resource: '/menu', method: 'post', body: unknown }
    | { resource: '/menu', method: 'put', body: unknown | undefined }
    | { resource: `/menu/id=${string}`, method: 'delete', body: any };

export type NoveltyT =
    | { resource: `/user/publisher/paginate=${number}/items=10`, method: 'get' }
    | { resource: `/user/publisher/delete=${string}`, method: 'delete', body: any }
    | { resource: `/novelties/img/id=${string}`, method: 'get' }
    | { resource: `/novelties/id=${string}`, method: 'put', body: any };

export type Dish =
    | { resource: `/dishes?id=${string}`, method: 'post', body: any }
    | { resource: `/dishes?id=${string}`, method: 'delete', body: any };





export type FailedMonitoringT = '/failed/all';
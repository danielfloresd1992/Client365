'use client';
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/libs/ajaxClient/axios.fetch';



import { FetchOptions, FranchiseT, EstablishmentT, MenuT, NoveltyT, Dish, FailedMonitoringT } from '@/types/recourseData';


type FetchState = {
    data: any;
    loading: boolean;
    error: any;
    ok: boolean | null;
};


type ApiEndpoint = FranchiseT | EstablishmentT | MenuT | NoveltyT | Dish;







export function useSingleFetch<T extends ApiEndpoint>(endpoint: T, initFetch: boolean | undefined): FetchState & { fetchData: () => void } {

    const [state, setState] = useState<FetchState>({
        data: null,
        loading: true,
        error: null,
        ok: false,
    });

    useEffect(() => {
        if (!state.data && endpoint.method === 'get' && initFetch) fetchData();
    }, []);

    const fetchData = async () => {
        try {
            let response;
            if (endpoint.method === 'post') response = await axiosInstance.post(endpoint.resource, endpoint?.body);
            else if (endpoint.method === 'delete') response = await axiosInstance.delete(endpoint.resource);
            else if (endpoint.method === 'put') response = await axiosInstance.delete(endpoint.resource, endpoint?.body);
            else response = await axiosInstance.get(endpoint.resource);

            setState({ data: response.data, loading: false, error: null, ok: true });
            console.log('hola')

        }
        catch (err) {
            console.log(err);
            setState({ data: null, loading: false, error: err, ok: false });
        }
    };

    return { ...state, fetchData };
}






/// for paginate scroll infinity
export function useFetch<T = unknown>(url: string, options?: FetchOptions): any {

    const [state, setState] = useState<FetchState>({
        data: null,
        loading: true,
        error: null,
        ok: false
    });

    const fetchData = useCallback(async (urlNew: string) => {
        try {
            const response = options?.method === 'POST'
                ? await axiosInstance.postForm(urlNew ? urlNew : url, options?.body)
                : await axiosInstance.get(urlNew ? urlNew : url);
            setState(preState => {
                if (Array.isArray(preState.data)) {
                    return { data: [...preState.data, ...response.data], loading: false, error: null, ok: true }

                }
                else {
                    return { data: [...response.data], loading: false, error: null, ok: true }
                }
            });
        }
        catch (err) {
            console.log(err);
            setState({ data: null, loading: false, error: err, ok: false });
        }
    }, [state]);


    const setItem: (item: any, position: 'shift' | 'push') => void = useCallback((item, position) => {
        setState((preState: any) => {
            if (Array.isArray(preState.data)) {
                if (position === 'shift') return { ...preState, data: [item, ...preState.data] }
                else if (position === 'push') return { ...preState, data: [...preState.data, item] };
            }
            else return [{ ...preState, data: [item] }]
        });

    }, [state]);


    return { ...state, fetchData, setItem };
}

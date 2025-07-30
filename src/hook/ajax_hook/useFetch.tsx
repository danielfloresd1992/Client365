'use client';
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/libs/ajaxClient/axios.fetch';



import { FetchOptions, FranchiseT, EstablishmentT, MenuT, NoveltyT, Dish, FailedMonitoringT, Chat } from '@/types/recourseData';


type FetchState = {
    data: any;
    loading: boolean;
    error: any;
    ok: boolean | null;
};


type ApiEndpoint = FranchiseT | EstablishmentT | MenuT | NoveltyT | Dish | Chat;







export function useSingleFetch<T extends ApiEndpoint>(endpoint: T, initFetch: boolean | undefined): FetchState & { fetchData: (url: string | null, method: string | null) => void, resetDataFetch: any, setChangeData: any } {

    const [state, setState] = useState<FetchState>({
        data: null,
        loading: true,
        error: null,
        ok: false,
    });



    useEffect(() => {
        if (!state.data && endpoint.method === 'get' && initFetch) fetchData(null, null);
    }, []);




    const fetchData = async (url: string | undefined | null, method: string | undefined | null): Promise<void> => {
        try {
            let response;

            if (method ?? endpoint.method === 'post') response = await axiosInstance.post(url ?? endpoint.resource, endpoint?.body);
            else if (method ?? endpoint.method === 'delete') response = await axiosInstance.delete(url ?? endpoint.resource);
            else if (method ?? endpoint.method === 'put') response = await axiosInstance.delete(url ?? endpoint.resource, endpoint?.body);
            else response = await axiosInstance.get(url ?? endpoint.resource);
            setState({ data: response.data, loading: false, error: null, ok: true });
        }
        catch (err) {
            console.log(err);
            setState({ data: null, loading: false, error: err, ok: false });
        }
    };




    const setChangeData = (data: unknown) => {
        setState({ ...state, data: data });
    };




    const resetDataFetch = () => {
        setState({ ...state, data: null });
    };




    return { ...state, fetchData, resetDataFetch, setChangeData };
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

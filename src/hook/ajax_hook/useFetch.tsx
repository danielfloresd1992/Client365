'use client';
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/libs/ajaxClient/axios.fetch';



import { FetchOptions, FranchiseT, EstablishmentT, MenuT, NoveltyT, Dish, FailedMonitoringT, Chat } from '@/types/recourseData';
import axios from 'axios';


type FetchState = {
    data: any;
    loading: boolean;
    error: any;
    ok: boolean | null;
};



type TFetchData = {
    url: string | undefined | null,
    method: string | undefined | null,
    autoGetData: boolean,
    callback: any,
    body?: any
}



type ApiEndpoint = FranchiseT | EstablishmentT | MenuT | NoveltyT | Dish | Chat;







export function useSingleFetch<T extends ApiEndpoint>(endpoint: T, initFetch: boolean | undefined): FetchState & { fetchData: any, resetDataFetch: any, setChangeData: any } {

    const [state, setState] = useState<FetchState>({
        data: null,
        loading: true,
        error: null,
        ok: false,
    });



    useEffect(() => {
        if (!state?.data && endpoint?.method === 'get' && initFetch) fetchData({ url: null, method: null, autoGetData: true, callback: null });
    }, []);




    const fetchData = useCallback(async ({ url, method, autoGetData = true, callback, body }: TFetchData): Promise<void> => {
        try {
            const objectRequest: any = { method: method ?? endpoint.method, url: url ?? endpoint.resource }
            if (body) objectRequest.data = body;
            let response = await axiosInstance(objectRequest);

            if (typeof callback === 'function') {
                callback(response);
            }
            else {
                if (autoGetData) setState({ data: response.data, loading: false, error: null, ok: true });
            }
        }
        catch (err) {
            console.log(err);
            callback(null, err);
            setState({ data: null, loading: false, error: err, ok: false });
        }
    }, [state, endpoint]);




    const setChangeData = useCallback((data: any) => {
        setState({ ...state, data: data });
    }, [state]);




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

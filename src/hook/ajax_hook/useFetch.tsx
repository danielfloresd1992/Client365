'use client';
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/libs/ajaxClient/axios.fetch';
import { AxiosResponse, AxiosError } from 'axios';




type FetchState = {
    data: any;
    loading: boolean;
    error: any;
    ok: boolean | null;
};




type FetchOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
};


type FranchiseT = 'franchise'

type EstablishmentT = '/establishment' | `/establishment?AllEstablishment=${string}` | `/local/id=${string}`

type NoveltyT = `/user/publisher/paginate=${number}/items=10`

type FailedMonitoringT = '/failed/all';

type AllRecurses = EstablishmentT | FranchiseT | NoveltyT | FailedMonitoringT;






export function useSingleFetch<T = unknown>(url: AllRecurses, options?: FetchOptions): FetchState {


    const [state, setState] = useState<FetchState>({
        data: null,
        loading: true,
        error: null,
        ok: false
    });



    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = options?.method === 'POST'
                    ? await axiosInstance.post(url, options?.body)
                    : await axiosInstance.get(url);
                setState({ data: response.data, loading: false, error: null, ok: true });
            }
            catch (err) {
                console.log(err);
                setState({ data: null, loading: false, error: err, ok: false });
            }
        };

        fetchData();
    }, [url, options?.method, options?.body]);


    return state;
}



/// for paginate scroll infinity
export function useFetch<T = unknown>(url: AllRecurses, options?: FetchOptions): any {


    const [state, setState] = useState<FetchState>({
        data: null,
        loading: true,
        error: null,
        ok: false
    });




    const fetchData = useCallback(async (urlNew: string) => {
        try {
            console.log(urlNew);
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



    const setItem = useCallback((item: any, position: 'shift' | 'push') => {

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

'use client';
import { useState, useEffect } from 'react';
import axiosInstance from '@/libs/axios.fetch';
import { AxiosResponse, AxiosError } from 'axios';




type FetchState<T> = {
    data: T | null;
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



export function useFetch<T = unknown>(url: EstablishmentT | FranchiseT, options?: FetchOptions): FetchState<T> {


    const [state, setState] = useState<FetchState<T>>({
        data: null,
        loading: true,
        error: null,
        ok: false
    });



    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = options?.method === 'POST'
                    ? await axiosInstance.post<T>(url, options?.body)
                    : await axiosInstance.get<T>(url);
                setState({ data: response.data, loading: false, error: null, ok: true });
            }
            catch (err) {
                setState({ data: null, loading: false, error: err, ok: false });
            }
        };

        fetchData();
    }, [url, options?.method, options?.body]);


    return state;
}

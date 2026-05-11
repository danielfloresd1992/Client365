import { useState, useEffect } from 'react';

import useAxios from '@/hook/useAxios';




export default function ListManager({ list }) {





    return (
        <div>
            {
                list.length > 0 && list.map(manager => {

                    return (
                        <Manager id={manager} key={manager} />
                    );
                })
            }
        </div>
    );
}





function Manager({ id }) {


    const [stateData, setStateData] = useState(null);
    const { requestAction } = useAxios();


    useEffect(() => {

        requestAction({ url: `/managerLocalAndImgById/id=${id}`, action: 'GET' })
            .then(response => {
                setStateData(response.data[0]);
            })
            .catch(err => {
                console.log(err);
            })

    }, [id]);




    return (
        <ul>
            <li><p className='text-black text-[.8rem]'>{stateData?.burden} {stateData?.name}</p></li>
        </ul>
    );
}


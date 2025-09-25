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


    console.log(id);
    console.log(stateData);


    return (
        <div>
            <p>{stateData?.burden} {stateData?.name}</p>
        </div>
    );
}


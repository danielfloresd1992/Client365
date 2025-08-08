'use client';
import { useSelector } from 'react-redux';




export default function Img({ idLocal }) {



    const client = useSelector(store => {
        console.log(store);
        return store.clients.filter(client => client._id === idLocal);
    });


    console.log(client);

    return (
        <img
            className=''
            src={client[0] && client[0].image ? client[0].image : '/food-restaurant-logo-design-with-spoon-fork-and-plate-symbol-with-circle-shape-vector.jpg'}
            onClick={() => {
                // setImg( localImgLogoReg.current.src );
            }}
        />
    );
}




export default function Break_layaut({ width = '100%', height = '100%', children }) {



    return (
        <>
            <style>
                {`  
                    .break-layaut{
                        width: 100%;
                        height: 100%
                    }


                    @media (min-width: 640px) {
                        .break-layaut{
                            width: ${width};
                            height: ${height}
                        }
                    }
                `}
            </style>
            <div className='break-layaut'>{children}</div>
        </>

    );
}
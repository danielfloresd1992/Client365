


export default function Section({ spaceToSubtract = 0, children }) {


    return (
        <>
            <style>
                {`
                    .section-layout{
                        height: 100%;
                        width: 100%; 
                        overflow-y: scroll;
                    }
                    @media (min-width: 640px) {
                        .section-layout{
                            width:calc(100% - ${spaceToSubtract}px) ; 
                        }
                    }
                `}
            </style>


            <section className='section-layout'>
                {children}
            </section>
        </>
    )
}
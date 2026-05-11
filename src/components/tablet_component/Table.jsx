

const styleCell = {
    fontSize: '.9rem'
};


export default function Table({ dataHead, children }) {


    return (
        <div className='h-full __width-complete contain-between scrolltheme1 containForTableOne __paddingNone'
            style={{ alignItems: 'flex-start' }}
        >
            <table className='h-full __width-complete tabletOne __border-none'>
                <thead className='__width-complete __border-button'>
                    <tr>
                        {
                            dataHead.map((item, index) => (
                                <th style={styleCell} key={index}>
                                    {item}
                                </th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    );
}
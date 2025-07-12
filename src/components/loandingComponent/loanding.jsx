export default function LoandingData({title, style = {}}){

    return(
        <div className='__width-complete __center_center' style={{ height: '100%', width: '100%', position: 'absolute', ...style }}>
            <div className='__center_center columns' style={{ gap: '1rem' }}>
                <div className='loader-sniper'>
                </div>
                <h3 className='text-intermittence' style={{ color: '#676767', textAlign: 'center' }} >{title}</h3>
            </div>
        </div>
    )
}
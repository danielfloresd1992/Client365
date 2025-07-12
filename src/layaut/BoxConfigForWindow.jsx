

export default function BoxConfigForWindow({ titleText = null, children}){
    
    return(
        <div className='__center_center columns __oneGap'>
            {
                titleText ? <h4 className='__text-center'>{ titleText }</h4> : null
            }
            {children}
        </div>
    )
}
'use client';


export default function BoxButtonAddItem({ day, openSetForm }){


    return(
        <div 
            className='contain-btn'
            style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '1rem .9rem',
            }}
            onClick={() => openSetForm(day)}>
            <button 
                style={{
                    width: '20px',
                    height: '20px',
                    color: '#fff',
                    fontWeight: 'bold',
                    backgroundColor: '#696969',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
            }} 
            className='btn-quad'
            type='button'
            >+</button>
        </div>
        
    )
};
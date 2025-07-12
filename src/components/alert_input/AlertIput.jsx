import Content from './assets/Content.jsx';



export default function AlertInputLive(){

    
    return(
        <div
            style={{
                position: 'fixed',
                backgroundColor: '#fff',
                height: '40px',
                overflow: 'hidden',
                top: '50px',
                boxShadow: 'rgb(0 0 0) 0px 12px 17px 2px',
                overflowX: 'hidden',
                zIndex: '2000',
                gap: '1rem'
            }}
            className='smooth scrolltheme1'
        >
            <Content />
        </div>
    );
}
import BannerConfigAlert from './BannerConfig';
import ContainForm from './ContainForm/ContentForm.jsx';


export default function Content(){

    return(
        <div
            className='__height-complete'
            style={{
                width: '570px', 
                position: 'relative',
                zIndex: 1000
            }}
        >
            <BannerConfigAlert />
            <ContainForm />
        </div>
    );
}
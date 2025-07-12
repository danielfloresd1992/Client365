
const style = {
    position: 'relative',
    width: '100%',
    backgroundColor: 'var(--bannerColor)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '.5rem',
};

export default function BannerBetween({ children }){
    return(
        <div style={ style }>{ children }</div>
    );
}
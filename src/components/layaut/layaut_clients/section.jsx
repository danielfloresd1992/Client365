



export default function ContentResponsive({ id = null, children }) {




    return (
        <article id={id} className='section-client'>{children}</article>
    );
}
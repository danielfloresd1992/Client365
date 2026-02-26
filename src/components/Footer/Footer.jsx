import Image from "next/image";


export default function Footer() {


    return (
        <footer className='footer-component __center_center columns'>

            <div className='footer-component-hight __center-center columns __oneGap'>
                <Image src='/RBG-Logo-AMAZONAS 365-Original.png' alt='logo-amazonas' width={500} height={350} />
            </div>

            <div className='footer-component-low'>
                <div className='__padding1rem'>
                    <b className='footer-follow-title __text-center'>Síguenos en</b>
                </div>
                <div className='footer-social __center_center'>
                    <div><a className='footer-social-link' href='https://www.facebook.com/p/365amazonas-100083619180267/?_rdr'><Image src='/ico/social/facebook-48.png' width={40} height={40} alt="facebook-amazonas365" className="icoImage" /></a></div>
                    <div><a className='footer-social-link' href='https://www.instagram.com/amazonas365_/'><Image src='/ico/social/instagram-48.png' width={40} height={40} alt="instagram-amazonas365" className="icoImage" /></a></div>
                    <div><a className='footer-social-link' href='https://www.linkedin.com/company/amazonas365/?originalSubdomain=es'><Image src='/ico/social/linkedin-48.png' width={40} height={40} alt="linkedin-amazonas365" className="icoImage" /></a></div>
                    <div><a className='footer-social-link' href='https://x.com/amazonas365?lang=es'><Image src='/ico/social/twitterx-50.png' width={40} height={40} alt="x-amazonas365" className="icoImage" /></a></div>
                </div>
            </div>

        </footer>
    );
}
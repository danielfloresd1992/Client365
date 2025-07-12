import Image from "next/image"; 


export default function Footer(){


    return(
        <footer className='footer-component __center_center columns'>
            
            <div className='footer-component-hight __center-center columns __oneGap'>
                <Image src='/RBG-Logo-AMAZONAS 365-Original.png' alt='logo-amazonas' width={500} height={350}/>
            </div>

            <div className='footer-component-low'>
            <div className='__padding1rem'>
                    <b className='__text-center'>Siguenos en</b>
                </div>
                <div className='__center_center' style={{ justifyContent: 'space-around', width: '30%' }}>
                    <div><a href='https://www.facebook.com/p/365amazonas-100083619180267/?_rdr'><Image src='/ico/social/facebook-48.png' width={40} height={40} alt="hola" className="icoImage"/></a></div>
                    <div><a href='https://www.instagram.com/amazonas365_/'><Image src='/ico/social/instagram-48.png' width={40} height={40} alt="hola" className="icoImage"/></a></div>
                    <div><a href='https://www.linkedin.com/company/amazonas365/?originalSubdomain=es'><Image src='/ico/social/linkedin-48.png' width={40} height={40} alt="hola" className="icoImage"/></a></div>
                    <div><a href='https://x.com/amazonas365?lang=es'><Image src='/ico/social/twitterx-50.png' width={40} height={40} alt="hola" className="icoImage"/></a></div>
                </div>
                <div className='w-full bg-[#212121] absolute bottom-0 p-4'>
                    <p className='__text-center'>Copyright © 2024 Amazonas 365 | Powered by Amazonas365 IT</p>
                </div>
            </div>

            
        </footer>
    );
}
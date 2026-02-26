import Image from "next/image";
import Link from "next/link";

export default function LiItemGrey({ urlImage = '', textTitle = '', urlLink = '#' }) {


    return (
        <li>
            <Link href={urlLink}>
                <div className='listRoute-a lobby-route-item'>
                    <div className='listRoute-img lobby-route-icon'>
                        <Image unoptimized src={urlImage} alt={`ico-${textTitle}`} width={18} height={18} className='lobby-route-icon-img' />
                    </div>
                    <p className='__textGrayForList lobby-route-text'>{textTitle}</p>
                </div>
            </Link>
        </li>
    );
}

import Image from "next/image";
import Link from "next/link";

export default function LiItemGrey({ urlImage = '', textTitle = '' , urlLink='#'}){


    return(
        <li>
            <Link href={ urlLink }>
                <div className='listRoute-a'>
                    <div className='listRoute-img'>
                        <Image unoptimized src={ urlImage } alt={`ico-${textTitle}`} width={ 20 } height={ 20 } style={{filter: 'opacity(0.4)'}} />
                    </div>
                    <p className='__textGrayForList'>{ textTitle }</p>
                </div>
            </Link>
        </li>
    );
}

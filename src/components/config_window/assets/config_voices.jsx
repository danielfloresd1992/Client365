'use client';


import InputBorderBlue from '@/components/inpust/InputBorderBlue';

import BoxConfigForWindow from '@/layaut/BoxConfigForWindow';
import { useState, useEffect } from 'react';
import useSpeckAlert from '@/hook/useSpeckAlert';



export default function SectionConfigVoice() {


    const { listVoicesState, voice_definitive, changeVoice, changueVolume, volumeState } = useSpeckAlert();




    const renderImg = number => {
        if (Number(number) < 0.1) {
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFdElEQVR4nN2aa4gcRRCAq3yQxKBo4sXXSXzs3Xbt6W7wwCiip4KJKIlGWc1t1dx5+RHjjwM1RIggKqiIqAiCouCDSCToLwO+oh4ql0QTTaJGT84YJcSIGnyhkZDDSM/0zt7u9OzM7M6ungX7Y7e6q/ubrq6q7llAkhEk3gS54iyYyoIko0hyGEk+ntowhcHjUckWF0bJdlDObJiykivO0iuS2sr0Lj8GlTyGxHuRZB+Q3AFTDiYz1IGKdxg7/geIb4ApA5MZ6kCST42bvgfU3wU5vtl8fxnaKrkGYbr7T0TiT8yk39bu5f6u+DzfVlzJDHVAjxSg7TAaouxOkyFcW6V5fiCJKaj4CW9sXg/dcmZ7YJQzuwLBb0FncUa1neQgQHItkhwwYx8Acla0NjRrPfFW8/Q2BCAaBdGS4U5UvMYPGIrXWO03DVMFIW+GDtIoSFlywpXV4Q2QGZ4G6bmZZFDxtkiINEC05PrPR5KfzMq8BFA8ElKBUXLIPKE3YO7g9Pr9YoBklx2rbSHxo5Dh46xtVKkXSX41tu5vHKQWRm/C7NJTo/vEAOkZOBuVHDQPZy8QX2xtly1dhiQT+gPK6WsMIi9zAO4+InFojutarvtwOQ8d1HvD1gyV3GeAv0m+X85ZehIqGUeSp7WtRDBJ9sjcwelIstbYndBhONCmd/nR5eoBFN9aUeRlDipZh4p/qa2PAh/F7/h7Ii5M8s2OSPycGe8PUE530CYvNvofIC8zvV7uwSoCoAwxOWPHhWkkavX1HYVK3jcutMn1glpaE/qBHKcMohvvh9zgyfb6yZ3kbz55YKIRMDYQ6u9CJQ9BVha5+84m2cEz9Iq4k83K9QE9OSv83OKDhD2tHimY1dhh1ceBsYHkeLiy2rxV5yWbWSR+wPTdYi+N3Eg34Y5XFySJW4TB2GzoBKrkNiT52sD86Jb89iDj5izIcrZWjcQbPZ2zMD2QMJh6NjqLM1DJK/7KQNDNvESpJ1taGdC5p1A3et2VLogVRi6va8OD2eNt3NI1AT3xnab/uoAuKzcZ3Qvpg9TCKP4+ukQprTRtn7VMdlHowUzx1cb2a60BqYWJslFeNZLR4GSdC43r7Q7VKf6gdSBBmH3hSVOu9HNVrZDM90uSWlF8gZ9rWgoSM2kiyb0G5Mlw9+FtAV3WWWh0r7ceJApG5wPi/SbEXhroS7wqdLPnZMjYfL71IG5ZE1I1e9dHm417vGvrjopfNSH29oCO5BEv2vGqNrhWaR4qecYCM4ZKfjb291hLJOWu1l+RCVHxgvog3QP5WCVKFIj3xB+3RjOSEZ3BrX2VrDZ9N4bUgROo+E+3UvCLRsWnBCfhDqr1v3sHqyZAqmqtGFVzXh8vvKMFKF4S0JPcYua23v2uQ16sMp74s4ZgwtyzPgzqCUbsnZ0uZI4XV8hJXox5sNoZ6gZJQerAIMnD/vGhq3RWoJ9yrqvkliQ3KtWX058ngokKGDUwSPyUaX8IyLkqOJfhaah4V9WhKpG4MOXLAf7CGmUaAQnCHPYuH5yirWm54kUlH4YeyhLBkIxZA0QjIEGYMWsAULwESf52I1WPQ9CUTH59QPJl5N1WGoczLVS6pHx1CsTLIBU5t3QCknxkJjgOXQOnhbZNmlQLlrtmxQv0xjcQ90CqUv1OZFzfnqcCEjzP7Jp0RfsgtES8C4DtZsCvoOfG01tyOCOdFGU1tFQmv15Q8m3gDVMz9Vqh3a/O68E0W3gW2g3jvYIz70x4N1Bprvt7d+ki4x6b/zP/A4g1YBlGrwzJfP8WhGRt07ap3TCVV3KVPwwouSId29JGmLzM1OcPJPnOOzTxcGq2c+2GaaUU/r9/BBr9t6fTnHgwI/qC4h8jUMuP3SVsVAAAAABJRU5ErkJggg==';
        }
        else if (Number(number) < 0.5) {
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACVElEQVR4nO3Yv4sTQRQH8PcST0/tFKyEa8S8N6fXpLAQPQV/Yb9N3ts7sAg21oKgac5SUIsDsfNn54//QUst1U69QlFQC7FQ8Aeb3ezl13q7mzPOO/KFNJlkZj/szOybBZhkEksJqsByAUnfIMkXJFmGenMKTMUFm5HkEbL+7vmQXgZbCH0cX7x8BA6PAeuBBLICJhG1xv64oVVJvvsJtqaTdCHidKYXWEbYgLguBMmHYQj/Ia4PQbov66f+Qlx+hL8QVwzhJ8QVR/gHceUQfkFcH4IXZov8fTyQ3cFWJLmGpJ8H6qOBeknew2zIRYcYCwRJr68JGAExTsin9iAkJzLaV9rtexsHS4/RD5nT7Ui6BKQL0Ywo2+/wQWYWpzPaf8UX0arAekFqjaNdd/ot1ORI2b6LQEaeFoN9tCrAcgZZXyaYH1ALTxqEdBJUkeVGWnBSuNMoJG5G1ifJOr1kGQLA4elkij23DZnTXQnk2waB6NeNMbVYnxlf7PI0WewXDW+/ejPdfl2ww94DkbSJrK+StfEdSI/bLlFYXgPLobJ9DxaNTk/9tWjkxmFYL0j76KBLwKKw59yWsv32pH0WyVPGZ7yz8udgNbM4jaRXO3fmX2DGA8l/1H1YFuMPJEq9OYWsD8pg/IKMgPEPsnqGuF8E4ykkfSLfy4vxGJJi7ubBeA6JElSR5M5aGAOQfBgjkA5Gb2dhDEEAYH5+09DdrN7clla4dhL07mZRVbv6YuEF2EoQrZlb/XUakJ4Hg0Hg8Gx0F5D1HbJeiabe/76oSSaB4vkDv7LvzyJLv10AAAAASUVORK5CYII=';
        }
        else if (Number(number) < 0.9) {
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADR0lEQVR4nO2ZTWxMURTHz22VIjYkFrS6Ke+eV7rpQkIo4qNsxOKl8s6ZNmliYoEFESGhm3bVSrCQiB3KimBtQcKSlSBCaImvoElFpKjKfXNnTPv6Zu5rZ/TdZP7JbOa88+795Zx77rn3AVRUkU3yqgHphJD8WkgaFpLOQ0u6BqyS680Vkm4K5PEJP8m9YBcE38pMnj4BprYC8loNMgRWQjj+moyhu0r/NwZ2pRPlQWSUTS+wGcIOEDcPQtLHqSCSD+JOgpC8OurR5IK45hDJBXHzqpPkD+CSW8ylKEjmnXcE0jVoaq8v9ZRLAmEE4nQtEkifdcEYAfTbIWkQxqnlplYIpNv62T8g+Xgppl0Agt5DUwrjuMdaI0hH1eYZPC/5gPkodd58IemskPw11B+F+qX4ELFBlKS/T0VFIP8Gh9eBiYTkc0UBZgAx3aolJPXpcV9A48F5JiBfMmGk7RH2ocC+yl8fZyIFQZp5oZDcA5I7VEYUKPGPAz/kQ+aDNHTWRthViMdV81cyEMffnBfpQXBo05SO6O/WxeVN0fENQGa8mYXf0V0FSF0C+amG+QlOasdUrgL5ZeDr8pYEgmTlVQukC7mGU6aWhHwl92r//gSDZMwC+b5ep6dCVpfbdHrdSzoIAKZ26RR7FLI1Up2O2NvkgzTzUg3yPWRr6KzVID8sAuFvIVtLekEkZGJTC/lhyNbUXm9LagmB9EAv9pMhK/o7NcjdhJdfvpgrv663OLL8SupLIEh3FUhOC+Rnem2MguRtBTfEqN0/MS0K0itA2lC4RaHB4i1Ktml0ua1g04j+xpKBBEcH7gEkjuxs3bym0eRcEpxFTNr4iDuraYGY+fTrtHtu1MYHG47kM9nIlANm2gcryb/U3TGU/163DCCOf0SdDHVKpWE2rkZnBLKyY3ne+8dA0mEomxQM8o24MMVBvGp1MyMyFWoYJO2BsqslXSOQrseBMYmIkHRFIA+As3cZ/D8FO/JVU5hSbKrlhhkwgUk4SDa3g5QoCGMBiBmMJSC5qnM5CsYiEABobZ2jPguEYHInPB4Fe+RNrGaqq/13sfAE7JKn1sylyX0aSD4GFkoApvarKAjkdwL5tEq92Z5URRVBfP0F3A5fBJMg1IYAAAAASUVORK5CYII=';
        }
        else {
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEc0lEQVR4nO2Za4gcRRCAq3NG4xMfoKCJMXC5qdq9iz8OERSTKD6ioOKP5ZKp2jsIuIivH4qIiheUBIVE0CCCCP6IjyhqiCJigj8MJAR/JIqKLxSTKGoeGlBJjDFGeqZ2duP07M3s7OMWtuB+3FR3TX9T1dXVtQB96UsvSWkAiB82KLsM8kGD/ByMVmZCT0mhdLJB3mhIjp/wh7IKegtC3g4Xz/uAytcCyeUKsgd6EsLzR0LFihn67Fgme97EJdBVCOS9gDJcr66GV2p7KHcp/GYYWoYwHSCaAinyZdaW2vwbkCetZ6EjG9tCROGUE8TKpRNnG+RnDMpR3WPvwYh/DrTdEzReTBraFEhVyF9Y551PoFA6F9oDIb80gsgNYmWQZxuST/V9H8EgnwUthyhwYaopU4KENj8wxOuhODbHOWZ46QWG5Cv1zEZrtqMQqUC85Wca4gOaqX4H8sec44pjcwzJ/sAWyt0dhUgFEtgvX2yI39Gx/wLKQ85xntxs9Yb4MAzJvBwQ/DMUy5RleqY9QvyAPTwbfXWD/KJ+0JdqT2eXTtU091usPorVS9khMoNYQf/28KvLP+DJFeDe/IeCaqGa8g3K2ikBckA0m7UM8mp977cweM8pcb08rXvq2eqDX0M38vVug7In0A/5VzYD4QRZIKcblJWAMm4josFh+3kwj+TemB5lWEEO2LG1l8ydmJWwCOvi43lKhBiI519d5+nd4PFi50Tyb9W98IPr/YZkR2C3IEvSgOQ7zJw2VswA4uWG5MuonvLKN7imGpLvdLHXOOw+obYf7xJIVUoDhvj5qPTH8nmxuSirdP6a2HTk21S3qcsgodqQbNV9OhnTFmSJhteWmG5I5kXhOQ1AAKh8ky5oZ0KqtR77MaYrlM5QyD+mB8gCOV9B/ozp7DkXzj/kts1/Bbb7IO0ILZIdCYViT4SWMcTbdLM/GtOSf6OCfJi82WXXNEi/8kKUfgvx21+UfpFXJ6dffr97ByJKpXZRkiOAcl3DA9Fx+hviJ9X2Y90vUYi/B+KrGpcovNtZoiDvrJUo1aLR/tOoaCR/YctAgquDrARicVW2saLRdS/x/BG1uz8sGu1dJE0Zf0L3sANlPMkaDbtv3GW8rhtlbfhk7sSsoLZXz7QDpumLFcpR2zt2p2Q+HFysHA3BJvq6bQDx/PvtzVBDqtL4qsvrIN/PBdlgUoHMH7+ozv4xQL7PvQ6+JWo+NN3otjAkG7LCTA1SGrCdGRN+5YP2fEjutFTbQXwn5JLRykxD/FYWmDQeMcgvG5JXwFt6YXKDjr9WWxugJRLCvJkWJvehWgw292dqZ7tt6EHLxMKgvJEGJheIx4trTWz5uD0d+SC2g5BoCNOSnxVI3rXPoG2yaNFJBuX1RjCZQaj+pwQ5AsSP5GtaZ4N5LQkm+4HIkzpnE3jsQUfFwhCvj8GMVk6LvmwGW0DL5kP3JLhfvBrB2Kq21lj4AnpLSjYBrPt/nQYoD0IPigEq32G9YEh+MiRPBeHSl75Az8l/qiP/bH79PEgAAAAASUVORK5CYII='
        }
    };




    return (
        <div className='w-full h-full p-[1rem]'>
            <div className='w-full h-[50%] bg-[#ffffff]'>

            </div>
            <div className='w-full h-[50%]'>
                <div className='w-full h-full flex flex-col justify-around overflow-hidden'>
                    <InputBorderBlue
                        type='select'
                        important={false}
                        value={voice_definitive?.name}
                        textLabel='Listas de voces disponibles'
                        childSelect={
                            listVoicesState.map(voice => ({
                                value: voice.name, text: voice.name,
                            }))
                        }
                        eventChengue={text => {
                            changeVoice(text);
                        }}
                    />


                    <p className='text-center '>Voz selecionada: {voice_definitive ? voice_definitive.name : 'ninguna'}</p>

                    <div className='__center_center __oneGap __width-complete'>
                        <InputBorderBlue
                            type='range'
                            important={false}
                            textLabel='Volumen'
                            value={volumeState}
                            min={0}
                            max={1}
                            step={0.05}
                            eventChengue={value => {

                                changueVolume(Number(value));
                            }}
                        />
                        <img style={{ width: '30px', paddingTop: '2rem' }} src={renderImg(volumeState)} alt="" />
                    </div>
                </div>

            </div>
        </div>
    );
}
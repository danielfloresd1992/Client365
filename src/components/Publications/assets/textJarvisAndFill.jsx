'use client';
import { useRef } from 'react';
import useAuthOnServer from '@/hook/auth';
import axios from 'axios';


function TextJarvisAndFill(){

    const valueTextAreaRef = useRef(null);
    const { dataSessionState } = useAuthOnServer();
    const user = dataSessionState?.dataSession;
    const permissionUser = !(user?.admin || user?.super);


    const sendTextJarvis = () => {

        if(!valueTextAreaRef.current) return;
        if(valueTextAreaRef.current.value.trim() === '') return;
        
        axios.get(`https://72.68.60.254:4000/bot/voice/text=${ valueTextAreaRef.current.value }/type=complete`)
            .then(response => {
                
            })
            .catch(err => {
                console.log(err);
            });
    };


    return(
        <>
            <div className='textJarvisComponent'>
                <div className='textArea-content'>
                    <textarea 
                        ref={ valueTextAreaRef }
                        className="textJarvisComponent-textArea" 
                        name="" 
                        cols="30" 
                        rows="10" 
                        placeholder={permissionUser ? '' : "Compartir con Jarvis 🤖..." }
                        autoComplete='true'
                        disabled={permissionUser}
                    >
                    </textarea>
                    <div className='btnContain'>
                        <button className='btnContain-send'
                            onClick={ sendTextJarvis }
                        >
                            <img className='btn-send-text-jarvis-Img' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC0ElEQVR4nO2ZS2jUUBSGPx+l4hOh44yKC6sgiIrgpqIbURF3uhAEQVdWRMStC0FxVaTTEe1OcCFIQUHE11JFcOFjY20VBHXhG3xW1IqPkQN/4BLSmWSSZhKZD8JMknvvnJ//5Nx7M9CiRYv/hZnAAeAJcJMcsgQ4CYwAVR2PyQkTgA3AOeC3I8A7zJlMMwPoBoYDgvcOc2YWGWUR0AN8dAJ+BfQDL31CTpDB9NkEXAX+OIFeB7YAJWBQ117o86+emUwwXekz5AQ/CpwBVqhNwRHxCOjV92tkgE6lzwdHwGvgCNDhtCv4RMwHnul8cxPjZ21A9bkP7AQm+9oWfCIsvbbq3OaPiWkHP0WBPvSljwnqGqNPkAjjhq7tb3b6vFH6WKBEFLFMD/iIZvbU0udXQPq01ek7lgjjlK4fJ4X08YKw46cErQ45Ri0Rs4Fv41ly5ylV3jsC3iqlrMKQgAjjoO5dIaX06ZY7JChiEvBc923SjE270udBQPqsaXDMeiKMbUmV3KD0eaf0WRBj3DAijFtqs48Y9Psmr3tyxdwhIRGDNcrxSrX5rNVww3jLgapSainxCSvCOK12FWJS0iDfNaCtTAdiCIoiogD80G8ubvD3AgftUS33BF2W9Uk/Ex6H1PZSzNgTFRRVhC0gvX3HxgTjjyUoqghju9PeNl3jTj1BjYgwbqvPXlKmCJR9ggYiPNguq9Tnk3aQTaFDk+cXp2xHcQJtc62fbWmbzhzgvAIyZ6I4OypHO8kI5s5XBbU8ZJ/DEn+RjNEbwZU2573VejJGUQUgjCs7JGI4rZIblXJIV+6o3R4ySjGEK11OyZ1GhinXceWs7h8j4xRruDJXO03b9ywkB/SN4cpRXb9ATigFuNKuty4mZB05os/nyi6dD2W15IZ15a6E7CaHVJx3AFW9G55KDik5y/2q9jO5pSIRuSm5tVx5qv/MW7RoQbr8A2pLKcu/QDhRAAAAAElFTkSuQmCC' />
                        </button>
                    </div>
                </div>

                {/*
                    <div className='textArea-content left'>
                        <label className='label-toogle'>
                            Activar filtro
                            <div className='toogle-contain'>
                                <button className='btnFilter-toogle center-contain'></button>
                            </div>
                        </label>
                        <label className='label-toogle'>
                            Lista de locales
                            <select className='select-fillLocal'></select>
                        </label>
                        <div className='List-Option center-contain'>
                            <p>Locales activado</p>
                            <div className='tag-contain scrolltheme1'></div>
                        </div>
                    </div>
                */}
                
            </div>
        </>
    );
}

export default TextJarvisAndFill;
import ContentForm from './assets/ContentForm';
import Jarvis365Logo from '../../components/fx/Jarvis365Logo';
import './auth.css';


export default function page_auth() {

    return (
        <div className='auth-page'>
          <div className='auth-shell'>
            {/* Brand panel (bienvenida) */}
            <div className='auth-brand-panel'>
                <div className='auth-brand-panel__glow' />
                <div className='auth-brand-panel__content'>
                    <Jarvis365Logo variant='green' className='auth-brand-panel__logo' />
                    <h2 className='auth-brand-panel__title'>Bienvenido a Amazonas365</h2>
                    <p className='auth-brand-panel__text'>
                        Gestión y gerencia remota 24/7 · 365 días.<br />
                        Supervisa, analiza y toma decisiones con información oportuna.
                    </p>
                    <div className='auth-brand-panel__stats'>
                        <div className='auth-brand-panel__stat'>
                            <span className='auth-brand-panel__stat-value'>24/7</span>
                            <span className='auth-brand-panel__stat-label'>Cobertura</span>
                        </div>
                        <div className='auth-brand-panel__stat'>
                            <span className='auth-brand-panel__stat-value'>365</span>
                            <span className='auth-brand-panel__stat-label'>Días</span>
                        </div>
                        <div className='auth-brand-panel__stat'>
                            <span className='auth-brand-panel__stat-value'>100%</span>
                            <span className='auth-brand-panel__stat-label'>Objetivo</span>
                        </div>
                    </div>
                </div>
                {/* Decorative circles */}
                <div className='auth-brand-panel__circle auth-brand-panel__circle--1' />
                <div className='auth-brand-panel__circle auth-brand-panel__circle--2' />
                <div className='auth-brand-panel__circle auth-brand-panel__circle--3' />
            </div>

            {/* Form side */}
            <div className='auth-form-side'>
                <ContentForm />
            </div>
          </div>
        </div>
    )
}
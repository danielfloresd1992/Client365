'use client';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeModal } from '@/store/slices/globalModal.js';
import './modal.css'

export default function Modal() {
    const selectModal = useSelector(state => state.modal);
    const dispatch = useDispatch();

    const close = () => {
        dispatch(closeModal());
    };

    const closeScroll = () => {
        // document.body.style.overflow = 'hidden';
    };

    const openScroll = () => {
        // document.body.style.overflow = 'auto';
    };

    // 1. Move scroll side-effects to a useEffect to avoid React render warnings
    useEffect(() => {
        if (selectModal.modalOpen) {
            closeScroll();
        } else {
            openScroll();
        }

        // Cleanup function when component unmounts
        return () => openScroll();
    }, [selectModal.modalOpen]);

    const returnHeaderModal = (typeAlert) => {
        // Branded SVG logo (top)
        const LogoSVG = (
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 8 }}>
                <circle cx="20" cy="20" r="20" fill="#4e8300" />
                <text x="50%" y="55%" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="sans-serif" dy=".3em">365</text>
            </svg>
        );

        // SVG icons for each type
        const icons = {
            error: (
                <span className="modal-icon modal-icon--error">
                    <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fee2e2" /><path d="M10 10l12 12M22 10L10 22" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" /></svg>
                </span>
            ),
            warning: (
                <span className="modal-icon modal-icon--warning">
                    <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fef3c7" /><path d="M16 10v8M16 22h.01" stroke="#d97706" strokeWidth="2" strokeLinecap="round" /></svg>
                </span>
            ),
            successfull: (
                <span className="modal-icon modal-icon--success">
                    <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#dcfce7" /><path d="M10 17l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" /></svg>
                </span>
            ),
            close_session: (
                <span className="modal-icon modal-icon--session">
                    <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#dbeafe" /><path d="M12 16h8M16 12v8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" /></svg>
                </span>
            ),
            exit: (
                <span className="modal-icon modal-icon--exit">
                    <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fef3c7" /><path d="M10 16h12" stroke="#d97706" strokeWidth="2" strokeLinecap="round" /></svg>
                </span>
            ),
            await: (
                <span className="modal-spinner-wrapper">
                    <span className="modal-spinner"></span>
                </span>
            )
        };

        // 2. Fixed logic structure
        if (typeAlert === 'await') {
            return (
                <div className="modal-header">
                    <div className='lds-spinner'><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                    <h2 className="modal-title">{selectModal.title}</h2>
                </div>
            );
        }

        if (typeAlert === 'exit') {
            if (typeof selectModal.isCallback !== 'function') throw new Error('isCallback strictly must be a function');
            return (
                <div className="modal-header">
                    <img src='data:image/png;base64,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' style={{ width: '60px' }} alt="Exit Icon" />
                    <h2 className="modal-title">{selectModal.title}</h2>
                    <div className='boxModal-contentItems'>
                        <p className='boxModal-description'>{selectModal.description}</p>
                    </div>
                    <div className='boxModal-contentItems'>
                        <button
                            className='btn-item'
                            onClick={() => {
                                selectModal.isCallback();
                                openScroll();
                                close();
                            }}
                        > Aceptar
                        </button>
                    </div>
                </div>
            );
        }

        // Default return for standard icons (error, warning, successfull, close_session)
        return (
            <div className="modal-header">
                {LogoSVG}
                {icons[typeAlert] || null}
                <h2 className="modal-title">{selectModal.title}</h2>
            </div>
        );
    };

    // 3. Replaced deeply nested ternaries with a clean object mapping
    const typeClasses = {
        error: 'modal-card--error',
        warning: 'modal-card--warning',
        successfull: 'modal-card--success', // Kept your typo in case your Redux payload expects it this way
        close_session: 'modal-card--session',
        await: 'modal-card--await',
        exit: 'modal-card--exit'
    };
    const typeClass = typeClasses[selectModal.type] || '';

    // 4. Brought the return statement back INSIDE the Modal component scope
    return (
        <div className="modal-overlay modal-overlay--visible" style={{ opacity: selectModal.modalOpen ? 1 : 0, visibility: selectModal.modalOpen ? 'visible' : 'hidden' }}>
            <div className={`modal-card ${typeClass}`}>

                {returnHeaderModal(selectModal.type)}

                {selectModal.type !== 'await' && selectModal.type !== 'exit' && (
                    <div className="modal-body">
                        <p className="modal-description">{selectModal.description}</p>
                    </div>
                )}

                {(selectModal.type !== 'await' && selectModal.type !== 'exit') && (
                    <div className="modal-actions">
                        {typeof selectModal.isCallback === 'function' ? (
                            <>
                                <button
                                    className="modal-btn modal-btn--primary"
                                    onClick={() => {
                                        selectModal.isCallback();
                                        openScroll();
                                        close();
                                    }}
                                >Aceptar</button>
                                <button
                                    className="modal-btn modal-btn--secondary"
                                    onClick={() => {
                                        close();
                                        openScroll();
                                    }}
                                >Cancelar</button>
                            </>
                        ) : (
                            <button
                                className="modal-btn modal-btn--primary"
                                onClick={() => {
                                    close();
                                    openScroll();
                                }}
                            >Cerrar</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
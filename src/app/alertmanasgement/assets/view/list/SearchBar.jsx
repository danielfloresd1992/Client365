'use client';
import { FaSearch, FaTimes } from 'react-icons/fa';

/**
 * Buscador por título de la lista. El filtrado ocurre en el componente padre;
 * aquí solo se controla el input y el botón de limpiar.
 */
export default function SearchBar({ value, onChange, onClear }) {
    return (
        <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            padding:      '0 12px',
            height:       '40px',
            borderRadius: '11px',
            border:       '1px solid #e6dcc6',
            background:   '#fff',
            transition:   'border-color 0.15s, box-shadow 0.15s',
        }}>
            <FaSearch size={13} color='#9ca3af' />
            <input
                type='text'
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={e => { const box = e.currentTarget.parentElement; box.style.borderColor = '#29c50c'; box.style.boxShadow = '0 0 0 3px rgba(41,197,12,0.15)'; }}
                onBlur={e => { const box = e.currentTarget.parentElement; box.style.borderColor = '#e6dcc6'; box.style.boxShadow = 'none'; }}
                placeholder='Buscar alerta por título…'
                style={{
                    flex:       1,
                    minWidth:   0,
                    border:     'none',
                    outline:    'none',
                    background: 'transparent',
                    fontSize:   '13px',
                    color:      '#111827',
                }}
            />
            {value && (
                <button
                    type='button'
                    title='Limpiar'
                    onClick={onClear}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: '2px' }}
                >
                    <FaTimes size={13} />
                </button>
            )}
        </div>
    );
}

'use client';
import { FaBell, FaSearch } from 'react-icons/fa';

/**
 * Estado vacío de la lista. El mensaje depende de si hay una búsqueda activa
 * (sin resultados) o simplemente no hay alertas en la categoría.
 */
export default function EmptyState({ searchTerm }) {
    const searching = Boolean(searchTerm?.trim());

    return (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: '13px' }}>
            {searching ? (
                <>
                    <FaSearch size={26} color='#d1d5db' />
                    <p style={{ marginTop: '10px' }}>Sin resultados para <b>“{searchTerm}”</b></p>
                </>
            ) : (
                <>
                    <FaBell size={28} color='#d1d5db' />
                    <p style={{ marginTop: '8px' }}>Sin alertas en esta categoría</p>
                </>
            )}
        </div>
    );
}

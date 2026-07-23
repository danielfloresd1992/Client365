'use client';

/** Placeholders animados mientras se carga la lista por primera vez. */
export default function ListSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px', background: '#fff', border: '1px solid #eee7d6' }}>
                    <div className='skeleton-pulse' style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eceee9', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        <div className='skeleton-pulse' style={{ height: '11px', width: '55%', borderRadius: '6px', background: '#eceee9' }} />
                        <div className='skeleton-pulse' style={{ height: '9px', width: '38%', borderRadius: '6px', background: '#f1f2ef' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

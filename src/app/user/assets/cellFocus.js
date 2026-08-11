'use client';

// ══════════════════════════════════════════════════════════════════════
// CELDA A LA QUE SE LLEGÓ DESDE UNA NOTIFICACIÓN
// ══════════════════════════════════════════════════════════════════════
// /user?userId=…&date=…&detail=1 no solo tiene que ir hasta la celda: cuando el
// aviso es de un comentario, tiene que ABRIR su ficha. Si no, quien viene a
// leer la nota se encuentra la celda señalada y cerrada, y le toca descubrir
// que hay que dejar el ratón encima un segundo.
//
// La página sabe a qué celda ir, pero abrir la ficha es estado de la CELDA, y
// solo ella puede hacerlo. Este módulo es el recado entre las dos.
//
// Es un almacén de módulo y no un contexto de React, por lo mismo que
// `attendanceCache` y `schedulePending`: la grilla monta más de dos mil celdas
// y un contexto repintaría el árbol entero para avisarle a una.

/** { userId, dayKey, openDetail } o null */
let objetivo = null;

const oyentes = new Set();
const avisar = () => oyentes.forEach(fn => fn());

/**
 * Cuánto vale el recado. Pasado ese tiempo se descarta.
 *
 * Sin caducidad quedaba vivo indefinidamente: si al llegar el objetivo no
 * estaba a la vista —el usuario cambió de mes mientras cargaba la grilla—, la
 * ficha se abría sola minutos después, al volver a ese mes, sin que nadie
 * hubiera pedido nada.
 *
 * Treinta segundos alcanzan de sobra para que la grilla monte y la celda
 * aparezca por el scroll.
 */
const VIGENCIA_MS = 30_000;

/** Marca la celda a la que se acaba de llegar. */
export const setCellFocus = (target) => {
    objetivo = target ? { ...target, ts: Date.now() } : null;
    avisar();
};

export const getCellFocus = () => {
    if (objetivo && Date.now() - objetivo.ts > VIGENCIA_MS) objetivo = null;
    return objetivo;
};

/**
 * La celda ya se ocupó del recado.
 *
 * Se limpia en cuanto una celda lo toma para que no vuelva a abrirse sola: sin
 * esto, cualquier repintado posterior de esa celda —un comentario nuevo por
 * socket, un cambio de mes y vuelta— reabriría la ficha que el usuario cerró.
 */
export const clearCellFocus = () => {
    objetivo = null;
    avisar();
};

/** Suscripción de una celda. Devuelve la baja. */
export const subscribeCellFocus = (fn) => {
    oyentes.add(fn);
    return () => oyentes.delete(fn);
};

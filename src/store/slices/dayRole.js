'use client';
import { createSlice } from '@reduxjs/toolkit';

/*
 * Rol del día del usuario en sesión (encargado de turno / auxiliar), resuelto
 * desde el roster del horario. Lo despacha el loader de dayRoleContext y lo
 * leen los componentes con useDayRole().
 */
const dayRole = createSlice({
    name: 'dayRole',
    initialState: { onDuty: false, auxiliary: false, shift: null, startTime: null, endTime: null },
    reducers: {
        setDayRole: (state, action) => ({
            onDuty: Boolean(action.payload?.onDuty),
            auxiliary: Boolean(action.payload?.auxiliary),
            // Jornada efectiva del día operativo (para mostrar la ventana del
            // rol en la navegación): turno + hora de inicio y culminación.
            shift: action.payload?.shift ?? null,
            startTime: action.payload?.startTime ?? null,
            endTime: action.payload?.endTime ?? null,
        }),
    },
});

export const { setDayRole } = dayRole.actions;

export default dayRole.reducer;

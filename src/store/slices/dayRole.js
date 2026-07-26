'use client';
import { createSlice } from '@reduxjs/toolkit';

/*
 * Rol del día del usuario en sesión (encargado de turno / auxiliar), resuelto
 * desde el roster del horario. Lo despacha el loader de dayRoleContext y lo
 * leen los componentes con useDayRole().
 */
const dayRole = createSlice({
    name: 'dayRole',
    initialState: { onDuty: false, auxiliary: false },
    reducers: {
        setDayRole: (state, action) => ({
            onDuty: Boolean(action.payload?.onDuty),
            auxiliary: Boolean(action.payload?.auxiliary),
        }),
    },
});

export const { setDayRole } = dayRole.actions;

export default dayRole.reducer;

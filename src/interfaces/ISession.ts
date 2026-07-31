// Datos del usuario en sesión que consumen los componentes de la app. El hook
// de autenticación es JS sin tipar; esta interfaz documenta la forma realmente
// usada (nombre, apellido, foto y si es administrador).
interface ISessionUser {
    name?: string;
    surName?: string;
    img?: string;
    admin?: boolean;
}

export type { ISessionUser }

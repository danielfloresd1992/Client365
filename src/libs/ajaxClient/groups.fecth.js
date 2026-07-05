'use client';
import axios from 'axios';

// Host del bot AVA (mismo que usa el envío a WhatsApp)
const botUrl = process.env.NEXT_PUBLIC_SOCKET_AVA_CHAT || 'https://amazona365.ddns.net:4000';


/**
 * fetchWhatsappGroups — Obtiene los grupos de WhatsApp de la cuenta
 * conectada al bot AVA (GET /bot/groups).
 *
 * Respuesta del bot: [{ name: 'Amazonas Activo', id: '12036…@g.us' }, …]
 * ordenada por nombre. Si el bot aún no escaneó el QR responde 503;
 * en ese caso (o ante cualquier error) esta función devuelve [] para
 * que el select se renderice vacío sin romper el formulario.
 */
export default async function fetchWhatsappGroups() {
    try {
        const response = await axios.get(`${botUrl}/bot/groups`);
        return Array.isArray(response.data) ? response.data : [];
    }
    catch (error) {
        console.error('No se pudieron obtener los grupos de WhatsApp:', error?.message);
        return [];
    }
}

// src/services/odoo.js
import axios from 'axios';

// Configura aquí tus credenciales o impórtalas de .env
const config = {
    url: '/odoo-api', 
    db: 'crm_final_restored',
    username: 'autonoma@jpawaj.com',
    password: 'jpawajacademiaesparta01' 
};

// Función genérica para llamar a Odoo
export const odooCall = async (model, method, args, kwargs = {}) => {
    // 1. Login (obtener UID)
    const auth = await axios.post(config.url, {
        jsonrpc: "2.0", method: "call", id: 1,
        params: { service: "common", method: "login", args: [config.db, config.username, config.password] }
    });
    const uid = auth.data.result;
    if (!uid) throw new Error("Error de autenticación");

    // 2. Ejecutar comando
    const response = await axios.post(config.url, {
        jsonrpc: "2.0", method: "call", id: 2,
        params: {
            service: "object", method: "execute_kw",
            args: [config.db, uid, config.password, model, method, args, kwargs]
        }
    });
    return response.data.result;
};
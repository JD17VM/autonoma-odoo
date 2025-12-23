// src/config/odoo.config.js

const isDevelopment = import.meta.env.DEV;

export const ODOO_CONFIG = {
    // En desarrollo usa el proxy, en producción usa la URL completa
    url: isDevelopment 
        ? '/odoo-api' 
        : 'https://hosting-web-proxy-odoo.essftr.easypanel.host/odoo-api', // <- CAMBIA ESTO por tu URL real
    db: 'crm_final_restored',
    username: 'autonoma@jpawaj.com',
    password: 'jpawajacademiaesparta01'
};

// Ejemplo de URLs que podrías usar en producción:
// 'https://tu-servidor.com:8069/jsonrpc'
// 'https://odoo.tudominio.com/jsonrpc'
// 'http://tu-ip-servidor:8069/jsonrpc'
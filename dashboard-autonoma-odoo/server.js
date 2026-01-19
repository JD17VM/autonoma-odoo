import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// IMPORTANTE: NO usamos app.use(express.json()) aquí.
// Dejamos que los datos pasen crudos (stream) hacia Odoo.

// Configuración del Proxy
app.use('/odoo-api', createProxyMiddleware({
    target: 'https://odoo-crm-jpawaj-odoo.essftr.easypanel.host',
    changeOrigin: true,       // Engaña a Odoo para que crea que la petición viene de su mismo dominio
    pathRewrite: {
        '^/odoo-api': '/jsonrpc', // Convierte /odoo-api -> /jsonrpc
    },
    onProxyReq: (proxyReq) => {
        // Forzamos el tipo de contenido para asegurar que Odoo sepa que es JSON
        proxyReq.setHeader('Content-Type', 'application/json');
    }
}));

// --- SEGURIDAD: CONTROL DE ACCESO ---
// 1. Entrada autorizada (POST): Esta ruta recibe el clic desde el botón de Odoo
app.post('/', (req, res) => {
    // Creamos una cookie manual "odoo_auth" que dura 24 horas
    // Esto actúa como una "pulsera" para identificar que viene de un sitio seguro
    res.setHeader('Set-Cookie', 'odoo_auth=true; Path=/; HttpOnly; Max-Age=86400');
    // Redirigimos al usuario a la vista normal (GET) para que cargue la app
    res.redirect('/');
});

// Servir la aplicación React (Archivos estáticos)
// IMPORTANTE: { index: false } evita que se sirva index.html automáticamente,
// permitiéndonos verificar la cookie primero en la ruta GET de abajo.
app.use(express.static(path.join(__dirname, 'dist'), { index: false }));

// Manejar cualquier otra ruta (para que React Router funcione al recargar)
// Usamos regex /.*/ para evitar el error de Express 5
app.get(/.*/, (req, res) => {
    // 2. Verificación (GET): ¿Tiene la cookie de acceso?
    const cookies = req.headers.cookie || '';
    if (!cookies.includes('odoo_auth=true')) {
        // Si no tiene permiso, lo mandamos de vuelta a tu CRM
        return res.redirect('https://odoo-crm-jpawaj-odoo.essftr.easypanel.host');
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
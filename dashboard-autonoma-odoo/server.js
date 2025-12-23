import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// AQUI ES DONDE OCURRE LA MAGIA
// Redirige lo que venga a '/odoo-api' hacia tu Odoo real '/jsonrpc'
app.use('/odoo-api', createProxyMiddleware({
    target: 'https://odoo-crm-jpawaj-odoo.essftr.easypanel.host', // Tu URL base de Odoo
    changeOrigin: true,
    pathRewrite: {
        '^/odoo-api': '/jsonrpc', // Convierte la ruta para que Odoo la entienda
    },
    onProxyReq: (proxyReq) => {
        proxyReq.setHeader('Content-Type', 'application/json');
    }
}));

// Servir la app de React compilada
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
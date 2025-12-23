import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Cuando React pida '/odoo-api', Vite lo enviará a Odoo
      '/odoo-api': {
        target: 'https://odoo-crm-jpawaj-odoo.essftr.easypanel.host',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/odoo-api/, '/jsonrpc'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Content-Type', 'application/json');
          });
        },
      }
    }
  }
})
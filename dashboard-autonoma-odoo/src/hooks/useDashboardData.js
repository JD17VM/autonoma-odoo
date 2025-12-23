import { useState, useEffect } from 'react';
import axios from 'axios';
import { getOdooDomain } from '../utils/dateHelpers';
import { ODOO_CONFIG } from '../config/odoo.config';

// Mapeo de etiquetas igual a tu archivo Python
// Para que en el gráfico se vea bonito (Whatsapp 1) y no el código (whatsapp_1)
const CANAL_LABELS = {
    'whatsapp_1': 'Whatsapp 1',
    'whatsapp_2': 'Whatsapp 2',
    'messenger': 'Messenger',
    'instagram': 'Instagram',
    'manual': 'Manual',
    'web': 'Web / Otros' // Por si acaso hay alguno extra
};

export const useDashboardData = (filterType, salespersonId) => {
    const [data, setData] = useState({ funnelData: [], pieData: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // 1. PREPARAR FILTROS
                const dateDomain = getOdooDomain(filterType);
                const userDomain = salespersonId ? [['user_id', '=', parseInt(salespersonId)]] : [];
                const finalDomain = [...dateDomain, ...userDomain];

                // 2. AUTENTICACIÓN
                const auth = await axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 1,
                    params: { 
                        service: "common", method: "login", 
                        args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password] 
                    }
                });
                const uid = auth.data.result;
                if (!uid) throw new Error("Fallo de autenticación");

                // 3. PETICIÓN A: EMBUDO (Agrupado por Stage)
                const reqFunnel = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 2,
                    params: {
                        service: "object", method: "execute_kw",
                        args: [
                            ODOO_CONFIG.db, uid, ODOO_CONFIG.password,
                            "crm.lead", "read_group", 
                            [finalDomain, ["stage_id"], ["stage_id"]]
                        ]
                    }
                });

                // 4. PETICIÓN B: CANAL (Campo 'canal' del tipo Selection)
                // IMPORTANTE: Aquí usamos tu campo personalizado 'canal'
                const reqChannel = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 3,
                    params: {
                        service: "object", method: "execute_kw",
                        args: [
                            ODOO_CONFIG.db, uid, ODOO_CONFIG.password,
                            "crm.lead", "read_group", 
                            [finalDomain, ["canal"], ["canal"]] // <--- AGRUPAR POR 'canal'
                        ]
                    }
                });

                // Ejecutamos ambas peticiones
                const [resFunnel, resChannel] = await Promise.all([reqFunnel, reqChannel]);

                // 5. FORMATEAR DATOS
                
                // --- Embudo ---
                const rawFunnel = resFunnel.data.result || [];
                const funnelData = rawFunnel.map(item => ({
                    id: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                    value: item.stage_id_count,
                    label: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                })).sort((a, b) => b.value - a.value);

                // --- Tarta (Canal) ---
                const rawChannel = resChannel.data.result || [];
                console.log("🥧 Datos Canal (Selection):", rawChannel); 

                const pieData = rawChannel.map(item => {
                    // En campos Selection, Odoo devuelve la clave (ej: 'whatsapp_1')
                    // Si viene false, es que está vacío
                    const rawKey = item.canal; 
                    
                    // Traducimos la clave a nombre bonito usando nuestro mapa
                    const label = rawKey ? (CANAL_LABELS[rawKey] || rawKey) : "Sin Canal";
                    
                    return {
                        id: label,
                        label: label,
                        value: item.canal_count // Odoo devuelve campo + _count
                    };
                }).filter(item => item.value > 0)
                  .sort((a, b) => b.value - a.value);

                setData({ funnelData, pieData });

            } catch (e) {
                console.error("Error cargando dashboard:", e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [filterType, salespersonId]);

    return { data, loading, error };
};
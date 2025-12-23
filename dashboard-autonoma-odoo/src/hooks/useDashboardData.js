// src/hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getOdooDomain } from '../utils/dateHelpers';
import { ODOO_CONFIG } from '../config/odoo.config';

export const useDashboardData = (filterType) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            
            try {
                console.log("🔍 Cargando datos con filtro:", filterType);
                console.log("🌐 URL Odoo:", ODOO_CONFIG.url);
                
                // 1. Calcular el filtro de fecha
                const dateDomain = getOdooDomain(filterType);
                console.log("📅 Dominio de fecha:", dateDomain);

                // 2. Autenticar
                const auth = await axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", 
                    method: "call", 
                    id: 1,
                    params: { 
                        service: "common", 
                        method: "login", 
                        args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password] 
                    }
                });
                
                const uid = auth.data.result;
                console.log("✅ UID obtenido:", uid);

                if (!uid) {
                    throw new Error("No se pudo autenticar con Odoo");
                }

                // 3. Pedir datos AGRUPADOS (read_group) con el filtro de fecha
                const response = await axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", 
                    method: "call", 
                    id: 2,
                    params: {
                        service: "object", 
                        method: "execute_kw",
                        args: [
                            ODOO_CONFIG.db, 
                            uid, 
                            ODOO_CONFIG.password,
                            "crm.lead", 
                            "read_group", 
                            [
                                dateDomain,
                                ["stage_id", "expected_revenue"], 
                                ["stage_id"]
                            ]
                        ]
                    }
                });

                const rawData = response.data.result || [];
                console.log("📊 Datos recibidos:", rawData);

                // 4. Formatear para Nivo Funnel
                const funnelData = rawData.map(item => ({
                    id: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                    value: item.stage_id_count,
                    label: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                })).sort((a, b) => b.value - a.value);

                console.log("✨ Datos formateados:", funnelData);
                setData({ funnelData });

            } catch (e) {
                console.error("❌ Error cargando dashboard:", e);
                console.error("Detalles del error:", e.response?.data || e.message);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [filterType]);

    return { data, loading, error };
};
// src/hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import axios from 'axios'; // Importamos axios directo para simplificar por ahora
import { getOdooDomain } from '../utils/dateHelpers';

// Configuración rápida (Idealmente mover a un archivo de config)
const ODOO_CONFIG = {
    url: '/odoo-api', 
    db: 'crm_final_restored',
    username: 'autonoma@jpawaj.com',
    password: 'jpawajacademiaesparta01' 
};

export const useDashboardData = (filterType) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // 1. Calcular el filtro de fecha
                const dateDomain = getOdooDomain(filterType);

                // 2. Autenticar
                const auth = await axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 1,
                    params: { service: "common", method: "login", args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password] }
                });
                const uid = auth.data.result;

                // 3. Pedir datos AGRUPADOS (read_group) con el filtro de fecha
                const response = await axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 2,
                    params: {
                        service: "object", method: "execute_kw",
                        args: [
                            ODOO_CONFIG.db, uid, ODOO_CONFIG.password,
                            "crm.lead", 
                            "read_group", 
                            [
                                dateDomain, // <--- AQUÍ APLICAMOS EL FILTRO DE FECHA
                                ["stage_id", "expected_revenue"], 
                                ["stage_id"] // Agrupar por etapa
                            ]
                        ]
                    }
                });

                // 4. Formatear para Nivo Funnel
                const rawData = response.data.result || [];
                const funnelData = rawData.map(item => ({
                    id: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                    value: item.stage_id_count,
                    label: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                })).sort((a, b) => b.value - a.value); // Ordenar de mayor a menor

                setData({ funnelData });

            } catch (e) {
                console.error("Error cargando dashboard:", e);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [filterType]); // <--- Se ejecuta cada vez que cambia el filtro

    return { data, loading };
};
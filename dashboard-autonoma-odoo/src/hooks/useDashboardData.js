import { useState, useEffect } from 'react';
import axios from 'axios';
import { getOdooDomain } from '../utils/dateHelpers';
import { ODOO_CONFIG } from '../config/odoo.config';

const CANAL_LABELS = {
    'whatsapp_1': 'Whatsapp Academia',
    'whatsapp_2': 'Whatsapp Colegio',
    'llamada_1': 'Llamada San José',
    'llamada_2': 'Llamada San Pedro',
    'llamada_3': 'Llamada Victor Lira',
    'messenger': 'Messenger Acad',
    'instagram': 'Instagram Acad.',
    'manual': 'Manual',
    'web': 'Web / Otros'
};

export const useDashboardData = (filterType, salespersonId) => {
    // AHORA TENEMOS 3 DATASETS: Funnel, Pie (Canal) y Bar (Carreras)
    const [data, setData] = useState({ funnelData: [], pieData: [], careerData: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // 1. FILTROS
                const dateDomain = getOdooDomain(filterType);
                const userDomain = salespersonId ? [['user_id', '=', parseInt(salespersonId)]] : [];
                const finalDomain = [...dateDomain, ...userDomain];

                // 2. AUTH
                const auth = await axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 1,
                    params: { service: "common", method: "login", args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password] }
                });
                const uid = auth.data.result;
                if (!uid) throw new Error("Auth fallida");

                // 3. PETICIÓN A: EMBUDO
                const reqFunnel = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 2,
                    params: {
                        service: "object", method: "execute_kw",
                        args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", 
                        [finalDomain, ["stage_id"], ["stage_id"]]]
                    }
                });

                // 4. PETICIÓN B: CANAL
                const reqChannel = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 3,
                    params: {
                        service: "object", method: "execute_kw",
                        args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", 
                        [finalDomain, ["canal"], ["canal"]]]
                    }
                });

                // 5. PETICIÓN C: CARRERAS (NUEVO)
                // Agrupamos por 'carrera_postulada'
                const reqCareers = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 4,
                    params: {
                        service: "object", method: "execute_kw",
                        args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", 
                        [finalDomain, ["carrera_postulada"], ["carrera_postulada"]]]
                    }
                });

                // Ejecutar las 3 a la vez
                const [resFunnel, resChannel, resCareers] = await Promise.all([reqFunnel, reqChannel, reqCareers]);

                // --- PROCESAMIENTO ---

                // A. Funnel
                const funnelData = (resFunnel.data.result || []).map(item => ({
                    id: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                    value: item.stage_id_count,
                    label: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                })).sort((a, b) => b.value - a.value);

                // B. Pie (Canal)
                const pieData = (resChannel.data.result || []).map(item => {
                    const rawKey = item.canal;
                    const label = rawKey ? (CANAL_LABELS[rawKey] || rawKey) : "Sin Canal";
                    return { id: label, label: label, value: item.canal_count };
                }).filter(i => i.value > 0).sort((a, b) => b.value - a.value);

               // C. Bar (Carreras)
                const rawCareers = resCareers.data.result || [];
                const careerData = rawCareers.map(item => {
                    // Si viene vacío (false), le ponemos "DESCONOCIDO" temporalmente
                    const carreraName = item.carrera_postulada || "DESCONOCIDO"; 
                    return {
                        carrera: carreraName,
                        value: item.carrera_postulada_count
                    };
                })
                // --- AQUÍ ESTÁ EL FILTRO ---
                // Le decimos: "Quédate solo con los que NO sean DESCONOCIDO"
                .filter(item => item.carrera !== "DESCONOCIDO") 
                .sort((a, b) => a.value - b.value)
                .slice(-10);

                setData({ funnelData, pieData, careerData });

            } catch (e) {
                console.error("Error dashboard:", e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [filterType, salespersonId]);

    return { data, loading, error };
};
// src/hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getOdooDomain } from '../utils/dateHelpers';
import { ODOO_CONFIG } from '../config/odoo.config';

const CANAL_LABELS = {
    'whatsapp_1': 'Whatsapp Academia',
    'whatsapp_2': 'Whatsapp Colegio',
    'messenger': 'Messenger',
    'instagram': 'Instagram',
    'manual': 'Manual',
    'web': 'Web / Otros'
};

const AREA_LABELS = {
    'ingenierias': 'Ingenierías 📐',
    'biomedicas': 'Biomédicas 🧬',
    'sociales': 'Sociales ⚖️'
};

export const useDashboardData = (filterType, salespersonId) => {
    // AHORA TENEMOS MÁS DATASETS
    const [data, setData] = useState({ 
        funnelData: [], 
        pieData: [], 
        careerData: [],
        areaData: [],      // <--- NUEVO
        universityData: [], // <--- NUEVO
        serviceData: []     // <--- NUEVO (Turnos/Modalidad)
    });
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

                // --- PETICIONES ---
                
                // 1. EMBUDO
                const reqFunnel = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 2,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [finalDomain, ["stage_id"], ["stage_id"]]] }
                });

                // 2. CANAL
                const reqChannel = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 3,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [finalDomain, ["canal"], ["canal"]]] }
                });

                // 3. CARRERAS
                const reqCareers = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 4,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [finalDomain, ["carrera_postulada"], ["carrera_postulada"]]] }
                });

                // 4. ÁREAS (NUEVO)
                const reqAreas = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 5,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [finalDomain, ["area"], ["area"]]] }
                });

                // 5. UNIVERSIDAD (NUEVO)
                const reqUni = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 6,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [finalDomain, ["universidad_postulada"], ["universidad_postulada"]]] }
                });

                // 6. SERVICIO EDUCATIVO (NUEVO - Para sacar turnos)
                const reqService = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 7,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [finalDomain, ["servicio_educativo"], ["servicio_educativo"]]] }
                });

                // EJECUTAR TODO
                const [resFunnel, resChannel, resCareers, resAreas, resUni, resService] = await Promise.all([reqFunnel, reqChannel, reqCareers, reqAreas, reqUni, reqService]);


                // --- PROCESAMIENTO ---

                // A. Funnel
                const funnelData = (resFunnel.data.result || []).map(item => ({
                    id: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                    value: item.stage_id_count,
                    label: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                })).sort((a, b) => b.value - a.value);

                // B. Canal
                const pieData = (resChannel.data.result || []).map(item => {
                    const label = item.canal ? (CANAL_LABELS[item.canal] || item.canal) : "Desconocido";
                    return { id: label, label: label, value: item.canal_count };
                }).filter(i => i.value > 0);

                // C. Carreras
                const careerData = (resCareers.data.result || []).map(item => ({
                    carrera: item.carrera_postulada || "DESCONOCIDO",
                    value: item.carrera_postulada_count
                })).filter(i => i.carrera !== "DESCONOCIDO").sort((a, b) => a.value - b.value).slice(-10);

                // D. Áreas (NUEVO)
                const areaData = (resAreas.data.result || []).map(item => {
                    const label = item.area ? (AREA_LABELS[item.area] || item.area) : "Sin Área";
                    return { id: label, label: label, value: item.area_count };
                }).filter(i => i.value > 0);

                // E. Universidades (NUEVO)
                const universityData = (resUni.data.result || []).map(item => ({
                    uni: item.universidad_postulada ? item.universidad_postulada.toUpperCase() : "OTRA",
                    value: item.universidad_postulada_count
                })).sort((a, b) => a.value - b.value);

                // F. Servicio (NUEVO - Raw Data)
                // Pasamos la data cruda, la procesaremos en el componente para sacar turnos
                const serviceData = resService.data.result || [];

                setData({ funnelData, pieData, careerData, areaData, universityData, serviceData });

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
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
    'facebook': 'Facebook',
    'manual': 'Manual',
    'web': 'Web / Otros'
};

const AREA_LABELS = {
    'ingenierias': 'Ingenierías 📐',
    'biomedicas': 'Biomédicas 🧬',
    'sociales': 'Sociales ⚖️'
};

const NO_MATRICULA_LABELS = {
    'precio': 'Precio',
    'propuesta': 'No convenció la propuesta',
    'competencia': 'Se fue a otra institución',
    'seguimiento': 'Falta de seguimiento',
    'familiar': 'Decisión familiar',
    'ninguno': 'Ninguno'
};

export const useDashboardData = (filterType, salespersonId, customDays, locationFilter) => {
    // AHORA TENEMOS MÁS DATASETS
    const [data, setData] = useState({ 
        funnelData: [], 
        pieData: [], 
        careerData: [],
        areaData: [],      // <--- NUEVO
        universityData: [], // <--- NUEVO
        serviceData: [],     // <--- NUEVO (Turnos/Modalidad)
        noEnrollmentData: [], // <--- NUEVO (Motivos de no matrícula)
        avgResponseTime: 0,   // <--- NUEVO (Promedio Respuesta)
        salesByAdvisor: [],   // <--- NUEVO (Ventas por Asesor)
        avgDaysToClose: 0,    // <--- NUEVO (Ciclo de Venta)
        forecastRevenue: 0,   // <--- NUEVO (Proyección)
        marketingData: [],    // <--- NUEVO (Solo Redes Sociales)
        leadsVerificationData: [], // <--- NUEVO (Datos para verificar)
        callStats: { total: 0, answered: 0, missed: 0 } // <--- NUEVO (Estadísticas Reales de Llamadas)
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // 1. FILTROS
                const dateDomain = getOdooDomain(filterType, customDays);
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
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [finalDomain, ["stage_id", "expected_revenue"], ["stage_id"]]] }
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

                // 7. MOTIVO NO MATRICULA (NUEVO)
                const reqNoEnrollment = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 8,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [finalDomain, ["motivo_no_matricula"], ["motivo_no_matricula"]]] }
                });

                // 8. PROMEDIO RESPUESTA (NUEVO)
                // Filtramos > 0 para no ensuciar el promedio con leads sin respuesta
                const domainAvg = [...finalDomain, ['promedio_respuesta_handoff', '>', 0]];
                const reqAvgResponse = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 9,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [domainAvg, ["promedio_respuesta_handoff"], ["user_id"]]] }
                });

                // 9. VENTAS POR ASESOR (Ganados)
                const domainWon = [...finalDomain, ['probability', '=', 100]];
                const reqSalesAdvisor = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 10,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [domainWon, ["user_id"], ["user_id"]]] }
                });

                // 10. CICLO DE VENTA (Días para cerrar)
                const reqDaysClose = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 11,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [domainWon, ["day_close"], ["user_id"]]] }
                });

                // 11. FORECAST (En gestión: >0% y <100%)
                const domainForecast = [...finalDomain, ['probability', '>', 0], ['probability', '<', 100]];
                const reqForecast = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 12,
                    params: { service: "object", method: "execute_kw", args: [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, "crm.lead", "read_group", [domainForecast, ["expected_revenue"], ["stage_id"]]] }
                });

                // 12. VERIFICACIÓN (Datos Crudos para Tabla)
                // Traemos TODOS los ganados para verificar fechas
                const reqVerification = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 13,
                    params: { 
                        service: "object", 
                        method: "execute_kw", 
                        args: [
                            ODOO_CONFIG.db, uid, ODOO_CONFIG.password, 
                            "crm.lead", 
                            "search_read", 
                            [[...finalDomain, ['probability', '=', 100]]], 
                            { fields: ["name", "create_date", "date_closed", "day_close"], order: "date_closed desc" } 
                        ] 
                    }
                });

                // 13. ESTADÍSTICAS DE LLAMADAS (NUEVO - Basado en tu código Python)
                // Traemos la suma de los contadores reales
                
                // A. Preparamos el dominio específico para llamadas (Filtrar por Sede/Canal)
                // 1. Usamos dateDomain: Esto asegura que si filtras "Semana", Odoo solo traiga leads de esa semana.
                //    (Usamos dateDomain en lugar de finalDomain para IGNORAR el filtro de vendedor en las llamadas globales)
                let callStatsDomain = [...dateDomain];

                // 2. Filtro de Seguridad: Forzamos que Odoo solo cuente desde el 13 de Enero 
                //    (Para no mezclar con datos antiguos que ya están en los XML)
                callStatsDomain.push(['create_date', '>=', '2025-01-13']);

                const LOCATION_MAP = {
                    'victor_lira': 'llamada_1', // Telefono 1
                    'san_jose': 'llamada_2',    // Telefono 2
                    'san_pedro': 'llamada_3'    // Telefono 3
                };
                if (locationFilter && LOCATION_MAP[locationFilter]) {
                    callStatsDomain.push(['canal', '=', LOCATION_MAP[locationFilter]]);
                }

                const reqCallStats = axios.post(ODOO_CONFIG.url, {
                    jsonrpc: "2.0", method: "call", id: 14,
                    params: { 
                        service: "object", 
                        method: "execute_kw", 
                        args: [
                            ODOO_CONFIG.db, uid, ODOO_CONFIG.password, 
                            "crm.lead", 
                            "read_group", 
                            [callStatsDomain, ["conteo_llamadas", "total_llamadas_contestadas", "total_llamadas_no_contestadas"], []] 
                        ] 
                    }
                });

                // EJECUTAR TODO
                const [resFunnel, resChannel, resCareers, resAreas, resUni, resService, resNoEnrollment, resAvgResponse, resSalesAdvisor, resDaysClose, resForecast, resVerification, resCallStats] = await Promise.all([reqFunnel, reqChannel, reqCareers, reqAreas, reqUni, reqService, reqNoEnrollment, reqAvgResponse, reqSalesAdvisor, reqDaysClose, reqForecast, reqVerification, reqCallStats]);


                // --- PROCESAMIENTO ---

                // A. Funnel
                const funnelData = (resFunnel.data.result || []).map(item => ({
                    id: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                    value: item.stage_id_count,
                    label: item.stage_id ? item.stage_id[1] : "Sin Etapa",
                    revenue: item.expected_revenue || 0
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
                const areaData = (resAreas.data.result || [])
                    .filter(item => item.area) // Excluir los que no tienen área definida
                    .map(item => {
                        const label = AREA_LABELS[item.area] || item.area;
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

                // G. Motivo No Matrícula (NUEVO)
                const noEnrollmentData = (resNoEnrollment.data.result || [])
                    .filter(item => item.motivo_no_matricula && item.motivo_no_matricula !== 'ninguno') // Excluir nulos y 'ninguno'
                    .map(item => {
                        const key = item.motivo_no_matricula;
                        const label = NO_MATRICULA_LABELS[key] || key;
                        return { id: label, label: label, value: item.motivo_no_matricula_count };
                    })
                    .filter(i => i.value > 0);

                // H. Promedio Respuesta (NUEVO)
                const avgResponseRaw = resAvgResponse.data.result || [];
                let totalWeighted = 0;
                let totalCount = 0;
                
                // Calculamos el promedio ponderado (Promedio * Cantidad / Total)
                avgResponseRaw.forEach(item => {
                    const val = item.promedio_respuesta_handoff || 0;
                    const count = item.user_id_count || 0; 
                    totalWeighted += val;
                    totalCount += count;
                });
                const avgResponseTime = totalCount > 0 ? (totalWeighted / totalCount) : 0;

                // I. Ventas por Asesor
                const salesByAdvisor = (resSalesAdvisor.data.result || []).map(item => ({
                    advisor: item.user_id ? item.user_id[1] : "Sin Asignar",
                    value: item.user_id_count
                })).sort((a, b) => b.value - a.value);

                // J. Ciclo de Venta (Promedio días cierre)
                const daysCloseRaw = resDaysClose.data.result || [];
                let totalDaysWeighted = 0;
                let totalWonCount = 0;
                daysCloseRaw.forEach(item => {
                    const val = item.day_close || 0;
                    const count = item.user_id_count || 0;
                    totalDaysWeighted += val;
                    totalWonCount += count;
                });
                const avgDaysToClose = totalWonCount > 0 ? (totalDaysWeighted / totalWonCount) : 0;

                // K. Forecast (Proyección)
                const forecastRaw = resForecast.data.result || [];
                const forecastRevenue = forecastRaw.reduce((acc, item) => acc + (item.expected_revenue || 0), 0);

                // L. Marketing Data (Solo Redes Sociales / Meta)
                // Filtramos explícitamente solo Messenger, Facebook e Instagram
                // Excluyendo: WhatsApp, Manual (Llamadas) y Web
                const marketingData = pieData.filter(item => 
                    ['Messenger', 'Facebook', 'Instagram'].includes(item.label)
                );

                // M. Datos de Verificación
                const leadsVerificationData = resVerification.data.result || [];

                // N. Estadísticas de Llamadas (NUEVO)
                const callStatsRaw = resCallStats.data.result || [];
                const callStats = {
                    total: callStatsRaw.length > 0 ? (callStatsRaw[0].conteo_llamadas || 0) : 0,
                    answered: callStatsRaw.length > 0 ? (callStatsRaw[0].total_llamadas_contestadas || 0) : 0,
                    missed: callStatsRaw.length > 0 ? (callStatsRaw[0].total_llamadas_no_contestadas || 0) : 0
                };

                setData({ funnelData, pieData, careerData, areaData, universityData, serviceData, noEnrollmentData, avgResponseTime, salesByAdvisor, avgDaysToClose, forecastRevenue, marketingData, leadsVerificationData, callStats });

            } catch (e) {
                console.error("Error dashboard:", e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [filterType, salespersonId, customDays, locationFilter]); // <--- Agregamos locationFilter a las dependencias

    return { data, loading, error };
};
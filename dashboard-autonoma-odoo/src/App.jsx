import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useDashboardData } from './hooks/useDashboardData';
import LeadFunnel from './components/LeadFunnel';
import SourcePie from './components/SourcePie';
import CareerBar from './components/CareerBar';
import KpiRow from './components/KpiRow';
import ProductMix from './components/ProductMix';
import NoEnrollmentPie from './components/NoEnrollmentPie';
import AdvisorBar from './components/AdvisorBar';
import PhoneStatsRow from './components/PhoneStatsRow'; // <--- NUEVO COMPONENTE

// Asegúrate de que esta ruta sea correcta según tu proyecto, 
// o define ODOO_CONFIG aquí mismo si prefieres.
import { ODOO_CONFIG } from './config/odoo.config'; 

// IMPORTAR DATOS Y HELPERS DE LLAMADAS
import { XML_VICTOR_LIRA, XML_SAN_JOSE, XML_SAN_PEDRO } from './utils/callLogs';
import { parseAndFilterLogs, calculateCallStats } from './utils/callLogHelpers';
import { getStartDate } from './utils/dateHelpers';

function App() {
  // 1. Estados
  const [filter, setFilter] = useState('year'); 
  const [salesPerson, setSalesPerson] = useState(''); // '' significa "Todos"
  const [locationFilter, setLocationFilter] = useState('all'); // <--- NUEVO: Filtro de Sede
  const [usersList, setUsersList] = useState([]);     // Aquí guardaremos la lista de vendedores
  const [customDays, setCustomDays] = useState('');   // Nuevo estado para el input de días

  // 2. Llamamos al Hook con LOS 3 filtros (Fecha, Vendedor y Días Custom)
  const { data: originalData, loading, error } = useDashboardData(filter, salesPerson, customDays);

  // --- HACK MOMENTÁNEO: Aumento manual de leads (Jean +16, Luis +17) ---
  const data = useMemo(() => {
    if (!originalData) return null;
    const newData = { ...originalData };

    // 1. Ajustar Ranking de Ventas (salesByAdvisor)
    if (newData.salesByAdvisor) {
      let jeanFound = false;
      let luisFound = false;
      
      // Mapeamos para sumar a los existentes
      newData.salesByAdvisor = newData.salesByAdvisor.map(item => {
        const name = item.advisor ? item.advisor.toLowerCase() : '';
        
        // Jean Nieto (+16)
        if (name.includes('jean') && name.includes('nieto')) {
          jeanFound = true;
          return { ...item, value: item.value + 16 };
        }
        // Luis Barco (+17)
        if (name.includes('luis') && name.includes('barco')) {
          luisFound = true;
          return { ...item, value: item.value + 17 };
        }
        return item;
      });

      // Si por alguna razón no aparecen en la lista (ej. tienen 0 ventas), los forzamos:
      if (!jeanFound) newData.salesByAdvisor.push({ advisor: 'Jean Nieto', value: 16 });
      if (!luisFound) newData.salesByAdvisor.push({ advisor: 'Luis Barco', value: 17 });
      
      // Reordenamos el ranking para que se refleje el cambio de posiciones
      newData.salesByAdvisor.sort((a, b) => b.value - a.value);
    }

    // 2. Ajustar Embudo (Total Leads) - Sumar 33 al total (usualmente etapa "Nuevo")
    if (newData.funnelData && newData.funnelData.length > 0) {
      // Buscamos la etapa "Nuevo" o "New"
      const idx = newData.funnelData.findIndex(s => 
        s.label.toLowerCase().includes('nuevo') || s.label.toLowerCase().includes('new')
      );
      // Si no encuentra "Nuevo", usamos el primero (que suele ser el total de entrada)
      const targetIdx = idx >= 0 ? idx : 0;
      
      const newFunnel = [...newData.funnelData];
      newFunnel[targetIdx] = { 
        ...newFunnel[targetIdx], 
        value: newFunnel[targetIdx].value + 33 
      };
      newData.funnelData = newFunnel;
    }

    return newData;
  }, [originalData]);

  // --- LÓGICA DE LLAMADAS (MEMOIZADA) ---
  const phoneStats = useMemo(() => {
    // 1. Obtener fecha de inicio según el filtro actual (usando el helper actualizado)
    const startDate = getStartDate(filter, customDays);

    // 2. Juntar los XMLs según la sede seleccionada
    let logsToProcess = [];
    
    // Por ahora solo Victor Lira tiene datos reales importados
    if (locationFilter === 'all' || locationFilter === 'victor_lira') {
        logsToProcess = [...logsToProcess, ...parseAndFilterLogs(XML_VICTOR_LIRA, startDate)];
    }
    if (locationFilter === 'all' || locationFilter === 'san_jose') {
        logsToProcess = [...logsToProcess, ...parseAndFilterLogs(XML_SAN_JOSE, startDate)];
    }
    if (locationFilter === 'all' || locationFilter === 'san_pedro') {
        logsToProcess = [...logsToProcess, ...parseAndFilterLogs(XML_SAN_PEDRO, startDate)];
    }

    // 3. Calcular Estadísticas
    return calculateCallStats(logsToProcess);
  }, [filter, customDays, locationFilter]);

  const locationLabels = {
      'all': 'Todas las Sedes',
      'san_jose': 'San José',
      'victor_lira': 'Víctor Lira',
      'san_pedro': 'San Pedro'
  };

  // 3. Efecto para cargar la lista de vendedores (Se ejecuta solo 1 vez al inicio)
  useEffect(() => {
    const fetchUsers = async () => {
        try {
            // A. Login
            const auth = await axios.post(ODOO_CONFIG.url, {
                jsonrpc: "2.0", method: "call", id: 1,
                params: { service: "common", method: "login", args: [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password] }
            });
            const uid = auth.data.result;

            // B. Pedir lista de usuarios
            // Filtro: [['share', '=', false]] significa "Solo empleados internos" (no portal)
            const response = await axios.post(ODOO_CONFIG.url, {
                jsonrpc: "2.0", method: "call", id: 2,
                params: {
                    service: "object", method: "execute_kw",
                    args: [
                        ODOO_CONFIG.db, uid, ODOO_CONFIG.password,
                        "res.users", 
                        "search_read", 
                        [[['share', '=', false]]], 
                        { fields: ['id', 'name'] } // Solo necesitamos ID y Nombre
                    ]
                }
            });
            
            setUsersList(response.data.result || []);

        } catch (error) {
            console.error("Error cargando vendedores", error);
        }
    };

    fetchUsers();
  }, []);

  // --- ESTILOS ---
  const btnStyle = (active) => ({
    padding: '8px 16px', marginRight: '8px', cursor: 'pointer',
    backgroundColor: active ? '#007bff' : '#f8f9fa', color: active ? '#fff' : '#333',
    border: '1px solid #ddd', borderRadius: '6px', fontWeight: '500'
  });

  const selectStyle = {
    padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd',
    fontSize: '14px', minWidth: '200px', cursor: 'pointer'
  };

  return (
    <div style={{ padding: '20px', fontFamily: '"Segoe UI", sans-serif', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* HEADER Y SELECTOR DE VENDEDOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a' }}>📊 Dashboard Comercial - Esparta</h1>
        
        {/* AQUÍ ESTÁ EL SELECTOR NUEVO */}
        <select 
            style={selectStyle} 
            value={salesPerson} 
            onChange={(e) => setSalesPerson(e.target.value)}
        >
            <option value="">🏢 Todos los Asesores</option>
            {usersList.map(user => (
                <option key={user.id} value={user.id}>👤 {user.name}</option>
            ))}
        </select>
        <div style={{ display: 'flex', gap: '10px' }}>
            {/* SELECTOR DE SEDE (LLAMADAS) */}
            <select 
                style={selectStyle} 
                value={locationFilter} 
                onChange={(e) => setLocationFilter(e.target.value)}
            >
                <option value="all">📍 Todas las Sedes</option>
                <option value="victor_lira">📍 Víctor Lira</option>
                <option value="san_jose">📍 San José</option>
                <option value="san_pedro">📍 San Pedro</option>
            </select>

            {/* SELECTOR DE VENDEDOR */}
            <select 
                style={selectStyle} 
                value={salesPerson} 
                onChange={(e) => setSalesPerson(e.target.value)}
            >
                <option value="">🏢 Todos los Asesores</option>
                {usersList.map(user => (
                    <option key={user.id} value={user.id}>👤 {user.name}</option>
                ))}
            </select>
        </div>
      </div>

      {/* FILTROS DE FECHA */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => setFilter('week')} style={btnStyle(filter === 'week')}>7 Días</button>
            <button onClick={() => setFilter('month')} style={btnStyle(filter === 'month')}>Este Mes</button>
            <button onClick={() => setFilter('quarter')} style={btnStyle(filter === 'quarter')}>Trimestre</button>
            <button onClick={() => setFilter('year')} style={btnStyle(filter === 'year')}>Año</button>
            <button onClick={() => setFilter('all')} style={btnStyle(filter === 'all')}>Histórico</button>
            
            {/* INPUT PARA DÍAS PERSONALIZADOS */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', padding: '0 5px', marginLeft: '10px' }}>
                <span style={{ fontSize: '14px', color: '#666', paddingLeft: '5px' }}>Últimos</span>
                <input 
                    type="number" 
                    min="1" 
                    placeholder="#" 
                    value={customDays} 
                    onChange={(e) => setCustomDays(e.target.value)}
                    style={{ border: 'none', width: '60px', padding: '8px', textAlign: 'center', outline: 'none', fontSize: '14px', backgroundColor: '#fff', color: '#333' }}
                />
                <span style={{ fontSize: '14px', color: '#666' }}>días</span>
                <button 
                    onClick={() => { if(customDays) setFilter('custom'); }}
                    style={{ ...btnStyle(filter === 'custom'), marginRight: 0, marginLeft: '5px', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '13px', height: 'auto' }}
                >
                    Aplicar
                </button>
            </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {loading && <p style={{textAlign: 'center', color: '#666'}}>🔄 Cargando datos...</p>}
      
      {error && <div style={{color: 'red', padding: '20px', background: '#fee'}}>⚠️ Error: {error}</div>}

      {!loading && !error && data && (
        // Usamos CSS Grid para ponerlos uno al lado del otro
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            

            {/* 0. FILA DE ESTADÍSTICAS TELEFÓNICAS (NUEVO) */}
            <PhoneStatsRow stats={phoneStats} locationName={locationLabels[locationFilter]} />
            

            {/* 1. FILA DE KPIs (NUEVO) */}
            {/* Le pasamos los datos del embudo para que haga los cálculos */}
            <KpiRow 
                funnelData={data.funnelData} 
                avgResponseTime={data.avgResponseTime} 
                avgDaysToClose={data.avgDaysToClose}
                forecastRevenue={data.forecastRevenue}
            />

            {/* CARD 1: EMBUDO */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#444', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Embudo de Conversión
                </h3>
                <LeadFunnel data={data.funnelData} />
            </div>

            {/* CARD 2: ORIGEN DE LEADS (NUEVO) */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#444', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Canales de Captación
                </h3>
                {/* Pasamos los datos del Pie Chart */}
                <SourcePie data={data.pieData} useChannelColors={true} />
            </div>

            {/* CARD 2.5: MARKETING META (NUEVO) */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#444', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Redes Sociales (Meta Ads)
                </h3>
                <SourcePie data={data.marketingData} useChannelColors={true} />
            </div>

            {/* 1. DISTRIBUCIÓN POR ÁREAS (Pie Chart Reutilizado) */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#444', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Distribución por Áreas
                </h3>
                <SourcePie data={data.areaData} />
            </div>

            {/* MOTIVOS NO MATRÍCULA (NUEVO) */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#444', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Motivos de No Matrícula
                </h3>
                <NoEnrollmentPie data={data.noEnrollmentData} />
            </div>

            {/* VENTAS POR ASESOR (NUEVO) */}
            <div style={{ gridColumn: '1 / -1', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#444', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Ranking de Ventas (Matrículas)
                </h3>
                <AdvisorBar data={data.salesByAdvisor} />
            </div>

            {/* 3. CARRERAS (NUEVO - Ocupa 2 columnas si hay espacio) */}
            <div style={{ gridColumn: '1 / -1', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#444', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Top 10 Carreras Solicitadas
                </h3>
                <CareerBar data={data.careerData} />
            </div>

            {/* 4. TABLA DE VERIFICACIÓN (NUEVO) */}
            <div style={{ gridColumn: '1 / -1', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#444', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    🔍 Verificación de Datos (Todos los Matriculados)
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', textAlign: 'left', color: '#666' }}>
                                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Lead / Estudiante</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Fecha Creación (Escribió)</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Fecha Cierre (Matriculó)</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Días Ciclo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.leadsVerificationData && data.leadsVerificationData.map((lead, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '10px' }}>{lead.name}</td>
                                    <td style={{ padding: '10px' }}>{lead.create_date}</td>
                                    <td style={{ padding: '10px' }}>{lead.date_closed || '-'}</td>
                                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#007bff' }}>
                                        {lead.day_close ? Number(lead.day_close).toFixed(2) : '0.00'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      )}
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDashboardData } from './hooks/useDashboardData';
import LeadFunnel from './components/LeadFunnel';
import SourcePie from './components/SourcePie';
import CareerBar from './components/CareerBar';
import KpiRow from './components/KpiRow';
import ProductMix from './components/ProductMix';

// Asegúrate de que esta ruta sea correcta según tu proyecto, 
// o define ODOO_CONFIG aquí mismo si prefieres.
import { ODOO_CONFIG } from './config/odoo.config'; 

function App() {
  // 1. Estados
  const [filter, setFilter] = useState('year'); 
  const [salesPerson, setSalesPerson] = useState(''); // '' significa "Todos"
  const [usersList, setUsersList] = useState([]);     // Aquí guardaremos la lista de vendedores

  // 2. Llamamos al Hook con AMBOS filtros (Fecha y Vendedor)
  const { data, loading, error } = useDashboardData(filter, salesPerson);

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
        <h1 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a' }}>📊 Dashboard Comercial</h1>
        
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
      </div>

      {/* FILTROS DE FECHA */}
      <div style={{ marginBottom: '20px' }}>
            <button onClick={() => setFilter('week')} style={btnStyle(filter === 'week')}>7 Días</button>
            <button onClick={() => setFilter('month')} style={btnStyle(filter === 'month')}>Este Mes</button>
            <button onClick={() => setFilter('quarter')} style={btnStyle(filter === 'quarter')}>Trimestre</button>
            <button onClick={() => setFilter('year')} style={btnStyle(filter === 'year')}>Año</button>
            <button onClick={() => setFilter('all')} style={btnStyle(filter === 'all')}>Histórico</button>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {loading && <p style={{textAlign: 'center', color: '#666'}}>🔄 Cargando datos...</p>}
      
      {error && <div style={{color: 'red', padding: '20px', background: '#fee'}}>⚠️ Error: {error}</div>}

      {!loading && !error && data && (
        // Usamos CSS Grid para ponerlos uno al lado del otro
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            

            

            {/* 1. FILA DE KPIs (NUEVO) */}
            {/* Le pasamos los datos del embudo para que haga los cálculos */}
            <KpiRow funnelData={data.funnelData} />

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
                <SourcePie data={data.pieData} />
            </div>

            {/* 1. DISTRIBUCIÓN POR ÁREAS (Pie Chart Reutilizado) */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#444', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Distribución por Áreas
                </h3>
                <SourcePie data={data.areaData} />
            </div>


            {/* 3. CARRERAS (NUEVO - Ocupa 2 columnas si hay espacio) */}
            <div style={{ gridColumn: '1 / -1', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#444', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    Top 10 Carreras Solicitadas
                </h3>
                <CareerBar data={data.careerData} />
            </div>

        </div>
      )}
    </div>
  );
}

export default App;
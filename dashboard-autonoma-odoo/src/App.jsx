// src/App.jsx
import React, { useState } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import LeadFunnel from './components/LeadFunnel';

function App() {
  // Estado del filtro: 'week', 'month', 'quarter', 'year', 'all'
  const [filter, setFilter] = useState('month'); 
  
  // El hook se encarga de traer los datos correctos cuando el filtro cambia
  const { data, loading } = useDashboardData(filter);

  // Estilos simples para los botones
  const btnStyle = (active) => ({
    padding: '8px 16px',
    marginRight: '10px',
    cursor: 'pointer',
    backgroundColor: active ? '#007bff' : '#f0f0f0',
    color: active ? '#fff' : '#333',
    border: 'none',
    borderRadius: '5px',
    fontWeight: 'bold'
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER Y SELECTOR DE FECHAS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Dashboard Comercial</h1>
        <div>
            <button onClick={() => setFilter('week')} style={btnStyle(filter === 'week')}>7 Días</button>
            <button onClick={() => setFilter('month')} style={btnStyle(filter === 'month')}>Este Mes</button>
            <button onClick={() => setFilter('quarter')} style={btnStyle(filter === 'quarter')}>Trimestre</button>
            <button onClick={() => setFilter('year')} style={btnStyle(filter === 'year')}>Año</button>
        </div>
      </div>

      {/* ZONA DE CARGA Y ERRORES */}
      {loading && <p>🔄 Actualizando datos de Odoo...</p>}

      {/* CONTENIDO PRINCIPAL */}
      {!loading && data && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#555' }}>Embudo de Conversión ({filter})</h3>
            {/* Aquí pasamos los datos formateados al gráfico */}
            <LeadFunnel data={data.funnelData} />
        </div>
      )}
    </div>
  );
}

export default App;
import React, { useEffect, useState } from 'react';
import axios from 'axios';

// --- CONFIGURACIÓN (PON TUS DATOS DE N8N AQUÍ) ---
const ODOO_CONFIG = {
  url: '/odoo-api', // <--- CAMBIO CLAVE: Apuntamos al proxy local
  db: 'crm_final_restored',
  username: 'autonoma@jpawaj.com',
  password: 'jpawajacademiaesparta01'
};

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, porEtapa: {} });

  // Función para hacer llamadas RPC a Odoo
  const odooCall = async (service, method, args) => {
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: service,
        method: method,
        args: args,
      },
      id: Math.floor(Math.random() * 1000000000),
    };

    return axios.post(ODOO_CONFIG.url, payload, { // Ya no usamos /jsonrpc aquí porque el proxy lo añade
      headers: { 'Content-Type': 'application/json' }
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("1. Autenticando...");
        // Paso A: Autenticar para obtener el UID (User ID)
        const authResponse = await odooCall("common", "login", [
          ODOO_CONFIG.db,
          ODOO_CONFIG.username,
          ODOO_CONFIG.password
        ]);

        const uid = authResponse.data.result;
        
        if (!uid) {
          throw new Error("Fallo la autenticación. Revisa usuario/pass/db.");
        }
        console.log("Autenticado! UID:", uid);

        // Paso B: Buscar los Leads (limitado a 100 para probar)
        console.log("2. Buscando Leads...");
        const searchResponse = await odooCall("object", "execute_kw", [
          ODOO_CONFIG.db,
          uid,
          ODOO_CONFIG.password,
          "crm.lead",
          "search_read",
          [[]], // Filtro vacío = Traer todos (Cuidado si son miles)
          { 
            fields: ["name", "stage_id", "expected_revenue"], 
            limit: 100 
          }
        ]);

        const data = searchResponse.data.result;
        
        if (data) {
          setLeads(data);
          calcularEstadisticas(data);
        }

      } catch (err) {
        console.error("Error:", err);
        setError(err.message || "Error conectando a Odoo (Posible bloqueo CORS)");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función simple para agrupar datos
  const calcularEstadisticas = (data) => {
    const conteo = {};
    data.forEach(lead => {
      // stage_id viene como [id, "Nombre Etapa"] o false
      const nombreEtapa = lead.stage_id ? lead.stage_id[1] : "Sin Etapa";
      conteo[nombreEtapa] = (conteo[nombreEtapa] || 0) + 1;
    });
    setStats({ total: data.length, porEtapa: conteo });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Conexión React + Odoo</h1>
      
      {loading && <p>🔄 Cargando datos del CRM...</p>}
      {error && <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>
        <strong>Error:</strong> {error}
        <br/><small>Nota: Si ves un "Network Error", es probable que Odoo esté bloqueando la conexión externa (CORS).</small>
      </div>}

      {!loading && !error && (
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Panel Izquierdo: Resumen */}
          <div style={{ flex: 1, border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h2>Resumen</h2>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>Total Leads: {stats.total}</p>
            <h3>Por Etapa:</h3>
            <ul>
              {Object.entries(stats.porEtapa).map(([etapa, cantidad]) => (
                <li key={etapa}><strong>{etapa}:</strong> {cantidad}</li>
              ))}
            </ul>
          </div>

          {/* Panel Derecho: Lista Cruda (para verificar) */}
          <div style={{ flex: 1, background: '#f5f5f5', padding: '15px', borderRadius: '8px', maxHeight: '400px', overflow: 'auto' }}>
            <h3>Datos Crudos (Primeros 5)</h3>
            <pre>{JSON.stringify(leads.slice(0, 5), null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
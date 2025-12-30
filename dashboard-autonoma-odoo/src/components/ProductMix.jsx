// src/components/ProductMix.jsx
import React from 'react';

const ProductMix = ({ serviceData }) => {
    if (!serviceData || serviceData.length === 0) return null;

    // 1. Lógica de Agrupación
    let manana = 0;
    let tarde = 0;
    let presencial = 0;
    let virtual = 0;

    serviceData.forEach(item => {
        const key = item.servicio_educativo || "";
        const count = item.servicio_educativo_count;

        // Detectar Turno
        if (key.includes('man')) manana += count;
        if (key.includes('tar')) tarde += count;

        // Detectar Modalidad
        if (key.includes('pre') || key.includes('presencial')) presencial += count;
        if (key.includes('vir') || key.includes('virtual')) virtual += count;
    });

    const totalTurno = manana + tarde;
    const totalMod = presencial + virtual;

    // Helpers para porcentaje
    const getPct = (val, total) => total > 0 ? ((val / total) * 100).toFixed(0) + '%' : '0%';

    // Estilos Simples
    const containerStyle = { display: 'flex', gap: '20px', marginTop: '10px' };
    const boxStyle = { flex: 1, background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' };
    const numberStyle = { fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', margin: '5px 0' };
    const labelStyle = { color: '#7f8c8d', fontSize: '14px', marginBottom: '5px' };
    const barContainer = { height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden', marginTop: '10px' };
    
    return (
        <div style={containerStyle}>
            {/* CAJA 1: TURNOS */}
            <div style={boxStyle}>
                <h4 style={{margin: '0 0 15px 0', color: '#555'}}>☀️ Turnos</h4>
                <div style={{display:'flex', justifyContent:'space-around'}}>
                    <div>
                        <div style={labelStyle}>Mañana</div>
                        <div style={numberStyle}>{manana}</div>
                        <small style={{color:'#aaa'}}>{getPct(manana, totalTurno)}</small>
                    </div>
                    <div style={{borderLeft:'1px solid #ddd'}}></div>
                    <div>
                        <div style={labelStyle}>Tarde</div>
                        <div style={numberStyle}>{tarde}</div>
                        <small style={{color:'#aaa'}}>{getPct(tarde, totalTurno)}</small>
                    </div>
                </div>
                {/* Mini Barra Visual */}
                <div style={barContainer}>
                    <div style={{width: getPct(manana, totalTurno), height:'100%', background:'#f39c12'}}></div>
                </div>
            </div>

            {/* CAJA 2: MODALIDAD */}
            <div style={boxStyle}>
                <h4 style={{margin: '0 0 15px 0', color: '#555'}}>🏫 Modalidad</h4>
                <div style={{display:'flex', justifyContent:'space-around'}}>
                    <div>
                        <div style={labelStyle}>Presencial</div>
                        <div style={numberStyle}>{presencial}</div>
                        <small style={{color:'#aaa'}}>{getPct(presencial, totalMod)}</small>
                    </div>
                    <div style={{borderLeft:'1px solid #ddd'}}></div>
                    <div>
                        <div style={labelStyle}>Virtual</div>
                        <div style={numberStyle}>{virtual}</div>
                        <small style={{color:'#aaa'}}>{getPct(virtual, totalMod)}</small>
                    </div>
                </div>
                <div style={barContainer}>
                    <div style={{width: getPct(presencial, totalMod), height:'100%', background:'#3498db'}}></div>
                </div>
            </div>
        </div>
    );
};

export default ProductMix;
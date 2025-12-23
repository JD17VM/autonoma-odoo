import React from 'react';

const KpiRow = ({ funnelData }) => {
    if (!funnelData) return null;

    // --- 1. LÓGICA DE CÁLCULO ---
    
    // A. Total General
    const totalLeads = funnelData.reduce((acc, item) => acc + item.value, 0);

    // B. Nuevos
    const newStageItem = funnelData.find(item => 
        item.label.toLowerCase().includes('nuev') || 
        item.label.toLowerCase().includes('new')
    );
    const countNew = newStageItem ? newStageItem.value : 0;

    // C. Interesados Reales
    const interesadosReales = totalLeads - countNew;

    // D. Matriculados (Ganados)
    const wonStageItem = funnelData.find(item => 
        item.label.toLowerCase().includes('ganado') || 
        item.label.toLowerCase().includes('matriculado') || 
        item.label.toLowerCase().includes('won')
    );
    const countMatriculados = wonStageItem ? wonStageItem.value : 0;

    // E. Tasa de Conversión (Eficiencia)
    const conversionRate = interesadosReales > 0 
        ? ((countMatriculados / interesadosReales) * 100).toFixed(1) 
        : 0;

    // --- F. PORCENTAJES VISUALES ---
    // Total siempre es 100% (si hay datos)
    const pctTotal = totalLeads > 0 ? 100 : 0;
    const pctGestion = totalLeads > 0 ? ((interesadosReales / totalLeads) * 100).toFixed(0) : 0;
    const pctMatriculados = totalLeads > 0 ? ((countMatriculados / totalLeads) * 100).toFixed(0) : 0;


    // --- 2. ESTILOS ---
    const containerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px',
        marginBottom: '20px'
    };

    const cardStyle = (color) => ({
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        borderLeft: `5px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    });

    const titleStyle = { margin: 0, color: '#888', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' };
    const valueStyle = { margin: '10px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#333' };
    const smallPctStyle = { fontSize: '16px', color: '#999', fontWeight: 'normal', marginLeft: '6px' };
    const subStyle = { margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' };

    return (
        <div style={containerStyle}>
            
            {/* CARD 1: TOTAL LEAD (100%) */}
            <div style={cardStyle('#f39c12')}>
                <h4 style={titleStyle}>Total Leads</h4>
                <p style={valueStyle}>
                    {totalLeads}
                    <span style={smallPctStyle}>({pctTotal}%)</span>
                </p>
                <p style={subStyle}>Total de contactos recibidos</p>
            </div>

            {/* CARD 2: EN GESTIÓN */}
            <div style={cardStyle('#3498db')}>
                <h4 style={titleStyle}>En Gestión</h4>
                <p style={valueStyle}>
                    {interesadosReales}
                    <span style={smallPctStyle}>({pctGestion}%)</span>
                </p>
                <p style={subStyle}>Excluyendo etapa "Nuevo"</p>
            </div>

            {/* CARD 3: MATRICULADOS */}
            <div style={cardStyle('#2ecc71')}>
                <h4 style={titleStyle}>Matriculados</h4>
                <p style={valueStyle}>
                    {countMatriculados}
                    <span style={smallPctStyle}>({pctMatriculados}%)</span>
                </p>
                <p style={subStyle}>Ventas cerradas</p>
            </div>

            {/* CARD 4: TASA DE CIERRE */}
            <div style={cardStyle('#9b59b6')}>
                <h4 style={titleStyle}>Tasa de Cierre</h4>
                <p style={valueStyle}>{conversionRate}%</p>
                <p style={subStyle}>De gestión a matrícula</p>
            </div>

        </div>
    );
};

export default KpiRow;
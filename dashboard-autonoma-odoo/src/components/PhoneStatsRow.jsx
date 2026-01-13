// src/components/PhoneStatsRow.jsx
import React from 'react';

const Card = ({ title, value, color, icon }) => (
    <div style={{ 
        background: '#fff', 
        padding: '15px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `4px solid ${color}`,
        flex: 1,
        minWidth: '150px'
    }}>
        <div style={{ fontSize: '24px', marginBottom: '5px' }}>{icon}</div>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{title}</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{value}</div>
    </div>
);

const PhoneStatsRow = ({ stats, locationName }) => {
    if (!stats) return null;

    return (
        <div style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>
            <h3 style={{ marginTop: 0, color: '#444', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📞 Gestión Telefónica - {locationName}
            </h3>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <Card title="Realizadas" value={stats.outgoing} color="#007bff" icon="↗️" />
                <Card title="Recibidas" value={stats.incoming} color="#28a745" icon="↙️" />
                <Card title="No Contestadas" value={stats.missed} color="#dc3545" icon="❌" />
                <Card title="Duración Prom." value={stats.avgDurationFormatted} color="#ffc107" icon="⏱️" />
            </div>
        </div>
    );
};

export default PhoneStatsRow;

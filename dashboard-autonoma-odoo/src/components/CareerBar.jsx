// src/components/CareerBar.jsx
import React from 'react';
import { ResponsiveBar } from '@nivo/bar';

const CareerBar = ({ data }) => {
    if (!data || data.length === 0) return <div style={{height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa'}}>Sin datos de carreras</div>;

    return (
        <div style={{ height: 350 }}>
            <ResponsiveBar
                data={data}
                keys={['value']}
                indexBy="carrera"
                layout="horizontal" // <--- CLAVE: Barras horizontales para leer los nombres
                margin={{ top: 10, right: 30, bottom: 50, left: 140 }} // Left grande para los nombres largos
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'nivo' }}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Cantidad de Interesados',
                    legendPosition: 'middle',
                    legendOffset: 40
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0, // Nombres rectos
                    legend: '',
                    legendPosition: 'middle',
                    legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                role="application"
                ariaLabel="Gráfico de carreras"
            />
        </div>
    );
};

export default CareerBar;
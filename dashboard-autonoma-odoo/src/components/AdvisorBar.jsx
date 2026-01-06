// src/components/AdvisorBar.jsx
import React from 'react';
import { ResponsiveBar } from '@nivo/bar';

const AdvisorBar = ({ data }) => {
    if (!data || data.length === 0) return <div style={{height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa'}}>Sin ventas registradas</div>;

    return (
        <div style={{ height: 350 }}>
            <ResponsiveBar
                data={data}
                keys={['value']}
                indexBy="advisor"
                margin={{ top: 20, right: 30, bottom: 50, left: 100 }} // Left espacio para nombres
                padding={0.3}
                layout="horizontal" // Barras horizontales para leer mejor los nombres
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'set2' }} // Colores diferentes a las carreras
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Cantidad de Matrículas',
                    legendPosition: 'middle',
                    legendOffset: 40
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: '',
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                role="application"
            />
        </div>
    );
};

export default AdvisorBar;
// src/components/LeadFunnel.jsx
import React from 'react';
import { ResponsiveFunnel } from '@nivo/funnel';

const LeadFunnel = ({ data }) => {
    if (!data || data.length === 0) return <p style={{textAlign: 'center'}}>No hay datos en este periodo</p>;

    // 1. Calculamos el TOTAL SUMADO de todas las etapas
    // Esto nos sirve para calcular el porcentaje relativo de cada barra
    const totalValue = data.reduce((acc, item) => acc + item.value, 0);

    return (
        <div style={{ height: 400 }}>
            <ResponsiveFunnel
                data={data}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                
                // 2. CAMBIO CLAVE: Personalizamos la etiqueta (Label)
                // item.data.label = Nombre de la etapa
                // item.value = Cantidad
                // El cálculo final saca el porcentaje
                label={item => {
                    const percent = ((item.value / totalValue) * 100).toFixed(0);
                    return `${item.data.label}: (${percent}%)`;
                }}

                // Formato del tooltip (lo que sale al pasar el mouse)
                valueFormat=">-.0f"
                
                colors={{ scheme: 'spectral' }}
                borderWidth={20}
                labelColor={{ from: 'color', modifiers: [['darker', 3]] }}
                beforeSeparatorLength={100}
                beforeSeparatorOffset={20}
                afterSeparatorLength={100}
                afterSeparatorOffset={20}
                currentPartSizeExtension={10}
                currentSeparatorSizeExtension={10}
                motionConfig="wobbly"
            />
        </div>
    );
};

export default LeadFunnel;
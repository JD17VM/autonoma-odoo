// src/components/LeadFunnel.jsx
import React from 'react';
import { ResponsiveFunnel } from '@nivo/funnel';

const LeadFunnel = ({ data }) => {
    if (!data || data.length === 0) return <p style={{textAlign: 'center'}}>No hay datos en este periodo</p>;

    return (
        <div style={{ height: 400 }}>
            <ResponsiveFunnel
                data={data}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
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
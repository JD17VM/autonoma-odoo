// src/utils/callLogHelpers.js

export const parseAndFilterLogs = (xmlString, startDate) => {
    // Validación básica para evitar errores si el XML es null o undefined
    if (!xmlString || typeof xmlString !== 'string') return [];

    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const logs = xmlDoc.getElementsByTagName("callLog");
        const result = [];
        
        // Convertimos la fecha de filtro a timestamp (ms)
        const minTime = startDate ? startDate.getTime() : 0;

        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            // dateTime en el XML viene en milisegundos
            const dateTimeStr = log.getElementsByTagName("dateTime")[0]?.textContent;
            const dateTime = dateTimeStr ? parseInt(dateTimeStr) : 0;
            
            // FILTRO DE FECHA: Solo agregamos si la fecha es mayor o igual al filtro
            if (dateTime >= minTime) {
                result.push({
                    phoneNumber: log.getElementsByTagName("phoneNumber")[0]?.textContent,
                    dateTime: dateTime,
                    duration: parseInt(log.getElementsByTagName("callDuration")[0]?.textContent || 0),
                    type: parseInt(log.getElementsByTagName("logType")[0]?.textContent || 0)
                });
            }
        }
        return result;
    } catch (e) {
        console.error("Error parseando XML de llamadas:", e);
        return [];
    }
};

export const calculateCallStats = (logs) => {
    let incoming = 0; // Tipo 1
    let outgoing = 0; // Tipo 2
    let missed = 0;   // Tipo 3
    let totalDuration = 0;
    let connectedCalls = 0;

    logs.forEach(log => {
        if (log.type === 1) {
            incoming++;
            // Consideramos conectada si dura más de 0 seg
            if (log.duration > 0) {
                totalDuration += log.duration;
                connectedCalls++;
            }
        } else if (log.type === 2) {
            outgoing++;
            if (log.duration > 0) {
                totalDuration += log.duration;
                connectedCalls++;
            }
        } else if (log.type === 3) {
            missed++;
        }
    });

    // Calcular promedio en segundos
    const avgSeconds = connectedCalls > 0 ? (totalDuration / connectedCalls) : 0;

    // Formatear duración (ej: "1m 30s")
    const mins = Math.floor(avgSeconds / 60);
    const secs = Math.floor(avgSeconds % 60);
    const avgDurationFormatted = `${mins}m ${secs}s`;

    return {
        incoming,
        outgoing,
        missed,
        avgDurationFormatted,
        totalCalls: logs.length
    };
};

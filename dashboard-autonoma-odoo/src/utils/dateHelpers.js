// src/utils/dateHelpers.js

// Función auxiliar para obtener la fecha de inicio (objeto Date)
export const getStartDate = (filterType, customDays = 0) => {
    const today = new Date();
    let startDate = new Date(today); // Clonamos para no mutar today

    switch (filterType) {
        case 'week':
            startDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'quarter': // 3 meses
            startDate.setMonth(today.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        case 'custom': // Lógica para días personalizados
            if (customDays && customDays > 0) {
                startDate.setDate(today.getDate() - parseInt(customDays));
            } else {
                return null; // Sin filtro
            }
            break;
        default:
            return null; // Si es "todo", no filtramos nada
    }
    
    // Reseteamos horas a 00:00:00 para comparar correctamente
    startDate.setHours(0, 0, 0, 0);
    return startDate;
};

export const getOdooDomain = (filterType, customDays = 0) => {
    const startDate = getStartDate(filterType, customDays);
    
    if (!startDate) return [];

    // Formatear a YYYY-MM-DD para Odoo
    const formattedDate = startDate.toISOString().split('T')[0];
    
    // Retornamos el filtro que Odoo entiende
    // "create_date" es la fecha de creación del Lead
    return [['create_date', '>=', formattedDate]];
};
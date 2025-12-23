// src/utils/dateHelpers.js

export const getOdooDomain = (filterType) => {
    const today = new Date();
    let startDate = new Date();

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
        default:
            return []; // Si es "todo", no filtramos nada
    }

    // Formatear a YYYY-MM-DD para Odoo
    const formattedDate = startDate.toISOString().split('T')[0];
    
    // Retornamos el filtro que Odoo entiende
    // "create_date" es la fecha de creación del Lead
    return [['create_date', '>=', formattedDate]];
};
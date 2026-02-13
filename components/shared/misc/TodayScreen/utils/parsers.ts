// Función para parsear las series
export const parseSeries = (seriesData?: any) => {
    if (!seriesData || seriesData === '' || seriesData === 'undefined' || seriesData === 'null') {
        return [];
    }

    // Si es un string, usar el formato anterior
    if (typeof seriesData === 'string') {
        const parsed = seriesData.split(';').map((group, index) => {
            const cleanGroup = group.trim().replace(/[()]/g, '');
            const parts = cleanGroup.split('-');

            if (parts.length >= 1) {
                return {
                    id: index + 1,
                    reps: parts[0] || '10',
                    kg: parts[1] || '0',
                    sets: parts[2] || '1'
                };
            }
            return null;
        }).filter(Boolean);

        return parsed;
    }

    // Si es un array de objetos (nuevo formato)
    if (Array.isArray(seriesData)) {
        return seriesData.map((block, index) => ({
            id: index + 1,
            reps: block.reps || block.repeticiones || '',
            kg: block.kg || block.peso || '',
            sets: block.sets || block.series || block.series_num || '1'
        }));
    }

    return [];
};

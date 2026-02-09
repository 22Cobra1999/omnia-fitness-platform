// Función para parsear las series
export const parseSeries = (seriesData?: any) => {
    if (!seriesData || seriesData === '' || seriesData === 'undefined' || seriesData === 'null') {
        // console.log('🔍 [parseSeries] No hay datos de series:', seriesData);
        return [];
    }

    // console.log('🔍 [parseSeries] Datos recibidos:', seriesData);

    // Si es un string, usar el formato anterior
    if (typeof seriesData === 'string') {
        const parsed = seriesData.split(';').map((group, index) => {
            const cleanGroup = group.trim().replace(/[()]/g, '');
            const parts = cleanGroup.split('-');

            if (parts.length >= 3) {
                return {
                    id: index + 1,
                    reps: parts[0],
                    kg: parts[1],
                    sets: parts[2]
                };
            }
            return null;
        }).filter(Boolean);

        // console.log('🔍 [parseSeries] Datos parseados:', parsed);
        return parsed;
    }

    // Si es un array de objetos (nuevo formato)
    if (Array.isArray(seriesData)) {
        return seriesData.map((block, index) => ({
            id: index + 1,
            reps: block.repeticiones,
            kg: block.peso,
            sets: block.series
        }));
    }

    // console.log('🔍 [parseSeries] Formato no reconocido:', typeof seriesData);
    return [];
};

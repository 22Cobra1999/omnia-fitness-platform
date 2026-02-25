// Función para parsear las series
export const parseSeries = (seriesData?: any) => {
    if (!seriesData || seriesData === '' || seriesData === 'undefined' || seriesData === 'null') {
        return [];
    }

    // Caso 1: Es un string que parece JSON (usualmente del Motor Adaptativo v3.0)
    if (typeof seriesData === 'string' && (seriesData.trim().startsWith('{') || seriesData.trim().startsWith('['))) {
        try {
            const data = JSON.parse(seriesData);
            const items = Array.isArray(data) ? data : [data];
            return items.map((item, index) => ({
                id: index + 1,
                reps: item.reps || item.repeticiones || item.r || '10',
                kg: item.kg || item.peso || item.p || item.load || '0',
                sets: item.sets || item.series || item.s || '1'
            }));
        } catch (e) {
            // No es JSON válido, seguir al caso string estándar
        }
    }

    // Caso 2: Es un string delimitado por ";" (formato legado)
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

    // Caso 3: Es un array de objetos (nuevo formato directo)
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

import * as React from 'react';

export function useExerciseEditing() {
    const [editableSeries, setEditableSeries] = React.useState<Array<{ id: number, reps: string, kg: string, series: string }>>([]);
    const [editingBlockIndex, setEditingBlockIndex] = React.useState<number | null>(null);
    const [originalSeries, setOriginalSeries] = React.useState<Array<{ id: number, reps: string, kg: string, series: string }>>([]);
    const [isEditing, setIsEditing] = React.useState(false);
    const [sourceDate, setSourceDate] = React.useState<Date | null>(null);
    const [targetDate, setTargetDate] = React.useState<Date | null>(null);
    const [applyToAllSameDays, setApplyToAllSameDays] = React.useState(false);

    const startEditing = React.useCallback((series: any[], blockIndex: number) => {
        setOriginalSeries(series);
        setEditableSeries([...series]);
        setEditingBlockIndex(blockIndex);
        setIsEditing(true);
    }, []);

    const cancelEditing = React.useCallback(() => {
        setEditableSeries([]);
        setEditingBlockIndex(null);
        setIsEditing(false);
    }, []);

    return React.useMemo(() => ({
        editableSeries,
        setEditableSeries,
        editingBlockIndex,
        setEditingBlockIndex,
        originalSeries,
        setOriginalSeries,
        isEditing,
        setIsEditing,
        sourceDate,
        setSourceDate,
        targetDate,
        setTargetDate,
        applyToAllSameDays,
        setApplyToAllSameDays,
        startEditing,
        cancelEditing
    }), [
        editableSeries,
        editingBlockIndex,
        originalSeries,
        isEditing,
        sourceDate,
        targetDate,
        applyToAllSameDays,
        startEditing,
        cancelEditing
    ]);
}

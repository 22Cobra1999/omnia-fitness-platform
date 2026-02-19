import * as React from 'react';
import { createClient } from '@/lib/supabase/supabase-client';

export function useWorkshopLogic(user: any, activityId: string, enrollment: any, programInfo: any) {
    const supabase = createClient();
    const [workshopTemas, setWorkshopTemas] = React.useState<any[]>([]);
    const [temasCubiertos, setTemasCubiertos] = React.useState<any[]>([]);
    const [temasPendientes, setTemasPendientes] = React.useState<any[]>([]);
    const [documentProgress, setDocumentProgress] = React.useState<Record<number, boolean>>({});
    const [ejecucionId, setEjecucionId] = React.useState<number | null>(null);
    const [cuposOcupados, setCuposOcupados] = React.useState<Record<string, number>>({});
    const [expandedTema, setExpandedTema] = React.useState<number | null>(null);

    React.useEffect(() => {
        // Init logic if needed
    }, [activityId, enrollment?.id, user?.id, programInfo]);

    const loadWorkshopData = React.useCallback(async () => {
        if (!user || !activityId || !enrollment) {
            return;
        }

        try {
            const isDoc = (programInfo?.type || '').toLowerCase().includes('document');
            let temasData: any[] = [];

            if (isDoc) {
                const { data: topicsData } = await supabase.from('document_topics').select('*').eq('activity_id', activityId).order('id');
                temasData = (topicsData || []).map((topic: any) => ({
                    id: topic.id,
                    nombre: topic.title,
                    descripcion: topic.description,
                    pdf_url: topic.pdf_url,
                    pdf_file_name: topic.pdf_filename,
                    originales: { fechas_horarios: [] }
                }));

                const { data: progressData } = await supabase.from('client_document_progress').select('topic_id, completed').eq('client_id', user.id).eq('activity_id', activityId).eq('enrollment_id', enrollment.id);
                if (progressData) {
                    const progressMap: Record<number, boolean> = {};
                    progressData.forEach((p: any) => { progressMap[p.topic_id] = p.completed; });
                    setDocumentProgress(progressMap);
                }
            } else {
                const response = await fetch(`/api/taller-detalles?actividad_id=${activityId}`);
                if (response.ok) {
                    const result = await response.json();
                    temasData = result.data || [];
                } else {
                    const { data: workshopTemas } = await supabase.from('taller_detalles').select('*').eq('actividad_id', activityId).order('id');
                    temasData = workshopTemas || [];
                }
            }

            setWorkshopTemas(temasData);

            if (!isDoc) {
                let ejecId: number | null = null;
                // RELAXED QUERY: Look for ANY execution for this user+activity, taking the most recent one.
                // RELAXED QUERY: Look for ANY execution for this user+activity, taking the most recent one.
                const { data: summary, error: summaryError } = await supabase
                    .from('taller_progreso_temas')
                    .select('ejecucion_id')
                    .eq('cliente_id', user.id)
                    .eq('actividad_id', activityId)
                    .order('updated_at', { ascending: false })
                    .limit(1);

                if (summary?.length) {
                    ejecId = summary[0].ejecucion_id;
                } else {
                    // Si no hay ejecución, intentamos recuperarla o crearla
                    const { data: max } = await supabase.from('taller_progreso_temas').select('ejecucion_id').order('ejecucion_id', { ascending: false }).limit(1);
                    ejecId = max?.length ? (max[0] as any).ejecucion_id + 1 : 1;
                    if (temasData.length) {
                        const records = temasData.map(t => ({
                            ejecucion_id: ejecId,
                            cliente_id: user.id,
                            actividad_id: activityId,
                            enrollment_id: enrollment.id,
                            tema_id: t.id,
                            snapshot_originales: t.originales || null,
                            estado: 'pendiente'
                        }));
                        await supabase.from('taller_progreso_temas').insert(records as any);
                    }
                }
                setEjecucionId(ejecId);

                if (ejecId !== null) {
                    const { data: topicProgress } = await supabase.from('taller_progreso_temas').select('*').eq('ejecucion_id', ejecId);
                    if (topicProgress) {
                        const cubiertos: any[] = [];
                        const pendientes: any[] = [];
                        topicProgress.forEach((row: any) => {
                            const temaDetails = temasData.find(t => t.id === row.tema_id);
                            const item = {
                                ...row,
                                tema_nombre: temaDetails?.nombre || 'Sin nombre',
                                pdf_url: temaDetails?.pdf_url,
                                pdf_file_name: temaDetails?.pdf_file_name,
                                confirmo_asistencia: row.confirmo_asistencia === true || row.confirmo_asistencia === 'true',
                                asistio: row.asistio === true || row.asistio === 'true',
                            };
                            if (item.confirmo_asistencia || item.asistio) cubiertos.push(item);
                            else pendientes.push(item);
                        });
                        setTemasCubiertos(cubiertos);
                        setTemasPendientes(pendientes);
                        console.log('🔥 [WorkshopLogic] Processed Topics:', { cubiertos: cubiertos.length, pendientes: pendientes.length });
                    }
                }
            }
        } catch (e) {
            console.error("🔥 [WorkshopLogic] Error loading workshop data", e);
        }
    }, [user, activityId, enrollment, programInfo, supabase]);

    const loadCuposOcupados = React.useCallback(async () => {
        try {
            const { data: progress } = await supabase.from('taller_progreso_temas').select('*').eq('actividad_id', activityId).or('confirmo_asistencia.eq.true,asistio.eq.true');
            const cupos: Record<string, number> = {};
            progress?.forEach((row: any) => {
                if (row.fecha_seleccionada && row.horario_seleccionado) {
                    const horaInicio = typeof row.horario_seleccionado === 'string' ? JSON.parse(row.horario_seleccionado).hora_inicio : row.horario_seleccionado.hora_inicio;
                    const key = `${row.tema_id}-${row.fecha_seleccionada}-${horaInicio}`;
                    cupos[key] = (cupos[key] || 0) + 1;
                }
            });
            setCuposOcupados(cupos);
        } catch (error) { console.error(error); }
    }, [activityId]);

    const handleToggleDocumentProgress = React.useCallback(async (topicId: number) => {
        if (!user || !enrollment) return;
        const newStatus = !documentProgress[topicId];
        setDocumentProgress(prev => ({ ...prev, [topicId]: newStatus }));
        try {
            await supabase.from('client_document_progress').upsert({
                client_id: user.id,
                activity_id: Number(activityId),
                enrollment_id: enrollment.id,
                topic_id: topicId,
                completed: newStatus,
                updated_at: new Date().toISOString()
            }, { onConflict: 'client_id,enrollment_id,topic_id' });
        } catch (e) {
            setDocumentProgress(prev => ({ ...prev, [topicId]: !newStatus }));
        }
    }, [user, enrollment, documentProgress, activityId, supabase]);

    return React.useMemo(() => ({
        workshopTemas,
        temasCubiertos,
        temasPendientes,
        documentProgress,
        ejecucionId,
        cuposOcupados,
        expandedTema,
        setExpandedTema,
        loadWorkshopData,
        loadCuposOcupados,
        handleToggleDocumentProgress,
        setTemasCubiertos,
        setTemasPendientes
    }), [
        workshopTemas,
        temasCubiertos,
        temasPendientes,
        documentProgress,
        ejecucionId,
        cuposOcupados,
        expandedTema,
        loadWorkshopData,
        loadCuposOcupados,
        handleToggleDocumentProgress
    ]);
}

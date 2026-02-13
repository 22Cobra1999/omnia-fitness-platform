'use client';

import * as React from 'react';
import { useAuth } from "@/contexts/auth-context";
import { ActivitySurveyModal } from "../../activities/activity-survey-modal";
import { StartActivityModal } from "../../activities/StartActivityModal";
import { StartActivityInfoModal } from "../../activities/StartActivityInfoModal";
import { OmniaLoader } from '@/components/shared/ui/omnia-loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox"
import { format } from 'date-fns';
import { getDayName } from './utils/calendar-utils';
import { useRouter } from 'next/navigation';

// Refactored Components
import { useTodayScreenLogic } from './hooks/useTodayScreenLogic';
import { ScreenLayout } from './components/Layout/ScreenLayout';
import { UniversalHero } from './components/Hero/UniversalHero';
import { WeeklyCalendar } from './components/Calendar/WeeklyCalendar';
import { DraggableSheet } from './components/Sheet/DraggableSheet';
import { WorkshopTopicList } from './components/Lists/WorkshopTopicList';
import { ActivityDetailOverlay } from './components/Sheet/ActivityDetailOverlay';

export default function TodayScreen({ activityId, enrollmentId, onBack }: { activityId: string, enrollmentId?: string | null, onBack?: () => void }) {
    const { user } = useAuth();
    const router = useRouter();

    // Use the monolithic hook
    const { state, actions, helpers } = useTodayScreenLogic({ activityId, enrollmentId, onBack });

    if (state.loading) {
        return <OmniaLoader />;
    }

    const handleScheduleMeet = () => {
        if (!state.programInfo?.coach_id) return;
        router.push(`/client/calendar?coachId=${state.programInfo.coach_id}&activityId=${activityId}`);
    }

    // Derived flags
    const hasUserSubmittedSurvey = state.programInfo?.user_survey_status?.has_submitted || false;
    const type = (state.programInfo?.type || state.programInfo?.categoria || '').toLowerCase();
    const isWorkshop = type.includes('workshop') || type.includes('taller');
    const isDoc = type.includes('document');
    const isSpecialType = isWorkshop || isDoc;

    return (
        <div className="relative min-h-screen">
            <ScreenLayout
                vh={state.vh}
                backgroundImage={state.backgroundImage}
                isSpecialView={isSpecialType}
                hero={
                    <div className="pb-8 px-0">
                        <UniversalHero
                            programInfo={state.programInfo}
                            enrollment={state.enrollment}
                            meetCreditsAvailable={state.meetCreditsAvailable}
                            hasUserSubmittedSurvey={hasUserSubmittedSurvey}
                            onScheduleMeet={handleScheduleMeet}
                            onOpenSurvey={actions.handleOpenSurveyModal}
                            onBack={onBack}
                        />

                        {isSpecialType ? (
                            <div className="px-5 mt-0 mb-32">
                                <WorkshopTopicList
                                    temas={state.workshopTemas}
                                    temasCubiertos={state.temasCubiertos}
                                    temasPendientes={state.temasPendientes}
                                    isDocument={isDoc}
                                    documentProgress={state.documentProgress}
                                    onToggleDocumentProgress={actions.handleToggleDocumentProgress}
                                    onSelectHorario={actions.handleSelectHorario}
                                    onEditarReservacion={actions.editarReservacion}
                                    onDownloadPdf={(url) => window.open(url, '_blank')}
                                    expandedTema={state.expandedTema}
                                    setExpandedTema={actions.setExpandedTema}
                                    cuposOcupados={state.cuposOcupados}
                                    enrollment={state.enrollment}
                                    isTemaFinalizado={helpers.isTemaFinalizado}
                                    isWorkshopExpired={helpers.isWorkshopExpired}
                                    getAttendanceSummary={helpers.getAttendanceSummary}
                                    onOpenRating={() => actions.setIsRatingModalOpen(true)}
                                    isRated={state.isRated}
                                />
                            </div>
                        ) : (
                            <div className="mt-8">
                                <WeeklyCalendar
                                    currentMonth={state.currentMonth}
                                    setCurrentMonth={actions.setCurrentMonth}
                                    selectedDate={state.selectedDate}
                                    setSelectedDate={actions.setSelectedDate}
                                    calendarExpanded={state.calendarExpanded}
                                    setCalendarExpanded={actions.setCalendarExpanded}
                                    dayStatuses={state.dayStatuses}
                                    dayCounts={state.dayCounts}
                                    weekNumber={state.weekNumber}
                                    enrollment={state.enrollment}

                                    // Edit Mode
                                    isEditing={state.isEditing}
                                    setIsEditing={actions.setIsEditing}
                                    sourceDate={state.sourceDate}
                                    setSourceDate={actions.setSourceDate}
                                    targetDate={state.targetDate}
                                    setTargetDate={actions.setTargetDate}
                                    setShowConfirmModal={actions.setShowConfirmModal}
                                    calendarMessage={state.calendarMessage}
                                    setCalendarMessage={actions.setCalendarMessage}
                                />
                            </div>
                        )}
                    </div>
                }
                sheetContent={(sheetProps) => (
                    isSpecialType ? null : (
                        <DraggableSheet
                            {...sheetProps}
                            vh={state.vh}
                            activities={state.activities}
                            selectedDate={state.selectedDate}
                            programInfo={state.programInfo}
                            enrollment={state.enrollment}
                            isDayLoading={state.isDayLoading}
                            nextAvailableActivity={state.nextAvailableActivity}

                            goToToday={actions.goToToday}
                            goToNextActivity={actions.goToNextActivity}
                            handlePrevDay={actions.handlePrevDay}
                            handleNextDay={actions.handleNextDay}
                            handleOpenSurveyModal={actions.handleOpenSurveyModal}

                            selectedVideo={state.selectedVideo}
                            setSelectedVideo={actions.setSelectedVideo}
                            isVideoExpanded={state.isVideoExpanded}
                            setIsVideoExpanded={actions.setIsVideoExpanded}

                            blockNames={state.blockNames}
                            collapsedBlocks={state.collapsedBlocks}
                            toggleBlock={actions.toggleBlock}
                            toggleBlockCompletion={actions.toggleBlockCompletion}
                            isBlockCompleted={actions.isBlockCompleted}
                            toggleExerciseSimple={actions.toggleExerciseSimple}
                            openVideo={actions.openVideo}
                            onNext={actions.onNext}
                            onPrev={actions.onPrev}
                        />
                    )
                )}
            />

            {/* Overlay if Video Selected - Moved outside DraggableSheet for correct fixed positioning */}
            {state.selectedVideo && (
                <ActivityDetailOverlay
                    selectedVideo={state.selectedVideo}
                    onClose={() => { actions.setSelectedVideo(null); actions.setIsVideoExpanded(false); }}
                    toggleExerciseSimple={actions.toggleExerciseSimple}
                    activityId={state.activityId}
                    programInfo={state.programInfo}
                    enrollment={state.enrollment}
                    onNext={actions.onNext}
                    onPrev={actions.onPrev}
                />
            )}

            {/* Modals triggered from state */}
            {state.showConfirmModal && state.selectedHorario && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={actions.cancelConfirmacion} />
                    <div className="relative bg-[#1A1A1A] rounded-3xl p-6 border border-white/10 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Confirmar Reserva</h3>
                        <p className="text-gray-400 text-sm mb-6">Estás a punto de reservar turno para:</p>

                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mb-6">
                            <div className="font-semibold text-white mb-1">{state.selectedHorario.temaNombre}</div>
                            <div className="text-[#FF7939] text-sm">
                                {(() => {
                                    const d = new Date(state.selectedHorario.fecha + 'T12:00:00');
                                    return format(d, "dd 'de' MMMM", { locale: es });
                                })()} &bull; {state.selectedHorario.horario.hora_inicio}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={actions.cancelConfirmacion} className="flex-1 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl h-12 transition-all">Cancelar</button>
                            <button onClick={actions.confirmAsistencia} className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white rounded-xl h-12 font-bold shadow-lg shadow-[#FF7939]/20 transition-all">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            <ActivitySurveyModal
                isOpen={state.isRatingModalOpen}
                onClose={() => actions.setIsRatingModalOpen(false)}
                activityTitle={state.programInfo?.title || ""}
                onComplete={actions.handleSurveyComplete}
            />

            <StartActivityModal
                isOpen={state.showStartModal}
                onClose={() => actions.setShowStartModal(false)}
                onStartActivity={actions.handleStartActivity}
                activityTitle={state.programInfo?.title || "Actividad"}
            />

            <StartActivityInfoModal
                isOpen={state.showStartInfoModal}
                onClose={() => actions.setShowStartInfoModal(false)}
                onStartToday={actions.handleStartToday}
                onStartOnFirstDay={actions.handleStartOnFirstDay}
                activityTitle={state.programInfo?.title || "Actividad"}
                firstDay={state.firstDayOfActivity}
                currentDay={state.dayName}
            />

            {/* Confirm Move Activity Dialog */}
            <Dialog open={state.showConfirmModal && !state.selectedHorario} onOpenChange={actions.setShowConfirmModal}>
                <DialogContent className="bg-[#111111] border-none shadow-2xl text-white w-[92%] max-w-sm rounded-[32px] p-8">
                    <DialogHeader className="items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-[#FF7939]/10 rounded-full flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-[#FF7939]" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">¿Mover actividad?</DialogTitle>
                        <DialogDescription className="text-gray-400 text-base">
                            Estás por mover el entrenamiento del <span className="text-white font-semibold">{state.sourceDate ? format(state.sourceDate, 'EEEE d', { locale: es }) : ''}</span> al <span className="text-[#FF7939] font-bold">{state.targetDate ? format(state.targetDate, 'EEEE d', { locale: es }) : ''}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 mt-8">
                        <button
                            onClick={actions.handleConfirmUpdate}
                            disabled={state.isUpdating}
                            className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#FF7939]/20 transition-all disabled:opacity-50"
                        >
                            {state.isUpdating ? "Moviendo..." : "Confirmar cambio"}
                        </button>
                        <button
                            onClick={() => actions.setShowConfirmModal(false)}
                            className="w-full text-zinc-500 hover:text-white py-2 font-medium transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { es } from 'date-fns/locale';

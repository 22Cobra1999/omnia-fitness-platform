import React, { useState } from 'react';
import { ProgramHeader } from './ProgramHeader';
import { ProgramProgress } from './ProgramProgress';
import { TodayActivityList } from './TodayActivityList';
import { ActivityDetailView } from './ActivityDetailView';
import { DraggableActivitySheet } from './DraggableActivitySheet';
import { Activity } from '@/types/activity';

interface TodayScreenProgramProps {
    programInfo: any;
    enrollment: any;
    activities: any[];
    getDayStatus: (date: Date) => 'completed' | 'started' | 'not-started' | 'no-exercises';
    meetCreditsAvailable?: number | null;
    hasUserSubmittedSurvey?: boolean;
    selectedDate: Date;
    currentMonth: Date;
    onDateSelect: (date: Date) => void;
    onMonthChange: (date: Date) => void;
    isDayLoading?: boolean;
    onBack?: () => void;
}

export const TodayScreenProgram: React.FC<TodayScreenProgramProps> = ({
    programInfo,
    enrollment,
    activities,
    getDayStatus,
    meetCreditsAvailable,
    hasUserSubmittedSurvey,
    selectedDate,
    currentMonth,
    onDateSelect,
    onMonthChange,
    isDayLoading,
    onBack
}) => {
    // States
    const [calendarExpanded, setCalendarExpanded] = useState(false);
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    // Helpers
    const getCurrentWeekOfProgram = () => {
        if (!enrollment?.start_date) return 1;
        try {
            const start = new Date(enrollment.start_date);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.ceil(diffDays / 7);
        } catch {
            return 1;
        }
    };

    // Handlers
    const handleActivityClick = (activity: any) => {
        setSelectedActivity(activity);
    };

    const handleToggleActivity = (id: string) => {
        console.log('Toggle', id);
        // Add actual toggle logic here if needed
    };

    return (
        <div className="w-full relative min-h-screen pb-24">
            {/* Background Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none" style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)'
            }} />

            <div className="relative z-10 flex flex-col min-h-screen">
                <ProgramHeader
                    programInfo={programInfo}
                    onBack={onBack}
                    meetCreditsAvailable={meetCreditsAvailable}
                    hasUserSubmittedSurvey={hasUserSubmittedSurvey}
                />

                {/* Calendar Component */}
                <ProgramProgress
                    currentWeek={getCurrentWeekOfProgram()}
                    selectedDate={selectedDate}
                    onSelectDate={onDateSelect}

                    currentMonth={currentMonth}
                    onMonthChange={onMonthChange}

                    // Status logic passed down
                    dayStatuses={{}}
                    getDayStatus={getDayStatus}

                    // Expansion Logic
                    isExpanded={calendarExpanded}
                    onToggleExpanded={() => setCalendarExpanded(!calendarExpanded)}

                    isDayLoading={isDayLoading}
                />

                {/* Draggable Sheet containing the Activity List */}
                <DraggableActivitySheet>
                    <TodayActivityList
                        activities={activities}
                        isLoading={!!isDayLoading}
                        onActivityClick={handleActivityClick}
                        onToggleActivity={handleToggleActivity}
                    />
                </DraggableActivitySheet>
            </div>

            {selectedActivity && (
                <ActivityDetailView
                    activity={selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                    onComplete={() => console.log('Complete')}
                />
            )}
        </div>
    );
};

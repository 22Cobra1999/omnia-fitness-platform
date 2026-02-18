import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { AlertTriangle, RotateCcw, Minus } from 'lucide-react';
import { getDaysInMonth } from '../../utils/calendar-utils';
import { getBuenosAiresDateString, getTodayBuenosAiresString } from '@/utils/date-utils';

// Helper to check moveability (extracted from original)
const isDateMoveable = (date: Date, enrollment: any) => {
    if (!date) return false;
    const todayStr = getTodayBuenosAiresString();
    const checkDateStr = format(date, 'yyyy-MM-dd');

    if (checkDateStr < todayStr) return false;

    if (enrollment?.expiration_date) {
        const expDateStr = enrollment.expiration_date.split('T')[0].split(' ')[0];
        if (checkDateStr > expDateStr) return false;
    }
    return true;
};


interface WeeklyCalendarProps {
    currentMonth: Date;
    setCurrentMonth: (d: Date) => void;
    selectedDate: Date;
    setSelectedDate: (d: Date) => void;
    calendarExpanded: boolean;
    setCalendarExpanded: (expanded: boolean) => void;
    dayStatuses: Record<string, string>;
    dayCounts: { pending: number; started: number; completed: number };
    weekNumber: number;
    enrollment: any;

    // Edit Mode Props
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    sourceDate: Date | null;
    setSourceDate: (d: Date | null) => void;
    targetDate: Date | null;
    setTargetDate: (d: Date | null) => void;
    setShowConfirmModal: (v: boolean) => void;
    calendarMessage: string | null;
    setCalendarMessage: (m: string | null) => void;
    isExpired?: boolean;
}

export function WeeklyCalendar({
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    calendarExpanded,
    setCalendarExpanded,
    dayStatuses,
    dayCounts,
    weekNumber,
    enrollment,
    isEditing,
    setIsEditing,
    sourceDate,
    setSourceDate,
    targetDate,
    setTargetDate,
    setShowConfirmModal,
    calendarMessage,
    setCalendarMessage,
    isExpired = false
}: WeeklyCalendarProps) {

    const [isMonthPickerOpen, setIsMonthPickerOpen] = React.useState(false);
    const days = React.useMemo(() => getDaysInMonth(currentMonth), [currentMonth]); // Or depends on expanded? 

    // Logic from original: 
    // If not expanded, we might want to ensure 'days' contains the current selected week only?
    // But original code renders the whole grid and hides rows? 
    // Line 3684 (from prev view): Bottom sheet covers it?
    // Actually, the original code had: "Week View" vs "Month View" toggles or just "Expanded" boolean.
    // In `WeeklyCalendar` (UI), if `!calendarExpanded`, does it hide rows?
    // Line 2713: `paddingBottom: calendarExpanded ? 52 : 16`.
    // Line 3688: The sheet has `y`.
    // If the Calendar is collapsed, the sheet slides up and COVERS the rest of the calendar rows?
    // Yes. The Calendar component renders ALL days, but the Sheet covers them visually.

    const handlePrevWeek = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 7);
        setSelectedDate(d);
        setCurrentMonth(d);
    };
    const handleNextWeek = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 7);
        setSelectedDate(d);
        setCurrentMonth(d);
    };

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
        setSourceDate(null);
        setTargetDate(null);
        setCalendarMessage(null);
    };

    return (
        <div style={{
            /* Styles matched to original "Progress Frame" */
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(10px) saturate(150%)',
            WebkitBackdropFilter: 'blur(10px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 24,
            padding: '12px 20px',
            paddingTop: '12px',
            paddingBottom: calendarExpanded ? 52 : 16,
            marginBottom: 0,
            marginLeft: '-24px',
            marginRight: '-24px',
            width: 'calc(100% + 48px)',
            position: 'relative',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            filter: isExpired ? 'grayscale(1) opacity(0.8)' : 'none'
        }}>
            {/* Calendar content */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                width: '100%',
                padding: '0'
            }}>
                {!calendarExpanded && (
                    <button onClick={handlePrevWeek} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 10, color: '#FFFFFF', fontSize: 14 }}>⟵</button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1, width: '100%' }}>
                    {!calendarExpanded ? (
                        <>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>Semana {weekNumber}</h4>
                            <span onClick={() => setCalendarExpanded(true)} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </span>
                        </>
                    ) : (
                        /* Expanded Header & Edit Controls */
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
                            {/* Month Nav... */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d); }} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, color: '#FFFFFF' }}>
                                    <span style={{ fontSize: 18, marginTop: -2 }}>‹</span>
                                </button>
                                <h4 onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    <span style={{ fontSize: 10, opacity: 0.5 }}>▼</span>
                                </h4>
                                <button onClick={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d); }} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, color: '#FFFFFF' }}>
                                    <span style={{ fontSize: 18, marginTop: -2 }}>›</span>
                                </button>
                            </div>

                            {/* Edit Button */}
                            <button onClick={toggleEditMode} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', height: 30, background: isEditing ? 'rgba(255, 121, 57, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: isEditing ? '1px solid rgba(255, 121, 57, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 15, color: isEditing ? '#FFFFFF' : '#FF7939', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                <RotateCcw className="w-4 h-4" />
                                <span>Fecha</span>
                            </button>

                            {/* Month Picker Overlay */}
                            <AnimatePresence>
                                {isMonthPickerOpen && (
                                    <>
                                        {/* Backdrop to close */}
                                        <div
                                            onClick={() => setIsMonthPickerOpen(false)}
                                            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            style={{
                                                position: 'absolute', top: 45, left: 0, zIndex: 100,
                                                background: '#1A1D21', border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: 20, padding: 16, width: 220,
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                                                backdropFilter: 'blur(20px)'
                                            }}
                                        >
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const d = new Date(currentMonth);
                                                            d.setMonth(i);
                                                            setCurrentMonth(d);
                                                            setIsMonthPickerOpen(false);
                                                        }}
                                                        style={{
                                                            padding: '10px 4px', fontSize: 12, borderRadius: 10, border: 'none',
                                                            background: currentMonth.getMonth() === i ? '#FF7939' : 'rgba(255,255,255,0.05)',
                                                            color: currentMonth.getMonth() === i ? '#000000' : 'rgba(255,255,255,0.8)',
                                                            textTransform: 'capitalize', fontWeight: 600,
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {new Date(2000, i, 1).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
                                                    </button>
                                                ))}
                                            </div>
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <button onClick={(e) => { e.stopPropagation(); const d = new Date(currentMonth); d.setFullYear(d.getFullYear() - 1); setCurrentMonth(d); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: 18, width: 32, height: 32, borderRadius: 8 }}>«</button>
                                                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{currentMonth.getFullYear()}</span>
                                                <button onClick={(e) => { e.stopPropagation(); const d = new Date(currentMonth); d.setFullYear(d.getFullYear() + 1); setCurrentMonth(d); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: 18, width: 32, height: 32, borderRadius: 8 }}>»</button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {!calendarExpanded && (
                    <button onClick={handleNextWeek} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 10, color: '#FFFFFF', fontSize: 14 }}>⟶</button>
                )}
            </div>

            {/* Days Grid - Conditional View */}
            {!calendarExpanded ? (
                // --- VISTA SEMANAL (Original logic) ---
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 6, // Original had 16 but with style overrides. Let's stick to visual provided earlier or 6 for safety if constraint. Original 3160 says gap: 16.
                    width: '100%',
                    marginBottom: 8,
                    padding: '12px 0'
                }}>
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayInitial, index) => {
                        // Logic from original 3166
                        const currentWeekStart = new Date(selectedDate);
                        const currentDayOfWeek = selectedDate.getDay();
                        const daysToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
                        currentWeekStart.setDate(selectedDate.getDate() + daysToMonday);

                        const dayDate = new Date(currentWeekStart);
                        dayDate.setDate(currentWeekStart.getDate() + index);

                        const dateString = getBuenosAiresDateString(dayDate);
                        const isSelected = dayDate.toDateString() === selectedDate.toDateString();
                        const dayStatus = dayStatuses[dateString]; // Removed default 'not-started'
                        // If no status found, original might default differently.
                        // However, we populated dayStatuses map.

                        const isToday = dayDate.toDateString() === new Date().toDateString();

                        return (
                            <div key={dayInitial} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>{dayInitial}</span>
                                <div
                                    onClick={() => { setSelectedDate(dayDate); setCalendarMessage(null); }}
                                    style={{
                                        width: 36, height: 52,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: 26, fontSize: 14, fontWeight: 600,
                                        position: 'relative', cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        // Copying glassmorphism styles from original 3253+
                                        ...(dayStatus === 'completed' && !isSelected && {
                                            background: 'rgba(255, 106, 0, 0.15)', color: '#FF6A00', boxShadow: '0 2px 8px rgba(255, 106, 0, 0.2)'
                                        }),
                                        ...(dayStatus === 'started' && !isSelected && {
                                            background: 'rgba(255, 201, 51, 0.15)', color: '#FFC933', boxShadow: '0 2px 8px rgba(255, 201, 51, 0.2)'
                                        }),
                                        ...(dayStatus === 'not-started' && !isSelected && {
                                            background: 'rgba(255, 68, 68, 0.15)', color: '#FF4444', boxShadow: '0 2px 8px rgba(255, 68, 68, 0.2)'
                                        }),
                                        ...(isSelected && {
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: dayStatus === 'completed' ? '1px solid rgba(255, 106, 0, 0.6)' :
                                                dayStatus === 'started' ? '1px solid rgba(255, 201, 51, 0.6)' :
                                                    dayStatus === 'not-started' ? '1px solid rgba(255, 68, 68, 0.6)' : '1px solid rgba(255, 255, 255, 0.2)',
                                            color: '#FFFFFF'
                                        }),
                                        ...(!isSelected && !['completed', 'started', 'not-started'].includes(dayStatus) && {
                                            // Empty day styling?
                                            color: 'rgba(255,255,255,0.3)'
                                        })
                                    }}
                                >
                                    {dayDate.getDate()}
                                    {isToday && <div style={{ position: 'absolute', top: 6, right: 6, width: 4, height: 4, background: '#FFD700', borderRadius: '50%' }} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // --- VISTA MENSUAL (Expanded) ---
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, width: '100%', marginBottom: 8 }}>
                    {/* Headers */}
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)', paddingBottom: 4 }}>{d}</div>)}

                    {/* Pills from days array */}
                    {days.map((dayInfo, index) => {
                        const dateString = getBuenosAiresDateString(dayInfo.date);
                        const dayStatus = dayStatuses[dateString]; // Removed default 'not-started' for Monthly View
                        const statusOrEmpty = dayStatus || 'no-exercises';
                        const isSelected = selectedDate.toDateString() === dayInfo.date.toDateString();
                        const isToday = dayInfo.date.toDateString() === new Date().toDateString();
                        const isLocked = isEditing && !sourceDate ? (dayStatus === 'no-exercises' || !isDateMoveable(dayInfo.date, enrollment)) : (isEditing && !isDateMoveable(dayInfo.date, enrollment));

                        // Simplified click handler
                        const handleClick = () => {
                            setCalendarMessage(null);
                            if (!dayInfo.isCurrentMonth) return;

                            if (isEditing) {
                                if (!sourceDate) { // Picking source
                                    if (dayStatus === 'no-exercises') {
                                        setCalendarMessage("Este día no tiene actividades");
                                        return;
                                    }
                                    if (!isDateMoveable(dayInfo.date, enrollment)) {
                                        setCalendarMessage("No se puede mover fecha pasada");
                                        return;
                                    }
                                    setSourceDate(dayInfo.date);
                                } else { // Picking target
                                    // Validate...
                                    setTargetDate(dayInfo.date);
                                    setShowConfirmModal(true);
                                }
                            } else {
                                // Normal selection
                                setSelectedDate(dayInfo.date);
                            }
                        };

                        return (
                            <div key={index} onClick={handleClick}
                                style={{
                                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '50%', fontSize: 14, fontWeight: 500, position: 'relative',
                                    transition: 'all 0.2s ease', cursor: isLocked ? 'not-allowed' : (dayInfo.isCurrentMonth ? 'pointer' : 'default'),
                                    opacity: isLocked ? 0.3 : 1,

                                    // Visuals
                                    background: isSelected ? 'rgba(255, 255, 255, 0.1)' : (dayInfo.isCurrentMonth ?
                                        (dayStatus === 'completed' ? 'rgba(255, 106, 0, 0.15)' :
                                            dayStatus === 'started' ? 'rgba(255, 201, 51, 0.15)' :
                                                dayStatus === 'not-started' ? 'rgba(255, 68, 68, 0.15)' :
                                                    'rgba(42, 45, 49, 0.3)') : 'transparent'),

                                    border: isSelected ? (
                                        dayStatus === 'completed' ? '1px solid rgba(255, 106, 0, 0.6)' :
                                            dayStatus === 'started' ? '1px solid rgba(255, 201, 51, 0.6)' :
                                                dayStatus === 'not-started' ? '1px solid rgba(255, 68, 68, 0.6)' :
                                                    '1px solid rgba(255, 255, 255, 0.2)'
                                    ) : (dayInfo.isCurrentMonth && isToday ? '2px solid rgba(255, 255, 255, 0.3)' : 'transparent'),

                                    color: isSelected ? (
                                        dayStatus === 'completed' ? '#FF6A00' :
                                            dayStatus === 'started' ? '#FFC933' :
                                                dayStatus === 'not-started' ? '#FF4444' :
                                                    '#FFFFFF'
                                    ) : (dayInfo.isCurrentMonth ?
                                        (dayStatus === 'completed' ? '#FF6A00' :
                                            dayStatus === 'started' ? '#FFC933' :
                                                dayStatus === 'not-started' ? '#FF4444' :
                                                    '#FFFFFF') : 'rgba(255, 255, 255, 0.3)'),

                                    // Source Date Highlight
                                    ...(isEditing && sourceDate && dayInfo.date.toDateString() === sourceDate.toDateString() ? {
                                        background: 'rgba(255, 121, 57, 0.2)', border: '1px solid #FF7939', color: '#fff'
                                    } : {})
                                }}
                            >
                                {dayInfo.day}
                                {isToday && <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: '#FFD700', borderRadius: '50%' }} />}
                                {/* Expiration marker (simplified) */}
                                {enrollment?.expiration_date && format(dayInfo.date, 'yyyy-MM-dd') === enrollment.expiration_date.split('T')[0] && (
                                    <div style={{ position: 'absolute', top: -8, left: -4 }}><AlertTriangle size={12} color="#FFD700" /></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {isEditing && (
                <div style={{ textAlign: 'center', marginTop: 16, color: '#FF7939', fontSize: 12 }}>
                    {!sourceDate ? "Selecciona el día a cambiar" : "Selecciona nueva fecha"}
                </div>
            )}
            {calendarMessage && <div style={{ color: '#FF4444', fontSize: 11, textAlign: 'center', marginTop: 12 }}>{calendarMessage}</div>}

            {/* Legend */}
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.1)', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255, 68, 68, 0.25)', border: '1px solid rgba(255, 68, 68, 0.5)' }}></div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Pendiente ({dayCounts.pending})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255, 201, 51, 0.25)', border: '1px solid rgba(255, 201, 51, 0.5)' }}></div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>En curso ({dayCounts.started})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255, 106, 0, 0.25)', border: '1px solid rgba(255, 106, 0, 0.5)' }}></div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Completado ({dayCounts.completed})</span>
                    </div>
                </div>
            </div>

            {/* Collapse Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: calendarExpanded ? 16 : 12 }}>
                <button onClick={() => setCalendarExpanded(!calendarExpanded)} style={{ width: 36, height: 36, background: 'transparent', border: '2px solid #FF6A00', borderRadius: '50%', color: '#FF6A00', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {calendarExpanded ? '−' : '+'}
                </button>
            </div>

        </div>
    );
}

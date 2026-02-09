import React, { useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, RotateCcw, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgramProgressProps {
    currentWeek: number;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    currentMonth: Date;
    onMonthChange: (date: Date) => void;
    dayStatuses: Record<string, string>;
    getDayStatus: (date: Date) => 'completed' | 'started' | 'not-started' | 'no-exercises' | string;
    isDayLoading?: boolean;
    isExpanded?: boolean;
    onToggleExpanded?: () => void;
}

export const ProgramProgress: React.FC<ProgramProgressProps> = ({
    currentWeek,
    selectedDate,
    onSelectDate,
    currentMonth,
    onMonthChange,
    getDayStatus,
    isExpanded = false,
    onToggleExpanded
}) => {
    // Week View Date Items
    const weekDays = useMemo(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [selectedDate]);

    // Month View Date Items
    const monthDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const handlePrev = () => {
        if (isExpanded) {
            const prev = new Date(currentMonth);
            prev.setMonth(prev.getMonth() - 1);
            onMonthChange(prev);
        } else {
            const prev = addDays(selectedDate, -7);
            onSelectDate(prev);
            // Verify month sync 
            if (prev.getMonth() !== currentMonth.getMonth()) {
                onMonthChange(prev);
            }
        }
    };

    const handleNext = () => {
        if (isExpanded) {
            const next = new Date(currentMonth);
            next.setMonth(next.getMonth() + 1);
            onMonthChange(next);
        } else {
            const next = addDays(selectedDate, 7);
            onSelectDate(next);
            if (next.getMonth() !== currentMonth.getMonth()) {
                onMonthChange(next);
            }
        }
    };

    // Render single Day item (Reusable for Grid and Flex)
    const renderDay = (date: Date, isGrid = false) => {
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());
        const status = getDayStatus(date);
        const dayNumber = format(date, 'd');
        const dayName = format(date, 'EEEEE', { locale: es }).toUpperCase(); // L, M, X

        // Styles based on status (Pill Logic)
        let bg = 'rgba(255, 255, 255, 0.05)';
        let border = '1px solid rgba(255, 255, 255, 0.1)';
        let color = '#FFFFFF';

        if (status === 'completed') {
            bg = 'rgba(255, 106, 0, 0.15)';
            border = '1px solid rgba(255, 106, 0, 0.3)';
            color = '#FF6A00';
        } else if (status === 'started') {
            bg = 'rgba(255, 201, 51, 0.15)';
            border = '1px solid rgba(255, 201, 51, 0.3)';
            color = '#FFC933';
        } else if (status === 'not-started') {
            bg = 'rgba(255, 68, 68, 0.15)';
            border = '1px solid rgba(255, 68, 68, 0.3)';
            color = '#FF4444';
        }

        if (isSelected) {
            bg = '#FFFFFF';
            color = '#000000';
            border = '1px solid #FFFFFF';
        }

        // Opacity for days outside current month in Grid view
        const isCurrentMonth = isSameMonth(date, currentMonth);
        const opacity = isGrid && !isCurrentMonth ? 0.3 : 1;

        return (
            <motion.div
                key={date.toISOString()}
                onClick={() => {
                    onSelectDate(date);
                    if (isExpanded && !isSameMonth(date, currentMonth)) {
                        onMonthChange(date);
                    }
                }}
                className="relative flex flex-col items-center justify-center cursor-pointer"
                style={{
                    width: isGrid ? '100%' : 36,
                    height: 52,
                    borderRadius: 26,
                    background: bg,
                    border: border,
                    opacity: opacity
                }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Day Name (L, M, X) - Show only in Week View */}
                {!isGrid && (
                    <span style={{ fontSize: 10, marginBottom: 2, color: isSelected ? '#000' : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                        {dayName}
                    </span>
                )}

                {/* Date Number */}
                <span style={{ fontSize: 15, fontWeight: 700, color: color }}>
                    {dayNumber}
                </span>

                {/* Today Badge */}
                {isToday && !isSelected && (
                    <div className="absolute -top-1 -right-1 bg-[#FFD700] text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black">
                        H
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="px-6 mb-2 pt-2 relative z-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <span className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                        Semana {currentWeek}
                    </span>
                    <button
                        className="text-white text-lg font-bold capitalize text-left flex items-center gap-2"
                        onClick={onToggleExpanded}
                    >
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        <ChevronRight className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Navigation Arrows */}
                    <div className="flex bg-white/5 rounded-full p-1">
                        <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Expand Toggle Button (+) */}
                    <button
                        onClick={onToggleExpanded}
                        className="w-10 h-10 rounded-full border-2 border-[#FF6A00] flex items-center justify-center text-[#FF6A00] transition-colors hover:bg-[#FF6A00] hover:text-white"
                        aria-label={isExpanded ? "Colapsar calendario" : "Expandir calendario"}
                    >
                        {isExpanded ? <Minus size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
                    </button>
                </div>
            </div>

            {/* Calendar Body */}
            <AnimatePresence mode="wait">
                {isExpanded ? (
                    <motion.div
                        key="month"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-7 gap-x-2 gap-y-4"
                    >
                        {/* Grid Headers */}
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                            <div key={d} className="text-center text-white/40 text-[10px] font-bold pb-2">{d}</div>
                        ))}
                        {monthDays.map(date => renderDay(date, true))}
                        {/* Spacer */}
                        <div className="col-span-7 h-4" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="week"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-between items-center"
                    >
                        {weekDays.map(date => renderDay(date, false))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Visual handle indicator */}
            <div className="flex justify-center mt-4 mb-2">
                <div className="w-8 h-1 bg-white/10 rounded-full" />
            </div>
        </div>
    );
};

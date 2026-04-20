'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onChangeStart: (d: string) => void;
    onChangeEnd: (d: string) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function pad(n: number) { return n.toString().padStart(2, '0'); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function parseDate(s: string) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function formatDisplay(s: string) {
    if (!s) return '';
    const d = parseDate(s);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function DateRangePicker({ startDate, endDate, onChangeStart, onChangeEnd }: DateRangePickerProps) {
    const [open, setOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(() => {
        const ref = startDate ? parseDate(startDate) : new Date();
        return { year: ref.getFullYear(), month: ref.getMonth() };
    });
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);
    const [selecting, setSelecting] = useState<'start' | 'end' | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSelecting(null);
            }
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const daysInMonth = useMemo(() => {
        return new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
    }, [viewMonth]);

    const firstDayOfWeek = useMemo(() => {
        return new Date(viewMonth.year, viewMonth.month, 1).getDay();
    }, [viewMonth]);

    function prevMonth() {
        setViewMonth((v) => {
            if (v.month === 0) return { year: v.year - 1, month: 11 };
            return { ...v, month: v.month - 1 };
        });
    }

    function nextMonth() {
        setViewMonth((v) => {
            if (v.month === 11) return { year: v.year + 1, month: 0 };
            return { ...v, month: v.month + 1 };
        });
    }

    function handleDayClick(day: number) {
        const iso = toISO(viewMonth.year, viewMonth.month, day);

        if (!selecting) {
            // First click: set start and begin selecting end
            onChangeStart(iso);
            onChangeEnd('');
            setSelecting('end');
        } else if (selecting === 'end') {
            // If clicked date is before start, swap
            if (startDate && iso < startDate) {
                onChangeEnd(startDate);
                onChangeStart(iso);
            } else {
                onChangeEnd(iso);
            }
            setSelecting(null);
            setOpen(false);
        }
    }

    function isInRange(day: number) {
        const iso = toISO(viewMonth.year, viewMonth.month, day);
        const effEnd = selecting === 'end' && hoveredDate ? hoveredDate : endDate;
        if (!startDate || !effEnd) return false;
        const s = startDate < effEnd ? startDate : effEnd;
        const e = startDate < effEnd ? effEnd : startDate;
        return iso > s && iso < e;
    }

    function isStartOrEnd(day: number) {
        const iso = toISO(viewMonth.year, viewMonth.month, day);
        return iso === startDate || iso === endDate;
    }

    function isHovered(day: number) {
        const iso = toISO(viewMonth.year, viewMonth.month, day);
        return selecting === 'end' && hoveredDate === iso;
    }

    function isToday(day: number) {
        const today = new Date();
        return viewMonth.year === today.getFullYear() && viewMonth.month === today.getMonth() && day === today.getDate();
    }

    function handleOpen() {
        setOpen(true);
        setSelecting(null);
        if (startDate) {
            const d = parseDate(startDate);
            setViewMonth({ year: d.getFullYear(), month: d.getMonth() });
        }
    }

    function clearRange() {
        onChangeStart('');
        onChangeEnd('');
        setSelecting(null);
        setOpen(false);
    }

    const displayText = startDate && endDate
        ? `${formatDisplay(startDate)} → ${formatDisplay(endDate)}`
        : startDate
            ? `${formatDisplay(startDate)} → ...`
            : 'Selecionar período';

    return (
        <div className="relative" ref={ref}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={handleOpen}
                className="input input-sm flex items-center gap-2 cursor-pointer text-left min-w-[260px] justify-between"
            >
                <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 shrink-0">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className={`text-sm ${startDate ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                        {displayText}
                    </span>
                </div>
                {startDate && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearRange(); }}
                        className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </button>

            {/* Calendar dropdown */}
            {open && (
                <div className="absolute top-full left-0 mt-2 z-50 date-range-calendar glass-card-static p-4 rounded-2xl shadow-2xl animate-fade-in"
                    style={{ minWidth: 320 }}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={prevMonth} className="date-range-nav-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <span className="text-sm font-bold tracking-wide">
                            {MONTHS[viewMonth.month]} {viewMonth.year}
                        </span>
                        <button type="button" onClick={nextMonth} className="date-range-nav-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>

                    {/* Hint */}
                    <p className="text-[10px] text-center text-[var(--text-muted)] mb-3">
                        {selecting === 'end' ? '📅 Clique na data final' : '📅 Clique na data inicial'}
                    </p>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {WEEKDAYS.map((w) => (
                            <div key={w} className="text-[10px] font-semibold text-center text-[var(--text-muted)] uppercase py-1">{w}</div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                            const inRange = isInRange(day);
                            const isEdge = isStartOrEnd(day);
                            const hov = isHovered(day);
                            const today = isToday(day);

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDayClick(day)}
                                    onMouseEnter={() => {
                                        if (selecting === 'end') setHoveredDate(toISO(viewMonth.year, viewMonth.month, day));
                                    }}
                                    onMouseLeave={() => setHoveredDate(null)}
                                    className={`
                                        date-range-day
                                        ${isEdge ? 'date-range-day-selected' : ''}
                                        ${inRange ? 'date-range-day-in-range' : ''}
                                        ${hov ? 'date-range-day-hover' : ''}
                                        ${today && !isEdge ? 'date-range-day-today' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--glass-border)]">
                        <button type="button" className="text-[10px] px-2 py-1 rounded-lg bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                            onClick={() => {
                                const today = new Date();
                                const iso = toISO(today.getFullYear(), today.getMonth(), today.getDate());
                                onChangeStart(iso);
                                onChangeEnd(iso);
                                setOpen(false);
                            }}>Hoje</button>
                        <button type="button" className="text-[10px] px-2 py-1 rounded-lg bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                            onClick={() => {
                                const today = new Date();
                                const start = new Date(today);
                                start.setDate(today.getDate() - 7);
                                onChangeStart(toISO(start.getFullYear(), start.getMonth(), start.getDate()));
                                onChangeEnd(toISO(today.getFullYear(), today.getMonth(), today.getDate()));
                                setOpen(false);
                            }}>Últimos 7 dias</button>
                        <button type="button" className="text-[10px] px-2 py-1 rounded-lg bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                            onClick={() => {
                                const today = new Date();
                                const start = new Date(today.getFullYear(), today.getMonth(), 1);
                                onChangeStart(toISO(start.getFullYear(), start.getMonth(), start.getDate()));
                                onChangeEnd(toISO(today.getFullYear(), today.getMonth(), today.getDate()));
                                setOpen(false);
                            }}>Este mês</button>
                        <div className="flex-1" />
                        <button type="button" className="text-[10px] px-2 py-1 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                            onClick={clearRange}>Limpar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

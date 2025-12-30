import React, { useState, useEffect, useRef } from 'react';

export function YearRangeSlider({ min, max, value, onChange }) {
    const [dragging, setDragging] = useState(null); // 'start' or 'end'
    const barRef = useRef(null);

    // Ensure value is valid
    const startVal = value[0] || min;
    const endVal = value[1] || max;
    const range = max - min;

    // Convert year to percentage (0-100)
    const getPercent = (year) => {
        if (range === 0) return 0;
        return ((year - min) / range) * 100;
    };

    const getYearFromPercent = (pct) => {
        return Math.round(min + (range * (pct / 100)));
    };

    const handleMouseDown = (type) => (e) => {
        e.preventDefault();
        setDragging(type);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragging || !barRef.current) return;

            const rect = barRef.current.getBoundingClientRect();
            let pct = ((e.clientX - rect.left) / rect.width) * 100;
            pct = Math.max(0, Math.min(100, pct));

            const newYear = getYearFromPercent(pct);

            if (dragging === 'start') {
                const newStart = Math.min(newYear, endVal);
                onChange([newStart, endVal]);
            } else {
                const newEnd = Math.max(newYear, startVal);
                onChange([startVal, newEnd]);
            }
        };

        const handleMouseUp = () => {
            setDragging(null);
        };

        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            // Touch support
            window.addEventListener('touchmove', (e) => handleMouseMove(e.touches[0]));
            window.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', (e) => handleMouseMove(e.touches[0]));
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [dragging, min, range, startVal, endVal, onChange]);

    // Generate ticks
    const ticks = [];
    for (let y = min; y <= max; y++) {
        ticks.push(y);
    }

    return (
        <div className="pt-6 pb-2 px-2 select-none">
            <div className="relative h-12" ref={barRef}>
                {/* Ruler Track with Ticks */}
                <div className="absolute top-4 left-0 right-0 h-8 border-b border-slate-300 flex justify-between items-end">
                    {ticks.map((year) => {
                        const isMain = (year % 5 === 0) || year === min || year === max;
                        const isSub = !isMain;
                        return (
                            <div
                                key={year}
                                className="flex flex-col items-center justify-end h-full"
                                style={{
                                    width: `${100 / (range + 1)}%`,
                                    position: 'absolute',
                                    left: `${getPercent(year)}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                <div className={`w-px bg-slate-300 ${isMain ? 'h-4' : 'h-2'}`}></div>
                                {isMain && (
                                    <span className="text-[10px] text-slate-400 absolute top-full mt-1 font-mono">
                                        {year}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Active Range Bar */}
                <div
                    className="absolute top-4 h-1.5 bg-primary-200 opacity-50 pointer-events-none"
                    style={{
                        left: `${getPercent(startVal)}%`,
                        right: `${100 - getPercent(endVal)}%`,
                        bottom: 0
                    }}
                ></div>

                {/* Handles */}
                {/* Start Handle */}
                <div
                    className="absolute top-4 w-4 h-8 -ml-2 z-10 cursor-col-resize group"
                    style={{ left: `${getPercent(startVal)}%` }}
                    onMouseDown={handleMouseDown('start')}
                    onTouchStart={handleMouseDown('start')}
                >
                    <div className="w-0.5 h-full bg-primary-600 mx-auto group-hover:bg-primary-500"></div>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                        {startVal}
                    </div>
                    {/* Bottom Triangle/Knob */}
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary-600"></div>
                </div>

                {/* End Handle */}
                <div
                    className="absolute top-4 w-4 h-8 -ml-2 z-10 cursor-col-resize group"
                    style={{ left: `${getPercent(endVal)}%` }}
                    onMouseDown={handleMouseDown('end')}
                    onTouchStart={handleMouseDown('end')}
                >
                    <div className="w-0.5 h-full bg-primary-600 mx-auto group-hover:bg-primary-500"></div>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                        {endVal}
                    </div>
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary-600"></div>
                </div>
            </div>
        </div>
    );
}

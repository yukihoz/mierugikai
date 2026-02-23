import { useState, useEffect } from 'react';

export function LoadingScreen({ progress }) {
    const [frame, setFrame] = useState(1);

    useEffect(() => {
        const timer = setInterval(() => {
            setFrame(f => (f === 1 ? 2 : 1));
        }, 200);
        return () => clearInterval(timer);
    }, []);

    // Clamp progress between 0 and 100
    const safeProgress = Math.min(100, Math.max(0, progress));

    return (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <div className="relative h-20 mb-2 w-full">
                    {/* Walking character */}
                    <div
                        className="absolute bottom-0 transition-all duration-300 ease-out"
                        style={{ left: `calc(${safeProgress}% - 40px)` }}
                    >
                        <img
                            src={`${import.meta.env.BASE_URL}images/gijie_walk${frame}.png`}
                            alt="loading"
                            className="h-20 w-auto object-contain drop-shadow-sm"
                        />
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                    <div
                        className="h-full bg-primary-500 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${safeProgress}%` }}
                    />
                </div>

                <p className="text-center mt-6 text-slate-500 font-medium animate-pulse">
                    準備してるからちょっと待ってね {safeProgress}%
                </p>
            </div>
        </div>
    );
}

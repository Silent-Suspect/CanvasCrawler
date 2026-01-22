import React from 'react';

interface MainMenuProps {
    onStart: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
            <div className="text-center space-y-8">
                <h1 className="text-6xl font-black text-amber-500 tracking-tighter drop-shadow-lg">
                    CANVAS CRAWLER
                </h1>
                <p className="text-gray-400 text-lg">A High-Performance Web Dungeon Crawler</p>

                <div className="flex flex-col gap-4 w-64 mx-auto">
                    <button
                        onClick={onStart}
                        className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all transform hover:scale-105 shadow-xl"
                    >
                        NEW GAME
                    </button>

                    <button
                        disabled
                        className="px-8 py-3 bg-gray-800 text-gray-500 font-bold rounded-lg cursor-not-allowed border border-gray-700"
                    >
                        CONTINUE
                    </button>

                    <button
                        disabled
                        className="px-8 py-3 bg-gray-800 text-gray-500 font-bold rounded-lg cursor-not-allowed border border-gray-700"
                    >
                        SETTINGS
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 text-gray-600 text-sm">
                v0.2.0 • Build 2026
            </div>
        </div>
    );
};

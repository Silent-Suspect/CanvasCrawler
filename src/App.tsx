import { useRef, useEffect, useState } from 'react';
import { Game } from './core/Game';
import type { GameState, Quest } from './core/Game';
import { MainMenu } from './components/MainMenu';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  // React State for UI
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [hp, setHp] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create and start the game
    const game = new Game(canvas);
    gameRef.current = game;

    // Bind Game Events to React State
    game.onStateChange = (state) => setGameState(state);
    game.onQuestUpdate = (q) => setQuest({ ...q });
    game.onNotification = (msg) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 3000);
    };

    // Start the loop (Menu state initially)
    game.setState('MENU');
    game.start();

    // Polling loop for high-frequency stats (HP, Score)
    // We don't want to trigger React renders every frame via callbacks
    const uiInterval = setInterval(() => {
      const player = game.getPlayer();
      if (player) setHp(player.hp);
      setScore(game.score);
      // Check game over
      if (player && player.hp <= 0 && !isGameOver) setIsGameOver(true);
      if (player && player.hp > 0 && isGameOver) setIsGameOver(false); // Reset on restart
    }, 100);

    return () => {
      clearInterval(uiInterval);
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    if (gameRef.current) {
      gameRef.current.setState('HUB');
    }
  };

  const handleRestart = () => {
    // Manual restart logic if needed, or rely on Game's internal restart
    // But Game.ts restart logic needs to be updated for new structure if we kept it.
    // For now, let's verify if 'R' key still works or if we need a button.
    // The current Game.ts removed the 'R' key restart logic in favor of state management.
    // Let's add a simple reload for now or re-implement restart.
    window.location.reload();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f0f0f]">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* Main Menu Overlay */}
      {gameState === 'MENU' && <MainMenu onStart={handleStartGame} />}

      {/* HUD (Visible in HUB and DUNGEON) */}
      {(gameState === 'HUB' || gameState === 'DUNGEON') && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start">
            {/* Player Stats */}
            <div className="flex flex-col gap-2">
              <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3">
                <div className="text-green-500 font-bold text-xl">HP</div>
                <div className="w-32 h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-200"
                    style={{ width: `${hp}%` }}
                  />
                </div>
                <div className="text-white font-mono">{Math.ceil(hp)}/100</div>
              </div>
              <div className="bg-black/60 backdrop-blur px-4 py-1 rounded-lg border border-white/10 text-amber-400 font-mono">
                SCORE: {score}
              </div>
            </div>

            {/* Quest Panel (Only in Dungeon) */}
            {gameState === 'DUNGEON' && quest && (
              <div className="bg-black/80 backdrop-blur px-6 py-4 rounded-lg border border-amber-500/30 text-right shadow-lg">
                <h3 className="text-amber-500 font-bold uppercase tracking-wider text-sm mb-1">Current Mission</h3>
                <div className="text-white font-medium text-lg">
                  {quest.type === 'KILL_ENEMIES' ? 'Eliminate Hostiles' : 'Unknown'}
                </div>
                <div className={`font-mono text-2xl mt-1 ${quest.completed ? 'text-green-400' : 'text-white'}`}>
                  {quest.current} / {quest.target}
                </div>
                {quest.completed && (
                  <div className="text-green-400 text-xs mt-2 animate-pulse font-bold">
                    PORTAL UNLOCKED
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location Label */}
          <div className="absolute bottom-8 right-8">
            <h2 className="text-white/20 text-4xl font-black uppercase tracking-tighter">
              {gameState === 'HUB' ? 'SAFE HUB' : 'SECTOR 7G'}
            </h2>
          </div>

          {/* Hub Guide */}
          {gameState === 'HUB' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="bg-blue-500/20 px-6 py-3 rounded-full border border-blue-500/50 backdrop-blur">
                <span className="text-blue-200 text-sm">Approch the <span className="font-bold text-white">Blue Gate</span> to start a mission</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-amber-500/90 text-black px-6 py-3 rounded-full font-bold shadow-lg animate-bounce">
            {notification}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 bg-red-900/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="text-center">
            <h1 className="text-8xl font-black text-white mb-4 drop-shadow-xl">DEAD</h1>
            <p className="text-white/80 text-2xl mb-8">Mission Failed</p>
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-white text-red-900 font-bold rounded-lg hover:bg-gray-200 transition-colors shadow-xl"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

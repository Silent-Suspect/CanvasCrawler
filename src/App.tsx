import { useRef, useEffect } from 'react';
import { Game } from './core/Game';
import { Player } from './entities/Player';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create and start the game
    const game = new Game(canvas);
    gameRef.current = game;

    // Spawn player at center of screen
    const player = new Player(
      game.getWidth() / 2 - 16,
      game.getHeight() / 2 - 16
    );
    game.addEntity(player);

    // Start the game loop
    game.start();

    // Cleanup on unmount (handles React StrictMode double-mount)
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* UI Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/10">
          <p className="text-white/90 text-sm font-medium tracking-wide">
            <span className="text-amber-400 font-bold">WASD</span> to move
            <span className="mx-3 text-white/30">•</span>
            <span className="text-amber-400 font-bold">Click</span> to shoot
          </p>
        </div>
      </div>

      {/* Game Title */}
      <div className="absolute bottom-4 left-4 z-10">
        <h1 className="text-white/40 text-xs font-mono uppercase tracking-widest">
          CanvasCrawler v0.1
        </h1>
      </div>
    </div>
  );
}

export default App;

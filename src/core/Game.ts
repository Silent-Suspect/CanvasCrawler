import { InputManager } from './InputManager';
import { Collision } from './Collision';
import { Entity } from '../entities/Entity';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Particle } from '../entities/Particle';
import { Wall } from '../entities/Wall';
import { Interactable } from '../entities/Interactable';

export type GameState = 'MENU' | 'HUB' | 'DUNGEON' | 'PAUSED';

export interface Quest {
    type: 'KILL_ENEMIES';
    target: number;
    current: number;
    completed: boolean;
}

/**
 * Game - Main game engine controller
 */
export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private input: InputManager;

    public state: GameState = 'MENU';
    public onStateChange: ((state: GameState) => void) | null = null;
    public onQuestUpdate: ((quest: Quest) => void) | null = null;
    public onNotification: ((message: string) => void) | null = null;

    // Entities
    private entities: Entity[] = [];
    private entitiesToAdd: Entity[] = [];
    private entitiesToRemove: Set<Entity> = new Set();
    private particles: Particle[] = [];
    private walls: Wall[] = [];
    private interactables: Interactable[] = [];

    private running: boolean = false;
    private lastTimestamp: number = 0;
    private animationFrameId: number = 0;

    private player: Player | null = null;
    public score: number = 0;

    // Quest System
    public currentQuest: Quest | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get 2D context');
        this.ctx = ctx;

        this.input = InputManager.getInstance();
        this.input.init(canvas);

        this.handleResize();
        window.addEventListener('resize', this.handleResize);
    }

    private handleResize = (): void => {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    getWidth(): number { return this.canvas.getBoundingClientRect().width; }
    getHeight(): number { return this.canvas.getBoundingClientRect().height; }

    setPlayer(player: Player): void { this.player = player; }
    getPlayer(): Player | null { return this.player; }

    start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTimestamp = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    stop(): void {
        this.running = false;
        cancelAnimationFrame(this.animationFrameId);
    }

    destroy(): void {
        this.stop();
        this.input.destroy();
        window.removeEventListener('resize', this.handleResize);
        this.clearLevel();
    }

    private clearLevel(): void {
        this.entities = [];
        this.entitiesToAdd = [];
        this.entitiesToRemove.clear();
        this.particles = [];
        this.walls = [];
        this.interactables = [];
    }

    /**
     * State Management
     */
    setState(newState: GameState): void {
        this.state = newState;
        if (this.onStateChange) this.onStateChange(newState);

        if (newState === 'HUB') {
            this.loadHub();
        } else if (newState === 'DUNGEON') {
            this.loadDungeon();
        }
    }

    /**
     * Level Loaders
     */
    loadHub(): void {
        this.clearLevel();
        // Spawn Player
        const player = new Player(this.getWidth() / 2, this.getHeight() / 2);
        this.addEntity(player);
        this.setPlayer(player);

        // Walls (Safe Room)
        this.createRoomWalls();

        // Gate to Dungeon
        const gate = new Interactable(this.getWidth() / 2 - 40, 100, 80, 50, "Dungeon Gate");
        gate.highlightColor = "#3b82f6"; // Blue
        gate.onInteract = () => {
            this.setState('DUNGEON');
        };
        this.addInteractable(gate);
    }

    loadDungeon(): void {
        this.clearLevel();

        // Spawn Player
        const player = new Player(this.getWidth() / 2, this.getHeight() / 2);
        this.addEntity(player);
        this.setPlayer(player);

        // Walls + Obstacles
        this.createRoomWalls(true);

        // Enemies (Safe Spawn)
        this.spawnEnemies(5);

        // Quest
        this.currentQuest = {
            type: 'KILL_ENEMIES',
            target: 5,
            current: 0,
            completed: false
        };
        if (this.onQuestUpdate) this.onQuestUpdate(this.currentQuest);

        // Exit Portal (Locked initially)
        const portal = new Interactable(this.getWidth() / 2 - 30, 80, 60, 60, "Exit Portal");
        portal.highlightColor = "#22c55e"; // Green
        portal.onInteract = () => {
            if (this.currentQuest?.completed) {
                this.setState('HUB');
                if (this.onNotification) this.onNotification("Mission Complete! Returned to Hub.");
            } else {
                if (this.onNotification) this.onNotification("Quest Locked! Kill more enemies.");
            }
        };
        this.addInteractable(portal);
    }

    private createRoomWalls(obstacles: boolean = false): void {
        const w = this.getWidth();
        const h = this.getHeight();
        const t = 20; // thickness

        this.walls.push(new Wall(0, 0, w, t)); // Top
        this.walls.push(new Wall(0, h - t, w, t)); // Bottom
        this.walls.push(new Wall(0, 0, t, h)); // Left
        this.walls.push(new Wall(w - t, 0, t, h)); // Right

        if (obstacles) {
            this.walls.push(new Wall(100, 100, 60, 60));
            this.walls.push(new Wall(w - 160, h - 160, 60, 60));
            this.walls.push(new Wall(w - 200, 150, 40, 100));
        }
    }

    private spawnEnemies(count: number): void {
        if (!this.player) return;
        const w = this.getWidth();
        const h = this.getHeight();
        const margin = 80;

        for (let i = 0; i < count; i++) {
            let x, y, dist;
            let attempts = 0;
            do {
                x = margin + Math.random() * (w - margin * 2);
                y = margin + Math.random() * (h - margin * 2);
                const center = this.player.getCenter();
                dist = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
                attempts++;
            } while ((dist < 300 || Collision.rectOverlapsWalls(x, y, 28, 28, this.walls)) && attempts < 50);

            const enemy = new Enemy(x, y);
            enemy.setTarget(this.player);
            this.addEntity(enemy);
        }
    }

    addEntity(entity: Entity): void {
        entity.game = this;
        this.entitiesToAdd.push(entity);
    }

    addInteractable(entity: Interactable): void {
        this.interactables.push(entity);
        this.addEntity(entity);
    }

    addParticles(newParticles: Particle[]): void {
        this.particles.push(...newParticles);
    }

    /**
     * Main Loop
     */
    private gameLoop = (timestamp: number): void => {
        if (!this.running) return;
        const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
        this.lastTimestamp = timestamp;

        if (this.state !== 'MENU' && this.state !== 'PAUSED') {
            this.update(dt);
            this.checkCollisions();
        }

        this.render();
        this.input.endFrame();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };

    private update(dt: number): void {
        // Process Additions
        if (this.entitiesToAdd.length > 0) {
            this.entities.push(...this.entitiesToAdd);
            this.entitiesToAdd = [];
        }

        // Interaction Check (Hover)
        const mouse = this.input.getMousePosition();
        let hoveringInteractable = false;

        for (const item of this.interactables) {
            if (item.containsPoint(mouse)) {
                item.setHovered(true);
                hoveringInteractable = true;

                // Handle Click Interaction
                if (this.input.isMouseJustPressed()) {
                    const center = this.player!.getCenter();
                    const itemCenter = item.getCenter();
                    if (center.distanceTo(itemCenter) < 150) {
                        item.interact();
                    } else {
                        if (this.onNotification) this.onNotification("Too far to interact!");
                    }
                    return; // Override shooting
                }
            } else {
                item.setHovered(false);
            }
        }

        // Set Cursor
        this.canvas.style.cursor = hoveringInteractable ? 'pointer' : 'default';

        // Entities Update
        this.entities.forEach(e => !e.destroyed && e.update(dt));
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => !p.destroyed);

        // Cleanup
        this.entities = this.entities.filter(e => !e.destroyed && !this.entitiesToRemove.has(e));
        this.interactables = this.interactables.filter(i => !i.destroyed);
        this.entitiesToRemove.clear();

        // Check Quest Logic
        this.checkQuest();
    }

    private checkQuest(): void {
        if (this.state === 'DUNGEON' && this.currentQuest && !this.currentQuest.completed) {
            if (this.currentQuest.current >= this.currentQuest.target) {
                this.currentQuest.completed = true;
                if (this.onQuestUpdate) this.onQuestUpdate(this.currentQuest);
                if (this.onNotification) this.onNotification("Quest Complete! Portal Unlocked!");
            }
        }
    }

    private checkCollisions(): void {
        const projectiles = this.entities.filter(e => e instanceof Projectile && !e.destroyed) as Projectile[];
        const enemies = this.entities.filter(e => e instanceof Enemy && !e.destroyed) as Enemy[];

        // Walls
        if (this.player) this.walls.forEach(w => Collision.resolveWallCollision(this.player!, w));
        enemies.forEach(e => this.walls.forEach(w => Collision.resolveWallCollision(e, w)));

        // Projectile vs Wall
        projectiles.forEach(p => {
            if (this.walls.some(w => Collision.checkAABB(p, w))) {
                p.destroy();
                this.addParticles(Particle.scatter(p.position.x, p.position.y, '#9ca3af', 3));
            }
        });

        // Combat
        projectiles.forEach(p => {
            if (p.destroyed) return;
            enemies.forEach(e => {
                if (Collision.checkAABB(p, e)) {
                    p.destroy();
                    e.takeDamage(1);
                    this.addParticles(Particle.scatter(e.position.x, e.position.y, '#ef4444', 3));

                    if (e.hp <= 0) {
                        this.score += 10;
                        this.addParticles(Particle.burst(e.position.x, e.position.y, '#ef4444', 8));

                        // Quest Progress
                        if (this.currentQuest && !this.currentQuest.completed) {
                            this.currentQuest.current++;
                            if (this.onQuestUpdate) this.onQuestUpdate(this.currentQuest);
                        }
                    }
                }
            });
        });

        // Player Hit
        if (this.player) {
            enemies.forEach(e => {
                if (Collision.checkAABB(e, this.player!)) {
                    if (this.player!.takeDamage(10)) {
                        this.addParticles(Particle.scatter(this.player!.position.x, this.player!.position.y, '#dc2626', 5));
                    }
                    const dir = Collision.getDirection(this.player!, e);
                    e.knockback(dir, 30);
                }
            });
        }
    }

    private render(): void {
        const w = this.getWidth();
        const h = this.getHeight();

        // Background
        this.ctx.fillStyle = '#0f0f0f';
        this.ctx.fillRect(0, 0, w, h);

        if (this.state === 'MENU') return; // React handles Menu

        // Floor Grid
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            for (let y = 0; y < h; y += 40) {
                this.ctx.strokeRect(x, y, 40, 40);
            }
        }

        // Walls
        this.walls.forEach(w => w.draw(this.ctx));

        // Interactables
        this.interactables.forEach(i => {
            // Only show exit portal if quest is complete
            if (i.label === "Exit Portal" && !this.currentQuest?.completed) {
                // Draw locked portal (maybe grayed out?)
                this.ctx.globalAlpha = 0.2;
                i.draw(this.ctx);
                this.ctx.globalAlpha = 1.0;
            } else {
                i.draw(this.ctx);
            }
        });

        // Particles
        this.particles.forEach(p => p.draw(this.ctx));

        // Entities
        this.entities.forEach(e => !e.destroyed && e.draw(this.ctx));
    }
}

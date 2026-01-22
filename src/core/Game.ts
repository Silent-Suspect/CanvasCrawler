import { InputManager } from './InputManager';
import { Collision } from './Collision';
import { Entity } from '../entities/Entity';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';

/**
 * Game - Main game engine controller
 * Manages the game loop, entities, and rendering
 */
export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private input: InputManager;

    private entities: Entity[] = [];
    private entitiesToAdd: Entity[] = [];
    private entitiesToRemove: Set<Entity> = new Set();

    private running: boolean = false;
    private lastTimestamp: number = 0;
    private animationFrameId: number = 0;

    // Player reference for enemy targeting
    private player: Player | null = null;

    // Enemy spawner
    private spawnTimer: number = 0;
    private readonly SPAWN_INTERVAL: number = 2; // seconds

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D context from canvas');
        }
        this.ctx = ctx;

        // Initialize input manager
        this.input = InputManager.getInstance();
        this.input.init(canvas);

        // Setup canvas sizing
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
    }

    /** Handle window resize - update canvas size for high-DPI */
    private handleResize = (): void => {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        // Set the canvas internal size (accounting for DPI)
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // Scale the context to match DPI
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /** Get canvas dimensions (CSS pixels, not device pixels) */
    getWidth(): number {
        return this.canvas.getBoundingClientRect().width;
    }

    getHeight(): number {
        return this.canvas.getBoundingClientRect().height;
    }

    /** Set the player reference */
    setPlayer(player: Player): void {
        this.player = player;
    }

    /** Get the player */
    getPlayer(): Player | null {
        return this.player;
    }

    /** Add an entity to the game */
    addEntity(entity: Entity): void {
        entity.game = this;
        this.entitiesToAdd.push(entity);
    }

    /** Remove an entity from the game */
    removeEntity(entity: Entity): void {
        this.entitiesToRemove.add(entity);
    }

    /** Get all entities (for collision detection, etc.) */
    getEntities(): Entity[] {
        return this.entities;
    }

    /** Start the game loop */
    start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTimestamp = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    /** Stop the game loop */
    stop(): void {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = 0;
        }
    }

    /** Clean up resources */
    destroy(): void {
        this.stop();
        this.input.destroy();
        window.removeEventListener('resize', this.handleResize);
        this.entities = [];
        this.entitiesToAdd = [];
        this.entitiesToRemove.clear();
        this.player = null;
    }

    /** Main game loop */
    private gameLoop = (timestamp: number): void => {
        if (!this.running) return;

        // Calculate delta time in seconds
        const deltaTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1); // Cap at 100ms
        this.lastTimestamp = timestamp;

        this.update(deltaTime);
        this.checkCollisions();
        this.render();

        // Reset per-frame input states
        this.input.endFrame();

        // Continue the loop
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };

    /** Update game logic */
    private update(dt: number): void {
        // Add pending entities
        if (this.entitiesToAdd.length > 0) {
            this.entities.push(...this.entitiesToAdd);
            this.entitiesToAdd = [];
        }

        // Update all entities
        for (const entity of this.entities) {
            if (!entity.destroyed) {
                entity.update(dt);
            }
        }

        // Enemy spawner
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.SPAWN_INTERVAL) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        // Remove destroyed entities
        this.entities = this.entities.filter(e => !e.destroyed && !this.entitiesToRemove.has(e));
        this.entitiesToRemove.clear();
    }

    /** Spawn an enemy at a random edge of the screen */
    private spawnEnemy(): void {
        if (!this.player) return;

        const width = this.getWidth();
        const height = this.getHeight();
        const margin = 50;

        let x: number, y: number;

        // Pick a random edge (0: top, 1: right, 2: bottom, 3: left)
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: // Top
                x = Math.random() * width;
                y = -margin;
                break;
            case 1: // Right
                x = width + margin;
                y = Math.random() * height;
                break;
            case 2: // Bottom
                x = Math.random() * width;
                y = height + margin;
                break;
            default: // Left
                x = -margin;
                y = Math.random() * height;
                break;
        }

        const enemy = new Enemy(x, y);
        enemy.setTarget(this.player);
        this.addEntity(enemy);
    }

    /** Check all collisions */
    private checkCollisions(): void {
        const projectiles = this.entities.filter(e => e instanceof Projectile && !e.destroyed) as Projectile[];
        const enemies = this.entities.filter(e => e instanceof Enemy && !e.destroyed) as Enemy[];

        // Projectile vs Enemy
        for (const projectile of projectiles) {
            for (const enemy of enemies) {
                if (Collision.checkAABB(projectile, enemy)) {
                    projectile.destroy();
                    enemy.destroy();
                    console.log('💥 Hit! Enemy destroyed!');
                }
            }
        }

        // Enemy vs Player
        if (this.player && !this.player.destroyed) {
            for (const enemy of enemies) {
                if (enemy.destroyed) continue;

                if (Collision.checkAABB(enemy, this.player)) {
                    console.log('⚠️ Player Hit!');

                    // Knockback the enemy
                    const direction = Collision.getDirection(this.player, enemy);
                    enemy.knockback(direction, 30);
                }
            }
        }
    }

    /** Render the game */
    private render(): void {
        const width = this.getWidth();
        const height = this.getHeight();

        // Clear the canvas with a dark background
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, width, height);

        // Draw all entities
        for (const entity of this.entities) {
            if (!entity.destroyed) {
                entity.draw(this.ctx);
            }
        }
    }
}

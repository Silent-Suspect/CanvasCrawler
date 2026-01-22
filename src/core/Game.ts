import { InputManager } from './InputManager';
import { Collision } from './Collision';
import { Entity } from '../entities/Entity';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Particle } from '../entities/Particle';

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
    private particles: Particle[] = [];

    private running: boolean = false;
    private lastTimestamp: number = 0;
    private animationFrameId: number = 0;

    // Player reference for enemy targeting
    private player: Player | null = null;

    // Enemy spawner
    private spawnTimer: number = 0;
    private readonly SPAWN_INTERVAL: number = 2; // seconds

    // Game state
    public score: number = 0;
    public isGameOver: boolean = false;

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

    /** Add particles to the game */
    addParticles(newParticles: Particle[]): void {
        this.particles.push(...newParticles);
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
        this.particles = [];
        this.player = null;
    }

    /** Restart the game */
    private restart(): void {
        // Clear entities
        this.entities = [];
        this.entitiesToAdd = [];
        this.entitiesToRemove.clear();
        this.particles = [];

        // Reset state
        this.score = 0;
        this.isGameOver = false;
        this.spawnTimer = 0;

        // Create new player
        const player = new Player(
            this.getWidth() / 2 - 16,
            this.getHeight() / 2 - 16
        );
        this.addEntity(player);
        this.player = player;
    }

    /** Main game loop */
    private gameLoop = (timestamp: number): void => {
        if (!this.running) return;

        // Calculate delta time in seconds
        const deltaTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1); // Cap at 100ms
        this.lastTimestamp = timestamp;

        this.update(deltaTime);
        if (!this.isGameOver) {
            this.checkCollisions();
        }
        this.render();

        // Reset per-frame input states
        this.input.endFrame();

        // Continue the loop
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };

    /** Update game logic */
    private update(dt: number): void {
        // Check for restart
        if (this.isGameOver) {
            if (this.input.isKeyDown('r')) {
                this.restart();
            }
            return;
        }

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

        // Update particles
        for (const particle of this.particles) {
            particle.update(dt);
        }
        this.particles = this.particles.filter(p => !p.destroyed);

        // Check game over
        if (this.player && this.player.hp <= 0) {
            this.isGameOver = true;
            // Death explosion
            const center = this.player.getCenter();
            this.addParticles(Particle.burst(center.x, center.y, '#3b82f6', 15, 200, 6));
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
                if (enemy.destroyed) continue;

                if (Collision.checkAABB(projectile, enemy)) {
                    projectile.destroy();
                    enemy.takeDamage(1);

                    // Spawn hit particles
                    const center = enemy.getCenter();
                    this.addParticles(Particle.scatter(center.x, center.y, '#ef4444', 3));

                    // Check if enemy died
                    if (enemy.hp <= 0) {
                        this.score += 10;
                        // Death explosion
                        this.addParticles(Particle.burst(center.x, center.y, '#ef4444', 8, 150, 5));
                        console.log(`💥 Enemy destroyed! Score: ${this.score}`);
                    }
                }
            }
        }

        // Enemy vs Player
        if (this.player && !this.player.destroyed) {
            for (const enemy of enemies) {
                if (enemy.destroyed) continue;

                if (Collision.checkAABB(enemy, this.player)) {
                    // Try to damage player (respects invulnerability)
                    if (this.player.takeDamage(10)) {
                        console.log(`⚠️ Player Hit! HP: ${this.player.hp}`);

                        // Blood particles
                        const center = this.player.getCenter();
                        this.addParticles(Particle.scatter(center.x, center.y, '#dc2626', 5));
                    }

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

        // Draw particles (behind entities)
        for (const particle of this.particles) {
            particle.draw(this.ctx);
        }

        // Draw all entities
        for (const entity of this.entities) {
            if (!entity.destroyed) {
                entity.draw(this.ctx);
            }
        }

        // Draw UI
        this.drawUI();

        // Draw game over overlay
        if (this.isGameOver) {
            this.drawGameOver();
        }
    }

    /** Draw the UI overlay */
    private drawUI(): void {
        // Score
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 80);

        // HP
        if (this.player && !this.isGameOver) {
            this.ctx.fillStyle = '#22c55e';
            this.ctx.fillText(`HP: ${this.player.hp}`, 20, 110);
        }
    }

    /** Draw game over screen */
    private drawGameOver(): void {
        const width = this.getWidth();
        const height = this.getHeight();

        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, width, height);

        // Game Over text
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = 'bold 64px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', width / 2, height / 2 - 40);

        // Final score
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillText(`Final Score: ${this.score}`, width / 2, height / 2 + 20);

        // Restart prompt
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = '24px monospace';
        this.ctx.fillText('Press R to Restart', width / 2, height / 2 + 70);
    }
}

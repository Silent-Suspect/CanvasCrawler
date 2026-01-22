import { InputManager } from './InputManager';
import { Collision } from './Collision';
import { Entity } from '../entities/Entity';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Particle } from '../entities/Particle';
import { Wall } from '../entities/Wall';

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
    private walls: Wall[] = [];

    private running: boolean = false;
    private lastTimestamp: number = 0;
    private animationFrameId: number = 0;

    // Player reference for enemy targeting
    private player: Player | null = null;

    // Game state
    public score: number = 0;
    public isGameOver: boolean = false;
    private readonly ENEMY_COUNT: number = 5;

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

    /** Get walls for collision checks */
    getWalls(): Wall[] {
        return this.walls;
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
        this.walls = [];
        this.player = null;
    }

    /** Initialize the level with walls and enemies */
    initLevel(): void {
        this.generateLevel();
        this.spawnEnemies();
    }

    /** Generate level layout with walls */
    private generateLevel(): void {
        this.walls = [];
        const width = this.getWidth();
        const height = this.getHeight();
        const wallThickness = 20;

        // Border walls
        // Top
        this.walls.push(new Wall(0, 0, width, wallThickness));
        // Bottom
        this.walls.push(new Wall(0, height - wallThickness, width, wallThickness));
        // Left
        this.walls.push(new Wall(0, 0, wallThickness, height));
        // Right
        this.walls.push(new Wall(width - wallThickness, 0, wallThickness, height));

        // Internal obstacles (2-3 random blocks)
        const obstacleCount = 2 + Math.floor(Math.random() * 2);
        const obstacleSize = 60;
        const margin = 100; // Keep away from edges and center

        for (let i = 0; i < obstacleCount; i++) {
            let x: number, y: number;
            let attempts = 0;
            const maxAttempts = 20;

            // Find a valid position (not too close to center where player spawns)
            do {
                x = margin + Math.random() * (width - margin * 2 - obstacleSize);
                y = margin + Math.random() * (height - margin * 2 - obstacleSize);
                attempts++;

                // Avoid center area where player spawns
                const centerX = width / 2;
                const centerY = height / 2;
                const distToCenter = Math.sqrt(
                    Math.pow(x + obstacleSize / 2 - centerX, 2) +
                    Math.pow(y + obstacleSize / 2 - centerY, 2)
                );

                if (distToCenter > 120) break;
            } while (attempts < maxAttempts);

            this.walls.push(new Wall(x, y, obstacleSize, obstacleSize));
        }
    }

    /** Spawn fixed number of enemies at valid positions */
    private spawnEnemies(): void {
        if (!this.player) return;

        const width = this.getWidth();
        const height = this.getHeight();
        const margin = 80;
        const enemySize = 28;

        for (let i = 0; i < this.ENEMY_COUNT; i++) {
            let x: number, y: number;
            let attempts = 0;
            const maxAttempts = 50;

            // Find valid spawn position (not in walls, not too close to player)
            do {
                x = margin + Math.random() * (width - margin * 2 - enemySize);
                y = margin + Math.random() * (height - margin * 2 - enemySize);
                attempts++;

                // Check distance from player
                const playerCenter = this.player.getCenter();
                const dist = Math.sqrt(
                    Math.pow(x + enemySize / 2 - playerCenter.x, 2) +
                    Math.pow(y + enemySize / 2 - playerCenter.y, 2)
                );

                // Must be away from player and not in walls
                if (dist > 200 && !Collision.rectOverlapsWalls(x, y, enemySize, enemySize, this.walls)) {
                    break;
                }
            } while (attempts < maxAttempts);

            const enemy = new Enemy(x, y);
            enemy.setTarget(this.player);
            this.addEntity(enemy);
        }
    }

    /** Restart the game */
    private restart(): void {
        // Clear entities
        this.entities = [];
        this.entitiesToAdd = [];
        this.entitiesToRemove.clear();
        this.particles = [];
        this.walls = [];

        // Reset state
        this.score = 0;
        this.isGameOver = false;

        // Create new player
        const player = new Player(
            this.getWidth() / 2 - 16,
            this.getHeight() / 2 - 16
        );
        this.addEntity(player);
        this.player = player;

        // Generate level and spawn enemies
        this.initLevel();
    }

    /** Main game loop */
    private gameLoop = (timestamp: number): void => {
        if (!this.running) return;

        // Calculate delta time in seconds
        const deltaTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
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
            const center = this.player.getCenter();
            this.addParticles(Particle.burst(center.x, center.y, '#3b82f6', 15, 200, 6));
        }

        // Check win condition (all enemies dead)
        const enemies = this.entities.filter(e => e instanceof Enemy && !e.destroyed);
        if (enemies.length === 0 && !this.isGameOver && this.entities.length > 1) {
            // Room cleared! Could add victory state later
        }

        // Remove destroyed entities
        this.entities = this.entities.filter(e => !e.destroyed && !this.entitiesToRemove.has(e));
        this.entitiesToRemove.clear();
    }

    /** Check all collisions */
    private checkCollisions(): void {
        const projectiles = this.entities.filter(e => e instanceof Projectile && !e.destroyed) as Projectile[];
        const enemies = this.entities.filter(e => e instanceof Enemy && !e.destroyed) as Enemy[];

        // Entity vs Wall collisions
        this.checkWallCollisions();

        // Projectile vs Wall
        for (const projectile of projectiles) {
            for (const wall of this.walls) {
                if (Collision.checkAABB(projectile, wall)) {
                    projectile.destroy();
                    // Poof particles
                    const center = projectile.getCenter();
                    this.addParticles(Particle.scatter(center.x, center.y, '#9ca3af', 3, 60));
                    break;
                }
            }
        }

        // Projectile vs Enemy
        for (const projectile of projectiles) {
            if (projectile.destroyed) continue;

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
                    if (this.player.takeDamage(10)) {
                        console.log(`⚠️ Player Hit! HP: ${this.player.hp}`);
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

    /** Check and resolve wall collisions for all movable entities */
    private checkWallCollisions(): void {
        // Player vs walls
        if (this.player && !this.player.destroyed) {
            for (const wall of this.walls) {
                Collision.resolveWallCollision(this.player, wall);
            }
        }

        // Enemies vs walls
        const enemies = this.entities.filter(e => e instanceof Enemy && !e.destroyed) as Enemy[];
        for (const enemy of enemies) {
            for (const wall of this.walls) {
                Collision.resolveWallCollision(enemy, wall);
            }
        }
    }

    /** Render the game */
    private render(): void {
        const width = this.getWidth();
        const height = this.getHeight();

        // Clear the canvas with a dark background
        this.ctx.fillStyle = '#0f0f0f';
        this.ctx.fillRect(0, 0, width, height);

        // Draw floor pattern (subtle grid)
        this.drawFloor();

        // Draw walls
        for (const wall of this.walls) {
            wall.draw(this.ctx);
        }

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

    /** Draw floor tile pattern */
    private drawFloor(): void {
        const tileSize = 40;
        const width = this.getWidth();
        const height = this.getHeight();

        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < width; x += tileSize) {
            for (let y = 0; y < height; y += tileSize) {
                this.ctx.strokeRect(x, y, tileSize, tileSize);
            }
        }
    }

    /** Draw the UI overlay */
    private drawUI(): void {
        // Score
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 30, 60);

        // HP
        if (this.player && !this.isGameOver) {
            this.ctx.fillStyle = '#22c55e';
            this.ctx.fillText(`HP: ${this.player.hp}`, 30, 90);
        }

        // Enemy count
        const enemies = this.entities.filter(e => e instanceof Enemy && !e.destroyed);
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillText(`Enemies: ${enemies.length}`, 30, 120);
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

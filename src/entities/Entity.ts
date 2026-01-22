import { Vector2 } from '../utils/Vector2';
import type { Game } from '../core/Game';

/**
 * Entity - Base class for all game objects
 */
export abstract class Entity {
    // Position
    public position: Vector2 = new Vector2();

    // Size
    public width: number = 32;
    public height: number = 32;

    // Velocity
    public velocity: Vector2 = new Vector2();

    // Movement speed (pixels per second)
    public speed: number = 200;

    // Rotation in radians
    public rotation: number = 0;

    // Reference to game (set when added to game)
    public game: Game | null = null;

    // Destruction flag
    public destroyed: boolean = false;

    constructor(x: number = 0, y: number = 0) {
        this.position = new Vector2(x, y);
    }

    /** Update entity logic - called every frame */
    abstract update(dt: number): void;

    /** Draw the entity - called every frame */
    abstract draw(ctx: CanvasRenderingContext2D): void;

    /** Mark entity for destruction */
    destroy(): void {
        this.destroyed = true;
    }

    /** Get the center position of the entity */
    getCenter(): Vector2 {
        return new Vector2(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        );
    }

    /** Check if entity is off-screen */
    isOffScreen(): boolean {
        if (!this.game) return false;
        const margin = Math.max(this.width, this.height);
        return (
            this.position.x < -margin ||
            this.position.y < -margin ||
            this.position.x > this.game.getWidth() + margin ||
            this.position.y > this.game.getHeight() + margin
        );
    }
}

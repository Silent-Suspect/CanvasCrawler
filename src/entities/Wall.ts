import { Entity } from './Entity';

/**
 * Wall - A static obstacle that blocks movement
 * Gray rectangle that players, enemies, and projectiles cannot pass through
 */
export class Wall extends Entity {
    public isStatic: boolean = true;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y);
        this.width = width;
        this.height = height;
    }

    update(_dt: number): void {
        // Walls are static - no update needed
    }

    draw(ctx: CanvasRenderingContext2D): void {
        // Main wall body
        ctx.fillStyle = '#374151'; // gray-700
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Inner highlight (3D effect)
        ctx.fillStyle = '#4b5563'; // gray-600
        ctx.fillRect(
            this.position.x + 2,
            this.position.y + 2,
            this.width - 4,
            this.height - 4
        );

        // Border
        ctx.strokeStyle = '#1f2937'; // gray-800
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
    }
}

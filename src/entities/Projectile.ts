import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';

/**
 * Projectile - A fast-moving bullet fired by the player
 * Yellow square that travels in the aimed direction
 */
export class Projectile extends Entity {
    constructor(x: number, y: number, angle: number) {
        super(x, y);
        this.width = 8;
        this.height = 8;
        this.speed = 600; // pixels per second
        this.rotation = angle;

        // Center the projectile on spawn point
        this.position.x -= this.width / 2;
        this.position.y -= this.height / 2;

        // Set velocity based on angle
        this.velocity = Vector2.fromAngle(angle, this.speed);
    }

    update(dt: number): void {
        // Move in the firing direction
        this.position = this.position.add(this.velocity.multiply(dt));

        // Destroy if off-screen
        if (this.isOffScreen()) {
            this.destroy();
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const centerX = this.position.x + this.width / 2;
        const centerY = this.position.y + this.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);

        // Draw the yellow projectile
        ctx.fillStyle = '#facc15'; // Tailwind yellow-400
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Add a glow effect
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 8;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        ctx.restore();
    }
}

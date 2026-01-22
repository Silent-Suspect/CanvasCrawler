import { Entity } from './Entity';
import { Player } from './Player';
import { Vector2 } from '../utils/Vector2';

/**
 * Enemy - A hostile entity that chases the player
 * Red square with simple "zombie" AI behavior
 */
export class Enemy extends Entity {
    private target: Player | null = null;

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 28;
        this.height = 28;
        this.speed = 120; // Slower than player (250)
    }

    /** Set the target to chase */
    setTarget(player: Player): void {
        this.target = player;
    }

    update(dt: number): void {
        if (!this.target || this.target.destroyed) return;

        // Calculate direction to player
        const myCenter = this.getCenter();
        const targetCenter = this.target.getCenter();
        const direction = targetCenter.subtract(myCenter);

        // Normalize and apply velocity
        if (direction.magnitude > 0) {
            this.velocity = direction.normalize().multiply(this.speed);
            this.rotation = direction.angle;
        }

        // Move toward player
        this.position = this.position.add(this.velocity.multiply(dt));
    }

    /** Apply knockback force */
    knockback(direction: Vector2, force: number): void {
        const knockbackVec = direction.normalize().multiply(force);
        this.position = this.position.add(knockbackVec);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const centerX = this.position.x + this.width / 2;
        const centerY = this.position.y + this.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);

        // Draw the red enemy body
        ctx.fillStyle = '#ef4444'; // Tailwind red-500
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Draw a darker border
        ctx.strokeStyle = '#b91c1c'; // Tailwind red-700
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Draw angry eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(-6, -4, 4, 4);
        ctx.fillRect(2, -4, 4, 4);

        ctx.restore();
    }
}

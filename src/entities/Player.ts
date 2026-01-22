import { Entity } from './Entity';
import { Projectile } from './Projectile';
import { InputManager } from '../core/InputManager';
import { Vector2 } from '../utils/Vector2';

/**
 * Player - The hero character controlled by the player
 * Blue square that moves with WASD and aims at mouse
 */
export class Player extends Entity {
    private input: InputManager;
    private shootCooldown: number = 0;
    private readonly SHOOT_COOLDOWN: number = 0.15; // seconds between shots

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 32;
        this.height = 32;
        this.speed = 250; // pixels per second
        this.input = InputManager.getInstance();
    }

    update(dt: number): void {
        // Get movement input (normalized for diagonal)
        const movement = this.input.getMovementVector();

        // Apply movement
        this.velocity = movement.multiply(this.speed);
        this.position = this.position.add(this.velocity.multiply(dt));

        // Keep player on screen
        this.clampToScreen();

        // Face the mouse cursor
        this.updateRotation();

        // Handle shooting
        this.shootCooldown = Math.max(0, this.shootCooldown - dt);
        if (this.input.isMouseJustPressed() && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.SHOOT_COOLDOWN;
        }
    }

    private clampToScreen(): void {
        if (!this.game) return;
        const maxX = this.game.getWidth() - this.width;
        const maxY = this.game.getHeight() - this.height;

        this.position.x = Math.max(0, Math.min(this.position.x, maxX));
        this.position.y = Math.max(0, Math.min(this.position.y, maxY));
    }

    private updateRotation(): void {
        const center = this.getCenter();
        const mouse = this.input.getMousePosition();
        const direction = mouse.subtract(center);
        this.rotation = direction.angle;
    }

    private shoot(): void {
        if (!this.game) return;

        const center = this.getCenter();
        const projectile = new Projectile(
            center.x,
            center.y,
            this.rotation
        );
        this.game.addEntity(projectile);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const centerX = this.position.x + this.width / 2;
        const centerY = this.position.y + this.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);

        // Draw the blue square body
        ctx.fillStyle = '#3b82f6'; // Tailwind blue-500
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Draw a border
        ctx.strokeStyle = '#1d4ed8'; // Tailwind blue-700
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Draw direction indicator (nose)
        ctx.fillStyle = '#fbbf24'; // Tailwind amber-400
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width / 2 + 8, -4);
        ctx.lineTo(this.width / 2 + 8, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

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

    // Health system
    public hp: number = 100;
    public maxHp: number = 100;

    // Invulnerability
    private lastHitTime: number = 0;
    private readonly INVULN_DURATION: number = 0.5; // seconds

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 32;
        this.height = 32;
        this.speed = 250; // pixels per second
        this.input = InputManager.getInstance();
    }

    /** Check if player can take damage */
    isInvulnerable(): boolean {
        return (performance.now() / 1000) - this.lastHitTime < this.INVULN_DURATION;
    }

    /** Apply damage to player */
    takeDamage(amount: number): boolean {
        if (this.isInvulnerable()) return false;

        this.hp -= amount;
        this.lastHitTime = performance.now() / 1000;

        if (this.hp <= 0) {
            this.hp = 0;
            this.destroy();
        }
        return true;
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

        // Flash white when invulnerable
        const flashing = this.isInvulnerable() && Math.floor(performance.now() / 100) % 2 === 0;

        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);

        // Draw the blue square body
        ctx.fillStyle = flashing ? '#ffffff' : '#3b82f6'; // Tailwind blue-500
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Draw a border
        ctx.strokeStyle = flashing ? '#cccccc' : '#1d4ed8'; // Tailwind blue-700
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

        // Draw HP bar if damaged
        if (this.hp < this.maxHp) {
            this.drawHpBar(ctx);
        }
    }

    private drawHpBar(ctx: CanvasRenderingContext2D): void {
        const barWidth = this.width + 8;
        const barHeight = 4;
        const barX = this.position.x + this.width / 2 - barWidth / 2;
        const barY = this.position.y - 10;

        // Background
        ctx.fillStyle = '#374151'; // gray-700
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill
        const fillWidth = (this.hp / this.maxHp) * barWidth;
        ctx.fillStyle = '#22c55e'; // green-500
        ctx.fillRect(barX, barY, fillWidth, barHeight);

        // Border
        ctx.strokeStyle = '#1f2937'; // gray-800
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

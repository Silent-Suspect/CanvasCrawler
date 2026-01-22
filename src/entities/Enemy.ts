import { Entity } from './Entity';
import { Player } from './Player';
import { Vector2 } from '../utils/Vector2';

/** Enemy AI States */
type EnemyState = 'IDLE' | 'CHASE';

/**
 * Enemy - A hostile entity with state-based AI
 * Red square that can idle or chase the player
 */
export class Enemy extends Entity {
    private target: Player | null = null;

    // Health system
    public hp: number = 3;
    public maxHp: number = 3;

    // AI State Machine
    private state: EnemyState = 'IDLE';
    private readonly AGGRO_RANGE: number = 300;
    private readonly DEAGGRO_RANGE: number = 500;
    private readonly CHASE_SPEED: number = 140;
    private readonly IDLE_SPEED: number = 40;

    // Idle wandering
    private idleDirection: Vector2 = new Vector2();
    private idleTimer: number = 0;
    private readonly IDLE_CHANGE_INTERVAL: number = 2; // seconds

    // Damage-triggered aggro
    private wasRecentlyDamaged: boolean = false;

    constructor(x: number, y: number) {
        super(x, y);
        this.width = 28;
        this.height = 28;
        this.speed = this.IDLE_SPEED;
        this.pickRandomIdleDirection();
    }

    /** Set the target to chase */
    setTarget(player: Player): void {
        this.target = player;
    }

    /** Apply damage to enemy */
    takeDamage(amount: number): void {
        this.hp -= amount;
        this.wasRecentlyDamaged = true;

        // Immediately aggro when damaged
        if (this.state === 'IDLE') {
            this.setState('CHASE');
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.destroy();
        }
    }

    /** Get current AI state */
    getState(): EnemyState {
        return this.state;
    }

    private setState(newState: EnemyState): void {
        if (this.state === newState) return;
        this.state = newState;
        this.speed = newState === 'CHASE' ? this.CHASE_SPEED : this.IDLE_SPEED;
    }

    private pickRandomIdleDirection(): void {
        const angle = Math.random() * Math.PI * 2;
        this.idleDirection = Vector2.fromAngle(angle, 1);
        this.idleTimer = 0;
    }

    private getDistanceToTarget(): number {
        if (!this.target) return Infinity;
        return this.getCenter().distanceTo(this.target.getCenter());
    }

    update(dt: number): void {
        if (!this.target || this.target.destroyed) {
            this.setState('IDLE');
            this.updateIdle(dt);
            return;
        }

        const distance = this.getDistanceToTarget();

        // State transitions
        if (this.state === 'IDLE') {
            if (distance < this.AGGRO_RANGE || this.wasRecentlyDamaged) {
                this.setState('CHASE');
            }
        } else if (this.state === 'CHASE') {
            // Optional: de-aggro if too far
            if (distance > this.DEAGGRO_RANGE && !this.wasRecentlyDamaged) {
                this.setState('IDLE');
                this.pickRandomIdleDirection();
            }
        }

        // Clear damage flag after processing
        this.wasRecentlyDamaged = false;

        // Execute current state behavior
        if (this.state === 'CHASE') {
            this.updateChase(dt);
        } else {
            this.updateIdle(dt);
        }
    }

    private updateChase(dt: number): void {
        if (!this.target) return;

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

    private updateIdle(dt: number): void {
        // Change direction periodically
        this.idleTimer += dt;
        if (this.idleTimer >= this.IDLE_CHANGE_INTERVAL) {
            this.pickRandomIdleDirection();
        }

        // Wander slowly
        this.velocity = this.idleDirection.multiply(this.speed);
        this.rotation = this.idleDirection.angle;
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
        ctx.fillStyle = this.state === 'CHASE' ? '#dc2626' : '#ef4444'; // Darker when chasing
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Draw a darker border
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Draw angry eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(-6, -4, 4, 4);
        ctx.fillRect(2, -4, 4, 4);

        ctx.restore();

        // Draw HP bar if damaged
        if (this.hp < this.maxHp) {
            this.drawHpBar(ctx);
        }

        // Draw aggro indicator when chasing
        if (this.state === 'CHASE') {
            this.drawAggroIndicator(ctx);
        }
    }

    private drawHpBar(ctx: CanvasRenderingContext2D): void {
        const barWidth = this.width;
        const barHeight = 3;
        const barX = this.position.x + this.width / 2 - barWidth / 2;
        const barY = this.position.y - 8;

        // Background
        ctx.fillStyle = '#374151';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill
        const fillWidth = (this.hp / this.maxHp) * barWidth;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(barX, barY, fillWidth, barHeight);

        // Border
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    private drawAggroIndicator(ctx: CanvasRenderingContext2D): void {
        const x = this.position.x + this.width / 2;
        const y = this.position.y - 18;

        // Draw "!" indicator
        ctx.fillStyle = '#fbbf24'; // amber
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', x, y);
    }
}

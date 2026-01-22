import { Vector2 } from '../utils/Vector2';

/**
 * Particle - Visual effect entity with decay
 * Used for hit effects, explosions, etc.
 */
export class Particle {
    public position: Vector2;
    public velocity: Vector2;
    public color: string;
    public size: number;
    public life: number;
    public decay: number;
    public destroyed: boolean = false;

    constructor(
        x: number,
        y: number,
        velocity: Vector2,
        color: string,
        size: number = 4,
        life: number = 1.0,
        decay: number = 0.03
    ) {
        this.position = new Vector2(x, y);
        this.velocity = velocity;
        this.color = color;
        this.size = size;
        this.life = life;
        this.decay = decay;
    }

    /** Create multiple particles in a burst pattern */
    static burst(
        x: number,
        y: number,
        color: string,
        count: number = 5,
        speed: number = 100,
        size: number = 4
    ): Particle[] {
        const particles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const velocity = Vector2.fromAngle(angle, speed * (0.5 + Math.random()));
            particles.push(new Particle(x, y, velocity, color, size));
        }
        return particles;
    }

    /** Create random scattered particles */
    static scatter(
        x: number,
        y: number,
        color: string,
        count: number = 3,
        speed: number = 80
    ): Particle[] {
        const particles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Vector2.fromAngle(angle, speed * (0.3 + Math.random() * 0.7));
            particles.push(new Particle(x, y, velocity, color, 3 + Math.random() * 3));
        }
        return particles;
    }

    update(dt: number): void {
        // Apply velocity
        this.position = this.position.add(this.velocity.multiply(dt));

        // Apply friction
        this.velocity = this.velocity.multiply(0.95);

        // Decay life
        this.life -= this.decay;

        // Mark for removal when dead
        if (this.life <= 0) {
            this.destroyed = true;
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.destroyed) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;

        // Draw as a small square
        const halfSize = this.size / 2;
        ctx.fillRect(
            this.position.x - halfSize,
            this.position.y - halfSize,
            this.size,
            this.size
        );

        ctx.restore();
    }
}

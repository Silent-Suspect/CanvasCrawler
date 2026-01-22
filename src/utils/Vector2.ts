/**
 * Vector2 utility class for 2D math operations
 */
export class Vector2 {
    constructor(public x: number = 0, public y: number = 0) { }

    /** Create a new Vector2 from an angle (in radians) */
    static fromAngle(angle: number, magnitude: number = 1): Vector2 {
        return new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }

    /** Get the length/magnitude of this vector */
    get magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /** Get the angle of this vector in radians */
    get angle(): number {
        return Math.atan2(this.y, this.x);
    }

    /** Add another vector to this one */
    add(v: Vector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    /** Subtract another vector from this one */
    subtract(v: Vector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    /** Multiply this vector by a scalar */
    multiply(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    /** Normalize this vector (make it length 1) */
    normalize(): Vector2 {
        const mag = this.magnitude;
        if (mag === 0) return new Vector2(0, 0);
        return new Vector2(this.x / mag, this.y / mag);
    }

    /** Clone this vector */
    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    /** Calculate distance to another vector */
    distanceTo(v: Vector2): number {
        return this.subtract(v).magnitude;
    }
}

import { Entity } from '../entities/Entity';
import { Vector2 } from '../utils/Vector2';

/**
 * AABB Collision detection utilities
 */
export class Collision {
    /**
     * Check if two entities overlap using AABB
     */
    static checkAABB(a: Entity, b: Entity): boolean {
        return (
            a.position.x < b.position.x + b.width &&
            a.position.x + a.width > b.position.x &&
            a.position.y < b.position.y + b.height &&
            a.position.y + a.height > b.position.y
        );
    }

    /**
     * Get the direction from entity A to entity B (center to center)
     */
    static getDirection(from: Entity, to: Entity): Vector2 {
        return to.getCenter().subtract(from.getCenter());
    }

    /**
     * Get overlap depth for push-back calculations
     */
    static getOverlapDepth(a: Entity, b: Entity): Vector2 {
        const aCenter = a.getCenter();
        const bCenter = b.getCenter();

        const dx = bCenter.x - aCenter.x;
        const dy = bCenter.y - aCenter.y;

        const overlapX = (a.width + b.width) / 2 - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 - Math.abs(dy);

        return new Vector2(
            overlapX * Math.sign(dx),
            overlapY * Math.sign(dy)
        );
    }
}

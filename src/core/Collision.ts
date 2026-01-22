import { Entity } from '../entities/Entity';
import { Wall } from '../entities/Wall';
import { Vector2 } from '../utils/Vector2';

/**
 * AABB Collision detection and resolution utilities
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

    /**
     * Resolve collision between a moving entity and a wall
     * Pushes the entity out of the wall, allowing sliding along walls
     */
    static resolveWallCollision(entity: Entity, wall: Wall): boolean {
        if (!this.checkAABB(entity, wall)) return false;

        // Calculate overlap on each axis
        const entityRight = entity.position.x + entity.width;
        const entityBottom = entity.position.y + entity.height;
        const wallRight = wall.position.x + wall.width;
        const wallBottom = wall.position.y + wall.height;

        // Calculate penetration depth on each axis
        const overlapLeft = entityRight - wall.position.x;
        const overlapRight = wallRight - entity.position.x;
        const overlapTop = entityBottom - wall.position.y;
        const overlapBottom = wallBottom - entity.position.y;

        // Find minimum overlap (the axis we need to push out on)
        const minOverlapX = overlapLeft < overlapRight ? -overlapLeft : overlapRight;
        const minOverlapY = overlapTop < overlapBottom ? -overlapTop : overlapBottom;

        // Push out on the axis with least penetration (allows sliding)
        if (Math.abs(minOverlapX) < Math.abs(minOverlapY)) {
            entity.position.x += minOverlapX;
        } else {
            entity.position.y += minOverlapY;
        }

        return true;
    }

    /**
     * Check if a point is inside a wall
     */
    static pointInWall(x: number, y: number, wall: Wall): boolean {
        return (
            x >= wall.position.x &&
            x <= wall.position.x + wall.width &&
            y >= wall.position.y &&
            y <= wall.position.y + wall.height
        );
    }

    /**
     * Check if a rectangle overlaps any wall
     */
    static rectOverlapsWalls(
        x: number,
        y: number,
        width: number,
        height: number,
        walls: Wall[]
    ): boolean {
        for (const wall of walls) {
            if (
                x < wall.position.x + wall.width &&
                x + width > wall.position.x &&
                y < wall.position.y + wall.height &&
                y + height > wall.position.y
            ) {
                return true;
            }
        }
        return false;
    }
}

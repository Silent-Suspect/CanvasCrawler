import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';

/**
 * Interactable - An entity that can be clicked/interacted with
 * Overrides shooting behavior when hovered
 */
export class Interactable extends Entity {
    public interactionRange: number = 100;
    public label: string = "Interact";
    public highlightColor: string = "#fbbf24"; // Amber-400
    public onInteract: () => void = () => { };

    protected isHovered: boolean = false;

    constructor(x: number, y: number, width: number, height: number, label: string) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.label = label;
    }

    /** Check if point is inside this entity */
    containsPoint(point: Vector2): boolean {
        return (
            point.x >= this.position.x &&
            point.x <= this.position.x + this.width &&
            point.y >= this.position.y &&
            point.y <= this.position.y + this.height
        );
    }

    /** Set hover state */
    setHovered(hovered: boolean): void {
        this.isHovered = hovered;
    }

    /** Get hover state */
    getHovered(): boolean {
        return this.isHovered;
    }

    /** Trigger interaction */
    interact(): void {
        if (this.onInteract) {
            this.onInteract();
        }
    }

    update(_dt: number): void {
        // Static mostly, but can animate if needed
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const centerX = this.position.x + this.width / 2;

        ctx.save();

        // Draw body
        ctx.fillStyle = this.isHovered ? this.highlightColor : '#6b7280'; // Gray-500 base
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = this.isHovered ? 2 : 1;
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);

        // Draw Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.label, centerX, this.position.y - 5);

        // Draw interaction tooltop if hovered
        if (this.isHovered) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.fillText('[Click]', centerX, this.position.y + this.height + 12);
        }

        ctx.restore();
    }
}

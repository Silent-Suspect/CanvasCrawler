import { Vector2 } from '../utils/Vector2';

/**
 * InputManager - Singleton class handling all keyboard and mouse input
 * Operates independently of React's render cycle
 */
export class InputManager {
    private static instance: InputManager;

    private keys: Set<string> = new Set();
    private mousePosition: Vector2 = new Vector2();
    private mouseDown: boolean = false;
    private mouseJustPressed: boolean = false;

    private canvas: HTMLCanvasElement | null = null;

    private constructor() { }

    static getInstance(): InputManager {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }

    /** Initialize event listeners on the canvas/window */
    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;

        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        // Mouse events
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mouseup', this.handleMouseUp);

        // Prevent context menu on right-click
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /** Clean up event listeners */
    destroy(): void {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);

        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        }

        this.keys.clear();
        this.mouseDown = false;
        this.mouseJustPressed = false;
    }

    /** Call at end of each frame to reset per-frame states */
    endFrame(): void {
        this.mouseJustPressed = false;
    }

    // Event handlers (arrow functions to preserve `this`)
    private handleKeyDown = (e: KeyboardEvent): void => {
        this.keys.add(e.key.toLowerCase());
    };

    private handleKeyUp = (e: KeyboardEvent): void => {
        this.keys.delete(e.key.toLowerCase());
    };

    private handleMouseMove = (e: MouseEvent): void => {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.mousePosition = new Vector2(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    };

    private handleMouseDown = (e: MouseEvent): void => {
        if (e.button === 0) { // Left mouse button
            this.mouseDown = true;
            this.mouseJustPressed = true;
        }
    };

    private handleMouseUp = (e: MouseEvent): void => {
        if (e.button === 0) {
            this.mouseDown = false;
        }
    };

    // Public query methods
    isKeyDown(key: string): boolean {
        return this.keys.has(key.toLowerCase());
    }

    getMousePosition(): Vector2 {
        return this.mousePosition.clone();
    }

    isMouseDown(): boolean {
        return this.mouseDown;
    }

    /** Returns true only on the frame the mouse was pressed */
    isMouseJustPressed(): boolean {
        return this.mouseJustPressed;
    }

    /** Get movement vector from WASD keys (normalized for diagonal) */
    getMovementVector(): Vector2 {
        let x = 0;
        let y = 0;

        if (this.isKeyDown('w') || this.isKeyDown('arrowup')) y -= 1;
        if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) y += 1;
        if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) x -= 1;
        if (this.isKeyDown('d') || this.isKeyDown('arrowright')) x += 1;

        const vec = new Vector2(x, y);
        // Normalize to prevent faster diagonal movement
        if (vec.magnitude > 0) {
            return vec.normalize();
        }
        return vec;
    }
}

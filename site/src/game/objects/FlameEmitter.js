import { GameConfig } from '../config.js';

export class FlameEmitter extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, '');
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set origin
        this.setOrigin(0.5, 0.5);
        
        // Create particle emitter for flames
        this.flameEmitter = scene.add.particles(0, 0, 'flamingMess', {
            frame: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            speed: { min: -10, max: 10 },
            gravityY: 0,
            scale: { start: 0.2, end: 0.05 },
            alpha: { start: 1, end: 0.6 },
            lifespan: 500,
            frequency: -1, // Manual emission
            emitting: false
        });
        
        // Set bounds checking
        this.body.checkWorldBounds = true;
        this.body.onWorldBounds = true;
        
        // Initially deactivated
        this.setActive(false).setVisible(false);
    }
    
    makeFire(x, y, vx, vy) {
        // Reset and activate (keep sprite invisible - only particle emitter is visible)
        this.setActive(true);
        this.setVisible(false);
        this.x = x;
        this.y = y;
        
        // Set velocity
        this.body.setVelocity(vx, vy);
        
        // Position emitter and start emitting
        this.flameEmitter.setPosition(x, y);
        this.flameEmitter.start();
        
        // Set flow parameters (emit 2 particles every 250ms for 500ms total)
        this.flameEmitter.flow(250, 2, 500);
        
        // Auto-kill after emission completes
        this.scene.time.delayedCall(500, () => {
            this.kill();
        });
    }
    
    kill() {
        // Stop emitting and destroy emitter
        if (this.flameEmitter) {
            this.flameEmitter.stop();
            this.flameEmitter.destroy();
        }
        
        this.destroy();
        return this;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Check if out of world bounds (flames fall down, so check Y too)
        if (this.active && (
            this.x < -50 || 
            this.x > this.scene.game.config.width + 50 ||
            this.y > this.scene.game.config.height + 50
        )) {
            this.kill();
            return;
        }
        
        // Update emitter position to follow sprite
        if (this.active && this.flameEmitter) {
            this.flameEmitter.setPosition(this.x, this.y);
        }
    }
}
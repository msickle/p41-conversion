import { GameConfig } from '../config.js';

export class Parachute extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, parentParatrooper) {
        super(scene, x, y, 'parachute');
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set origin and body size
        this.setOrigin(0.5, 1.5);
        this.body.setSize(this.width, this.height);
        
        // Reference to parent paratrooper
        this.parent = parentParatrooper;
        
        // Reward and properties
        this.reward = GameConfig.CHUTE_REWARD;
        
        // Add to parachutes group
        if (scene.parachutes) {
            scene.parachutes.add(this);
        }
    }
    
    onHitByBullet() {
        // Emit score event
        this.scene.events.emit('score', { amount: this.reward * 2 });
        
        // Play sound
        if (this.scene.hitParachute) {
            this.scene.hitParachute.play();
        }
        
        // Notify parent paratrooper
        if (this.parent && this.parent.active) {
            this.parent.onParachuteDestroyed();
        }
        
        // Destroy self
        this.destroy();
    }
    
    onHitByDebris() {
        // Same as bullet
        this.onHitByBullet();
    }
    
    onHitByBomb() {
        // Notify parent without score (bomb handles scoring)
        if (this.parent && this.parent.active) {
            this.parent.onParachuteDestroyed();
        }
        
        // Destroy self
        this.destroy();
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Follow parent paratrooper
        if (this.parent && this.parent.active) {
            this.setPosition(this.parent.x, this.parent.y - 8);
        } else {
            // Parent destroyed, destroy self
            this.destroy();
        }
    }
}


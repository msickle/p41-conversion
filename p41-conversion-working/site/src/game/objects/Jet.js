import { GameConfig } from '../config.js';
import { AirDebris } from './AirDebris.js';
import { Bomb } from './Bomb.js';

export class Jet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'jet');
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set origin
        this.setOrigin(0.5, 0.5);
        
        // Set reward
        this.reward = GameConfig.JET_REWARD;
        
        // Set bounds checking
        this.body.checkWorldBounds = true;
        this.body.onWorldBounds = true;
        
        // Listen for leaving world bounds
        scene.physics.world.on('worldbounds', (body) => {
            if (body.gameObject === this) {
                this.kill();
            }
        });
    }
    
    spawnJet(bombsGroup) {
        // Store reference to bombs group
        this.bombsGroup = bombsGroup;
        
        // Schedule bomb drop
        const timerValue = Phaser.Math.Between(250, 500);
        
        this.bombTimer = this.scene.time.delayedCall(timerValue, this.dropBomb, [], this);
    }
    
    dropBomb() {
        if (this.active && this.bombsGroup) {
            // Create bomb dynamically
            const bomb = new Bomb(this.scene, this.x, this.y);
            
            // Add to bombs group for collision detection
            this.bombsGroup.add(bomb);
            
            // Drop the bomb with jet's velocity
            bomb.drop(this.x, this.y, this.body.velocity.x, this.scaleX);
        }
    }
    
    kill() {
        // Spawn debris
        const spawnAmount = Phaser.Math.Between(0, GameConfig.AIR_DEBRIS_MAX_EVENT);
        
        for (let i = 0; i < spawnAmount; i++) {
            // Create air debris dynamically
            const debris = new AirDebris(this.scene, this.x, this.y);
            debris.addDebris(this.x, this.y, this.body.velocity.x, this.body.velocity.y, this.scene.airDebris);
        }
        
        // Stop timer
        if (this.bombTimer) {
            this.bombTimer.remove();
            this.bombTimer = null;
        }
        
        // Destroy sprite
        this.destroy();
        
        return this;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
    }
}


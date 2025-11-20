import { GameConfig } from '../config.js';
import { FlameEmitter } from './FlameEmitter.js';

export class AirDebris extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'airDebris', 5);
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set origin
        this.setOrigin(0.5, 0.5);
        
        // Set bounds checking
        this.body.checkWorldBounds = true;
        this.body.onWorldBounds = true;
        
        // Initially deactivated
        this.setActive(false).setVisible(false);
    }
    
    addDebris(x, y, vx, vy, airDebrisGroup) {
        // Activate and position
        this.setActive(true).setVisible(true);
        this.setPosition(x, y);
        
        // Add to group for collision detection
        if (airDebrisGroup) {
            airDebrisGroup.add(this);
        }
        
        // Random properties
        const spreadX = 42;
        const spreadY = 16;
        const rotationAmount = Phaser.Math.Between(-600, 600);
        const size = Phaser.Math.FloatBetween(0.2, 0.6);
        
        // Set velocity with random spread
        this.body.setVelocityX(vx + Phaser.Math.FloatBetween(-spreadX, spreadX));
        this.y += Phaser.Math.FloatBetween(-spreadY, spreadY);
        this.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
        this.body.setAngularVelocity(rotationAmount);
        
        // Set scale and frame
        this.setScale(size, size);
        
        // Get the frame count from the texture
        const frameCount = this.texture.frameTotal;
        
        // Set a random frame (frameTotal includes __BASE, so subtract 1)
        if (frameCount > 1) {
            const selectedFrame = Phaser.Math.Between(0, frameCount - 2);
            this.setFrame(selectedFrame);
        }
        
        // Spawn flame effect 50% of the time - create dynamically
        const flameSpawnChance = Phaser.Math.Between(1, 100);
        
        if (flameSpawnChance > 50) {
            const flame = new FlameEmitter(this.scene, this.x, this.y);
            flame.makeFire(this.x, this.y, this.body.velocity.x, this.body.velocity.y);
        }
    }
    
    kill() {
        this.destroy();
        return this;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
    }
}


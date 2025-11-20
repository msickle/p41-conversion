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
        
        // Set body size (will be updated when activated)
        this.body.setSize(this.width, this.height);
        
        // Initially deactivated
        this.setActive(false).setVisible(false);
        
        // Disable physics body when inactive
        this.body.enable = false;
    }
    
    addDebris(x, y, vx, vy, airDebrisGroup) {
        // Activate and position
        this.setActive(true).setVisible(true);
        this.setPosition(x, y);
        
        // Random properties
        const spreadX = 42;
        const spreadY = 16;
        const rotationAmount = Phaser.Math.Between(-600, 600);
        const size = Phaser.Math.FloatBetween(0.2, 0.6);
        
        // Set scale and frame first (before setting velocity, so body size is correct)
        this.setScale(size, size);
        
        // Get the frame count from the texture
        const frameCount = this.texture.frameTotal;
        
        // Set a random frame (frameTotal includes __BASE, so subtract 1)
        if (frameCount > 1) {
            const selectedFrame = Phaser.Math.Between(0, frameCount - 2);
            this.setFrame(selectedFrame);
        }
        
        // Configure physics body BEFORE adding to group
        if (this.body) {
            // Ensure body is enabled
            this.body.enable = true;
            
            // Calculate body size - ensure minimum size for collision detection
            let bodyWidth = this.width;
            let bodyHeight = this.height;
            
            // Set minimum body size to ensure collisions work even when scaled very small
            const minSize = 4;
            if (bodyWidth < minSize) bodyWidth = minSize;
            if (bodyHeight < minSize) bodyHeight = minSize;
            
            // Update body size to match scaled sprite
            this.body.setSize(bodyWidth, bodyHeight);
            // Ensure body is set to collide with everything
            this.body.setCollideWorldBounds(false);
        }
        
        // Add to group for collision detection AFTER body is configured
        if (airDebrisGroup) {
            airDebrisGroup.add(this);
        }
        
        // Set velocity with random spread
        this.body.setVelocityX(vx + Phaser.Math.FloatBetween(-spreadX, spreadX));
        this.y += Phaser.Math.FloatBetween(-spreadY, spreadY);
        this.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
        this.body.setAngularVelocity(rotationAmount);
        
        // Spawn flame effect 50% of the time - create dynamically
        const flameSpawnChance = Phaser.Math.Between(1, 100);
        
        if (flameSpawnChance > 50) {
            const flame = new FlameEmitter(this.scene, this.x, this.y);
            flame.makeFire(this.x, this.y, this.body.velocity.x, this.body.velocity.y);
        }
    }
    
    onHitHelicopter(helo) {
        // Delegate to helicopter's debris hit handler
        helo.onHitByDebris(this);
        
        // Destroy self
        this.kill();
    }
    
    onHitJet(jet) {
        // Delegate to jet's debris hit handler
        jet.onHitByDebris(this);
        
        // Destroy self
        this.kill();
    }
    
    onHitParatrooper(para) {
        // Delegate to paratrooper's debris hit handler
        para.onHitByDebris(this);
        
        // Destroy self
        this.kill();
    }
    
    onHitGround() {
        // Just destroy self
        this.kill();
    }
    
    kill() {
        this.destroy();
        return this;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Check if out of world bounds (debris falls down, so check Y too)
        if (this.active && (
            this.x < -50 || 
            this.x > this.scene.game.config.width + 50 ||
            this.y > this.scene.game.config.height + 50
        )) {
            this.kill();
        }
    }
}


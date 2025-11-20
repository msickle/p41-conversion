import { GameConfig } from '../config.js';

export class Paratrooper extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'paratrooper');
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set origin
        this.setOrigin(0.5, 0.5);
        
        // Physics properties
        this.downwardPull = GameConfig.TERMINAL_VELOCITY * GameConfig.PARACHUTE_DESCENT_MULTIPLIER;
        this.maxImpactVelocity = GameConfig.TERMINAL_VELOCITY * GameConfig.PARATROOPER_IMPACT_VELOCITY_LIMIT;
        
        // State flags
        this.jumped = false;
        this.onGround = false;
        this.deployedChute = false;
        this.chuteDestroyed = false;
        
        // Create parachute as separate sprite (positioned relative to paratrooper)
        this.myChute = scene.add.sprite(0, 0, 'parachute');
        scene.physics.add.existing(this.myChute);
        this.myChute.setOrigin(0.5, 1.5);
        this.myChute.reward = GameConfig.CHUTE_REWARD;
        this.myChute.parent = this; // Reference back to parent
        
        // Kill chute initially
        this.myChute.setActive(false).setVisible(false);
        
        // Set reward
        this.reward = GameConfig.PARA_REWARD;
        
        // Set bounds checking
        this.body.setCollideWorldBounds(false);
        this.body.checkWorldBounds = true;
        this.body.onWorldBounds = true;
        
        // Listen for leaving world bounds
        scene.physics.world.on('worldbounds', (body) => {
            if (body.gameObject === this) {
                this.kill();
            }
        });
    }
    
    jump() {
        this.jumped = true;
        this.onGround = false;
        this.chuteDestroyed = false;
        
        this.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
        
        // Schedule chute deployment
        const timerValue = Phaser.Math.Between(250, 500);
        this.deployChuteTimer = this.scene.time.delayedCall(timerValue, this.deployChute, [], this);
    }
    
    deployChute() {
        this.myChute.setActive(true).setVisible(true);
        this.myChute.setPosition(this.x, this.y - 8);
        this.deployedChute = true;
        this.body.setVelocityY(this.downwardPull);
        this.body.setDragX(10);
    }
    
    hitGround() {
        if (this.body.velocity.y > this.maxImpactVelocity) {
            this.killChute();
            this.kill();
            return false;
        }
        
        this.body.setVelocity(0, 0);
        this.onGround = true;
        
        if (this.myChute.active) {
            this.killChute();
        }
        
        return true;
    }
    
    killChute(chuteOnly = false) {
        if (this.myChute.active) {
            this.myChute.setActive(false).setVisible(false);
            this.chuteDestroyed = true;
            
            if (chuteOnly) {
                this.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
            }
        }
    }
    
    kill() {
        // Custom kill method to handle paratrooper-specific cleanup
        
        // Clear any pending timers
        if (this.deployChuteTimer) {
            this.deployChuteTimer.remove();
            this.deployChuteTimer = null;
        }
        
        // Destroy chute
        if (this.myChute) {
            this.myChute.destroy();
        }
        
        // Destroy paratrooper
        this.destroy();
        
        return this;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Update chute position to follow paratrooper
        if (this.myChute.active) {
            this.myChute.setPosition(this.x, this.y - 8);
        }
    }
}


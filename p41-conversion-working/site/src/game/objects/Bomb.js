import { GameConfig } from '../config.js';

export class Bomb extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bomb');
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set origin
        this.setOrigin(0.5, 0.5);
        
        // Set reward
        this.reward = GameConfig.BOMB_REWARD;
        
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
    
    drop(jetX, jetY, jetVelocityX, jetScaleX) {
        // Position below jet
        this.setPosition(jetX, jetY + 32);
        this.angle = 0;
        
        // Set scale to match jet direction
        this.setScale(jetScaleX, 1);
        
        // Set velocity - horizontal from jet, vertical at terminal velocity
        this.body.setVelocityX(jetVelocityX);
        this.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
        
        // Add rotation tween
        this.scene.tweens.add({
            targets: this,
            angle: 45 * jetScaleX,
            duration: 2000,
            ease: 'Linear'
        });
    }
    
    kill() {
        // Destroy the bomb
        this.destroy();
        
        return this;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
    }
}


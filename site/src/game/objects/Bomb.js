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
    
    onHitByBullet() {
        // Trigger explosion at bomb position
        this.explode();
        
        // Emit score event
        this.scene.events.emit('score', { amount: this.reward });
        
        // Destroy bomb
        this.destroy();
    }
    
    onHitEnemy(enemy) {
        // Trigger explosion at bomb position
        this.explode();
        
        // Destroy bomb
        this.destroy();
    }
    
    onHitGround() {
        // Trigger explosion at bomb position
        this.explode();
        
        // Destroy bomb
        this.destroy();
    }
    
    explode() {
        // Create explosion dynamically at bomb position
        const explosion = this.scene.physics.add.sprite(this.x, this.y, 'explosion');
        explosion.setOrigin(0.5, 0.5);
        
        // Play explosion animation
        explosion.play('boom');
        
        // Bomb explosions don't inherit velocity (they're stationary)
        
        // Destroy explosion after animation completes
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });
        
        // Play explosion sound
        if (this.scene.sfxExplosion001) {
            this.scene.sfxExplosion001.play();
        }
    }
    
    kill() {
        // Destroy the bomb
        this.destroy();
        
        return this;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Check if out of world bounds (bombs fall down, so check Y too)
        if (this.active && (
            this.x < -50 || 
            this.x > this.scene.game.config.width + 50 ||
            this.y > this.scene.game.config.height + 50
        )) {
            this.kill();
        }
    }
}


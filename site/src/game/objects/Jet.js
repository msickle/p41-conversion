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
        
        // Set physics body size to match sprite
        this.body.setSize(this.width, this.height);
        
        // Set reward
        this.reward = GameConfig.JET_REWARD;
        
        // Set bounds checking
        this.body.checkWorldBounds = true;
        this.body.onWorldBounds = true;
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
            // Convert flipX to scaleX value (-1 if flipped, 1 if not)
            const scaleX = this.flipX ? -1 : 1;
            bomb.drop(this.x, this.y, this.body.velocity.x, scaleX);
        }
    }
    
    onHitByBullet() {
        // Trigger explosion
        this.explode();
        
        // Spawn debris
        this.spawnDebris();
        
        // Emit score event
        this.scene.events.emit('score', { amount: this.reward });
        
        // Kill jet
        this.kill();
    }
    
    onHitByDebris(debris) {
        // Trigger explosion
        this.explode();
        
        // Spawn debris
        this.spawnDebris();
        
        // Emit doubled score event
        this.scene.events.emit('score', { amount: this.reward * 2 });
        
        // Kill jet
        this.kill();
    }
    
    explode() {
        // Create explosion dynamically
        const explosion = this.scene.physics.add.sprite(this.x, this.y, 'explosion');
        explosion.setOrigin(0.5, 0.5);
        
        // Play explosion animation
        explosion.play('boom');
        
        // Make explosion move with jet velocity
        if (this.body) {
            explosion.body.setVelocity(this.body.velocity.x, this.body.velocity.y);
        }
        
        // Destroy explosion after animation completes
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });
        
        // Play explosion sound
        if (this.scene.sfxExplosion001) {
            this.scene.sfxExplosion001.play();
        }
    }
    
    spawnDebris() {
        const spawnAmount = Phaser.Math.Between(0, GameConfig.AIR_DEBRIS_MAX_EVENT);
        
        for (let i = 0; i < spawnAmount; i++) {
            // Create air debris dynamically
            const debris = new AirDebris(this.scene, this.x, this.y);
            debris.addDebris(this.x, this.y, this.body.velocity.x, this.body.velocity.y, this.scene.airDebris);
        }
    }
    
    kill() {
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
        
        // Check if out of world bounds
        if (this.active && (this.x < -50 || this.x > this.scene.game.config.width + 50)) {
            this.kill();
        }
    }
}


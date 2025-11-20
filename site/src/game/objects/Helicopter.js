import { GameConfig } from '../config.js';
import { AirDebris } from './AirDebris.js';
import { Paratrooper } from './Paratrooper.js';

export class Helicopter extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'heloEnemy001');
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set origin
        this.setOrigin(0.5, 0.5);
        
        // Set physics body size to match sprite
        this.body.setSize(this.width, this.height);
        
        // Set reward
        this.reward = GameConfig.HELO_REWARD;
        
        // Set bounds checking
        this.body.checkWorldBounds = true;
        this.body.onWorldBounds = true;
        
        // Create animation
        if (!scene.anims.exists('helo_fly')) {
            scene.anims.create({
                key: 'helo_fly',
                frames: scene.anims.generateFrameNumbers('heloEnemy001', { start: 0, end: 2 }),
                frameRate: 20,
                repeat: -1
            });
        }
    }
    
    spawnHelo(paratroopersGroup) {
        // Play flying animation
        this.play('helo_fly');
        
        // Store reference to paratroopers group
        this.paratroopersGroup = paratroopersGroup;
        
        // Set up timer to spawn paratroopers
        const timerValue = Phaser.Math.Between(1500, 6000);
        
        this.jumpTimer = this.scene.time.addEvent({
            delay: timerValue,
            callback: this.spawnPara,
            callbackScope: this,
            loop: true
        });
    }
    
    spawnPara() {
        if (this.active && this.paratroopersGroup) {
            // Create paratrooper dynamically
            const para = new Paratrooper(this.scene, this.x, this.y + 32);
            para.body.setVelocityX(this.body.velocity.x);
            this.paratroopersGroup.add(para);
            
            para.jump();
        }
    }
    
    onHitByBullet() {
        // Trigger explosion
        this.explode();
        
        // Spawn debris
        this.spawnDebris();
        
        // Emit score event
        this.scene.events.emit('score', { amount: this.reward });
        
        // Kill helicopter
        this.kill();
    }
    
    onHitByDebris(debris) {
        // Trigger explosion
        this.explode();
        
        // Spawn debris
        this.spawnDebris();
        
        // Emit doubled score event
        this.scene.events.emit('score', { amount: this.reward * 2 });
        
        // Kill helicopter
        this.kill();
    }
    
    explode() {
        // Create explosion dynamically
        const explosion = this.scene.physics.add.sprite(this.x, this.y, 'explosion');
        explosion.setOrigin(0.5, 0.5);
        
        // Play explosion animation
        explosion.play('boom');
        
        // Make explosion move with helicopter velocity
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
        if (this.jumpTimer) {
            this.jumpTimer.remove();
            this.jumpTimer = null;
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


import { GameConfig } from '../config.js';
import { Parachute } from './Parachute.js';

export class Paratrooper extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'paratrooper');
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set origin
        this.setOrigin(0.5, 0.5);
        
        // Set physics body size to match sprite
        this.body.setSize(this.width, this.height);
        
        // Physics properties
        this.downwardPull = GameConfig.TERMINAL_VELOCITY * GameConfig.PARACHUTE_DESCENT_MULTIPLIER;
        this.maxImpactVelocity = GameConfig.TERMINAL_VELOCITY * GameConfig.PARATROOPER_IMPACT_VELOCITY_LIMIT;
        
        // State flags
        this.jumped = false;
        this.onGround = false;
        
        // Parachute reference (set when parachute spawns)
        this.parachute = null;
        
        // Set reward
        this.reward = GameConfig.PARA_REWARD;
        
        // Set bounds checking
        this.body.setCollideWorldBounds(false);
        this.body.checkWorldBounds = true;
        this.body.onWorldBounds = true;
        
        // Setup gore emitter (create once per scene, shared by all paratroopers)
        if (!scene.goreEmitter) {
            this.setupGoreEmitter();
        }
    }
    
    setupGoreEmitter() {
        // Create a simple red circle texture for gore particles
        const goreGraphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        goreGraphics.fillStyle(0x8B0000, 1); // Dark red color
        goreGraphics.fillCircle(4, 4, 4); // 8x8 circle
        goreGraphics.generateTexture('goreParticle', 8, 8);
        goreGraphics.destroy();
        
        this.scene.goreEmitter = this.scene.add.particles(0, 0, 'goreParticle', {
            speed: { min: 40, max: 120 },
            angle: { min: 0, max: 360 },
            gravityY: 200,
            scale: { start: 1.0, end: 0.3 },
            alpha: { start: 1, end: 0.3 },
            tint: [0x8B0000, 0xA52A2A, 0xDC143C, 0xB22222], // Various shades of red
            lifespan: 600,
            frequency: -1,
            emitting: false
        });
        
        // Set depth to ensure gore particles are visible above other sprites
        this.scene.goreEmitter.setDepth(10000);
    }
    
    spawnGore() {
        const particleCount = Phaser.Math.Between(7, 18);
        this.scene.goreEmitter.setPosition(this.x, this.y);
        this.scene.goreEmitter.explode(particleCount);
        
        // Play thwack sound
        if (this.scene.thwack) {
            this.scene.thwack.play();
        }
    }
    
    jump() {
        this.jumped = true;
        this.onGround = false;
        
        // Start falling immediately at terminal velocity
        this.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
        
        // Schedule parachute spawn after 0.2-0.8 seconds (200-800ms)
        const timerValue = Phaser.Math.Between(200, 800);
        this.spawnParachuteTimer = this.scene.time.delayedCall(timerValue, this.spawnParachute, [], this);
    }
    
    spawnParachute() {
        // Only spawn parachute if paratrooper is still active and hasn't landed
        if (this.active && !this.onGround) {
            // Create new parachute
            this.parachute = new Parachute(this.scene, this.x, this.y - 8, this);
            
            // Slow down fall speed
            this.body.setVelocityY(this.downwardPull);
            this.body.setDragX(10);
        }
    }
    
    onParachuteDestroyed() {
        // Called by parachute when it's destroyed
        this.parachute = null;
        
        // Increase fall speed back to terminal velocity
        this.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
        this.body.setDragX(0);
    }
    
    onHitByBullet() {
        // Spawn gore effect
        this.spawnGore();
        
        // Emit score event
        this.scene.events.emit('score', { amount: this.reward });
        
        // Kill paratrooper
        this.kill();
    }
    
    onHitByDebris(debris) {
        // Spawn gore effect
        this.spawnGore();
        
        // Emit doubled score event
        this.scene.events.emit('score', { amount: this.reward * 2 });
        
        // Kill paratrooper
        this.kill();
    }
    
    onHitByBomb(bomb) {
        // Spawn gore effect
        this.spawnGore();
        
        // Emit score event
        this.scene.events.emit('score', { amount: this.reward });
        
        // Kill paratrooper
        this.kill();
    }
    
    onCollideWithPara(otherPara) {
        // Only process if both are active and not the same
        if (!this.active || !otherPara.active || this === otherPara) {
            return;
        }
        
        // If neither is on ground, just destroy both chutes
        if (!this.onGround && !otherPara.onGround) {
            if (this.parachute && this.parachute.active) {
                this.parachute.destroy();
                this.parachute = null;
                this.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
            }
            if (otherPara.parachute && otherPara.parachute.active) {
                otherPara.parachute.destroy();
                otherPara.parachute = null;
                otherPara.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
            }
            return;
        }
        
        // If either is falling fast, kill both with gore
        if (this.body.velocity.y > this.downwardPull * 2 || 
            otherPara.body.velocity.y > otherPara.downwardPull * 2) {
            // Spawn gore for both paratroopers
            this.spawnGore();
            otherPara.spawnGore();
            
            // Emit combined score
            this.scene.events.emit('score', { amount: this.reward * 4 });
            
            // Kill both
            this.kill();
            otherPara.kill();
        }
    }
    
    hitGround() {
        if (this.body.velocity.y > this.maxImpactVelocity) {
            // Spawn gore and emit doubled score
            this.spawnGore();
            this.scene.events.emit('score', { amount: this.reward * 2 });
            
            this.kill();
            return false;
        }
        
        this.body.setVelocity(0, 0);
        this.onGround = true;
        
        // Destroy parachute if it exists
        if (this.parachute && this.parachute.active) {
            this.parachute.destroy();
            this.parachute = null;
        }
        
        return true;
    }
    
    kill() {
        // Custom kill method to handle paratrooper-specific cleanup
        
        // Clear any pending timers
        if (this.spawnParachuteTimer) {
            this.spawnParachuteTimer.remove();
            this.spawnParachuteTimer = null;
        }
        
        // Destroy parachute if it exists
        if (this.parachute && this.parachute.active) {
            this.parachute.destroy();
            this.parachute = null;
        }
        
        // Destroy paratrooper
        this.destroy();
        
        return this;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        // Check if out of world bounds (paratroopers fall down, so check Y too)
        if (this.active && (
            this.x < -50 || 
            this.x > this.scene.game.config.width + 50 ||
            this.y > this.scene.game.config.height + 50
        )) {
            this.kill();
        }
    }
}

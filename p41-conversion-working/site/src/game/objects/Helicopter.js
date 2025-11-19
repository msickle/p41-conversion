import { GameConfig } from '../config.js';

export class Helicopter extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'heloEnemy001');
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set origin
        this.setOrigin(0.5, 0.5);
        
        // Spawn timing
        this.paraSpawnDelay = Phaser.Math.Between(500, 1200);
        this.nextParatrooperSpawn = 0;
        
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
    
    spawnHelo(paraPool) {
        // Play flying animation
        this.play('helo_fly');
        
        // Set up timer to spawn paratroopers
        const timerValue = Phaser.Math.Between(1500, 3000);
        
        this.jumpTimer = this.scene.time.addEvent({
            delay: timerValue,
            callback: this.spawnPara,
            args: [paraPool],
            callbackScope: this,
            loop: true
        });
    }
    
    spawnPara(paraPool) {
        if (this.active && paraPool) {
            // Get first dead paratrooper from pool
            const para = paraPool.getFirstDead();
            
            if (para) {
                para.setActive(true).setVisible(true);
                para.x = this.x;
                para.y = this.y + 32;
                para.body.setVelocityX(this.body.velocity.x);
                
                para.jump();
            }
        }
    }
    
    kill() {
        // Get reference to scene's debris pool
        const g = this.scene.gameState;
        
        // Spawn debris
        const spawnAmount = Phaser.Math.Between(0, GameConfig.AIR_DEBRIS_MAX_EVENT);
        
        if (this.body && this.body.world && g && g.airDebrisPool) {
            for (let i = 0; i < spawnAmount; i++) {
                const debris = g.airDebrisPool.getFirstDead();
                if (debris) {
                    debris.addDebris(this.x, this.y, this.body.velocity.x, this.body.velocity.y);
                }
            }
        }
        
        // Stop timer
        if (this.jumpTimer) {
            this.jumpTimer.remove();
            this.jumpTimer = null;
        }
        
        // Deactivate sprite
        this.setActive(false);
        this.setVisible(false);
        
        return this;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
    }
}


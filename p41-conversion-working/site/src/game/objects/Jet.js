import { GameConfig } from '../config.js';

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
    }
    
    spawnJet(bombPool) {
        // Schedule bomb drop
        const timerValue = Phaser.Math.Between(250, 500);
        
        this.bombTimer = this.scene.time.delayedCall(timerValue, this.dropBomb, [bombPool], this);
    }
    
    dropBomb(bombPool) {
        if (this.active && bombPool) {
            // Get first dead bomb from pool
            const bomb = bombPool.getFirstDead();
            
            if (bomb) {
                bomb.setActive(true).setVisible(true);
                bomb.angle = 0;
                bomb.x = this.x;
                bomb.y = this.y + 32;
                bomb.body.setVelocityX(this.body.velocity.x);
                bomb.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
                bomb.setScale(this.scaleX, this.scaleY);
                
                // Add rotation tween
                this.scene.tweens.add({
                    targets: bomb,
                    angle: 45 * bomb.scaleX,
                    duration: 2000,
                    ease: 'Linear'
                });
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
        if (this.bombTimer) {
            this.bombTimer.remove();
            this.bombTimer = null;
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


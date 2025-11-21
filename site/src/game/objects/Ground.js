import { GameConfig } from '../config.js';

export class Ground extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'ground2');
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set origin and display size
        this.setOrigin(0.5, 0);
        this.setDisplaySize(scene.game.config.width, 50);
        
        // Physics properties
        this.body.setVelocity(0, 0);
        this.body.immovable = true;
        
        // Game state tracking
        this.landedEnemyCount = 0;
        this.maxLandedEnemies = GameConfig.MAX_LANDED_ENEMIES || 10; // Default to 10 if not configured
    }
    
    getBody() {
        return this.body;
    }
    
    onParatrooperLanded(paratrooper) {
        // Increment landed enemy counter
        this.landedEnemyCount++;
        
        // Check for game over condition
        if (this.landedEnemyCount >= this.maxLandedEnemies) {
            this.scene.events.emit('gameOver', { reason: 'too_many_enemies' });
        }
        
        // Log for debugging
        //console.log(`[GROUND] Paratrooper landed. Count: ${this.landedEnemyCount}/${this.maxLandedEnemies}`);
    }
    
    onHitByDebris(debris) {
        // Visual impact effect placeholder
        // Future: Add dust particles, screen shake, etc.
        //console.log('[GROUND] Hit by debris at', debris.x, debris.y);
        
        // Destroy the debris
        if (debris.active && typeof debris.onHitGround === 'function') {
            debris.onHitGround();
        }
    }
    
    onHitByBomb(bomb) {
        // Visual impact effect placeholder
        // Future: Add explosion crater, screen shake, damage tracking
        console.log('[GROUND] Hit by bomb at', bomb.x, bomb.y);
        
        // Let the bomb handle its own destruction and effects
        if (bomb.active && typeof bomb.onHitGround === 'function') {
            bomb.onHitGround();
        }
    }
    
    getLandedEnemyCount() {
        return this.landedEnemyCount;
    }
    
    resetLandedCount() {
        this.landedEnemyCount = 0;
    }
}


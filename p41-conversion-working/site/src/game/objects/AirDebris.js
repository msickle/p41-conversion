import { GameConfig } from '../config.js';

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
        
        // Initially deactivated
        this.setActive(false).setVisible(false);
    }
    
    addDebris(x, y, vx, vy) {
        // Reset and activate
        this.setActive(true).setVisible(true);
        this.x = x;
        this.y = y;
        
        // Random properties
        const spreadX = 42;
        const spreadY = 16;
        const rotationAmount = Phaser.Math.Between(-600, 600);
        const size = Phaser.Math.FloatBetween(0.2, 0.6);
        
        // Set velocity with random spread
        this.body.setVelocityX(vx + Phaser.Math.FloatBetween(-spreadX, spreadX));
        this.y += Phaser.Math.FloatBetween(-spreadY, spreadY);
        this.body.setVelocityY(GameConfig.TERMINAL_VELOCITY);
        this.body.setAngularVelocity(rotationAmount);
        
        // Set scale and frame
        this.setScale(size, size);
        
        // Get the actual frame count from the texture
        // In Phaser 3, we need to check the actual frames available
        const frames = this.texture.getFrameNames();
        // Filter out __BASE and other special frames, get numeric frames only
        const numericFrames = frames.filter(f => !isNaN(f)).map(f => parseInt(f));
        const maxFrame = numericFrames.length > 0 ? Math.max(...numericFrames) : 0;
        
        if (maxFrame > 0) {
            this.setFrame(Phaser.Math.Between(0, maxFrame));
        }
        
        // Spawn flame effect 50% of the time
        const flameSpawnChance = Phaser.Math.Between(1, 100);
        
        if (flameSpawnChance > 50) {
            const g = this.scene.gameState;
            if (g && g.flamePool) {
                const flame = g.flamePool.getFirstDead();
                if (flame) {
                    flame.makeFire(this.x, this.y, this.body.velocity.x, this.body.velocity.y);
                }
            }
        }
    }
    
    kill() {
        this.setActive(false);
        this.setVisible(false);
        
        return this;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
    }
}


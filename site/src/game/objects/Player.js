import { GameConfig } from '../config.js';

export class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        
        // Add to scene
        scene.add.existing(this);
        
        // Create gun barrel
        this.gunBarrel = scene.add.sprite(0, -38, 'gunBarrel');
        this.gunBarrel.setOrigin(0.5, 1);
        this.add(this.gunBarrel);
        
        // Create muzzle flash (positioned separately, will rotate with barrel calculations)
        this.muzzleFlash = scene.add.sprite(0, 0, 'gunMuzzleFlash');
        this.muzzleFlash.setFrame(4);
        this.muzzleFlash.setOrigin(0.5, 0.5);
        this.add(this.muzzleFlash);
        
        // Create muzzle flash animations
        this.createMuzzleFlashAnimations();
        
        // Create muzzle smoke particle emitter (stays at origin, we emit at specific positions)
        // This ensures particles don't follow the gun as it moves
        this.muzzleSmoke = scene.add.particles(0, 0, 'smokePuff', {
            speed: { min: 10, max: 30 },
            angle: { min: 260, max: 280 }, // Mostly upward
            gravityY: -100,
            scale: { start: 0.1, end: 0.3 },
            alpha: { start: .5, end: 0.05 },
            lifespan: 3000,
            frequency: -1,
            emitting: false
        });
        
        // Create gun mantle (base)
        this.gunMantle = scene.add.sprite(0, -40, 'gunMantle');
        this.gunMantle.setOrigin(0.5, 0.5);
        this.add(this.gunMantle);
        
        // Shot timing
        this.nextShotAt = 0;
        this.shotDelay = GameConfig.SHOT_DELAY;
        
        // Load sound effects
        this.gunshotSounds = [
            scene.sound.add('shoot1'),
            scene.sound.add('shoot2'),
            scene.sound.add('shoot3'),
            scene.sound.add('shoot4')
        ];
        
        // Store scene reference
        this.scene = scene;
    }
    
    createMuzzleFlashAnimations() {
        // Create animations for muzzle flash
        if (!this.scene.anims.exists('fire1')) {
            this.scene.anims.create({
                key: 'fire1',
                frames: this.scene.anims.generateFrameNumbers('gunMuzzleFlash', { frames: [0, 1, 2, 3, 4] }),
                frameRate: 30,
                hideOnComplete: true
            });
            this.scene.anims.create({
                key: 'fire2',
                frames: this.scene.anims.generateFrameNumbers('gunMuzzleFlash', { frames: [3, 2, 1, 0, 4] }),
                frameRate: 30,
                hideOnComplete: true
            });
            this.scene.anims.create({
                key: 'fire3',
                frames: this.scene.anims.generateFrameNumbers('gunMuzzleFlash', { frames: [2, 1, 4] }),
                frameRate: 30,
                hideOnComplete: true
            });
            this.scene.anims.create({
                key: 'fire4',
                frames: this.scene.anims.generateFrameNumbers('gunMuzzleFlash', { frames: [0, 4, 2, 1, 4] }),
                frameRate: 30,
                hideOnComplete: true
            });
        }
    }
    
    rotateLeft() {
        this.gunBarrel.angle -= GameConfig.GUN_BARREL_ROTATION_SPEED;
        
        // Clamp rotation
        if (this.gunBarrel.angle < -GameConfig.GUN_BARREL_ROTATION_LIMIT) {
            this.gunBarrel.angle = -GameConfig.GUN_BARREL_ROTATION_LIMIT;
        }
    }
    
    rotateRight() {
        this.gunBarrel.angle += GameConfig.GUN_BARREL_ROTATION_SPEED;
        
        // Clamp rotation
        if (this.gunBarrel.angle > GameConfig.GUN_BARREL_ROTATION_LIMIT) {
            this.gunBarrel.angle = GameConfig.GUN_BARREL_ROTATION_LIMIT;
        }
    }
    
    updateMuzzleFlashPosition() {
        // Calculate muzzle flash position at tip of gun barrel
        const gunAngle = this.gunBarrel.angle - 90;
        const gunAngleRads = Phaser.Math.DegToRad(gunAngle);
        const barrelLength = 46;
        
        const flashX = Math.cos(gunAngleRads) * barrelLength;
        const flashY = this.gunBarrel.y + Math.sin(gunAngleRads) * barrelLength;
        
        this.muzzleFlash.setPosition(flashX, flashY);
        this.muzzleFlash.setRotation(gunAngleRads);
    }
    
    fire(time) {
        if (this.nextShotAt > time) {
            return null;
        }
        
        this.nextShotAt = time + this.shotDelay;
        
        // Calculate bullet starting position and velocity
        const gunAngle = this.gunBarrel.angle - 90;
        const gunAngleRads = Phaser.Math.DegToRad(gunAngle);
        
        // Add slight random spread
        const gunAngleSlop = Phaser.Math.FloatBetween(-0.05, 0.05);
        const finalAngle = gunAngleRads + gunAngleSlop;
        
        // Calculate bullet start position (at end of barrel)
        const angleOffsetModifier = -32;
        const gunAngleX = Math.cos(finalAngle) * angleOffsetModifier;
        const gunAngleY = Math.sin(finalAngle) * angleOffsetModifier;
        const bulletStartX = this.x + this.gunMantle.x - gunAngleX;
        const bulletStartY = this.y + this.gunMantle.y - gunAngleY;
        
        // Calculate bullet velocity using finalAngle (already in radians)
        const vx = Math.cos(finalAngle) * GameConfig.FRIENDLY_BULLET_SPEED;
        const vy = Math.sin(finalAngle) * GameConfig.FRIENDLY_BULLET_SPEED;
        
        // Play muzzle flash animation
        const randomValue = Phaser.Math.Between(1, 4);
        const animationSelection = 'fire' + randomValue;
        this.muzzleFlash.setVisible(true);
        this.muzzleFlash.setFrame(0);  // Reset to first frame
        this.muzzleFlash.play(animationSelection);

        // Position and emit muzzle smoke at barrel tip
        const smokeBarrelLength = 44;
        const smokeX = this.x + Math.cos(gunAngleRads) * smokeBarrelLength;
        const smokeY = this.y + this.gunBarrel.y + Math.sin(gunAngleRads) * smokeBarrelLength;
        
        // Emit particles at the barrel tip without moving the emitter
        this.muzzleSmoke.emitParticleAt(smokeX, smokeY, 4);
        
        // Play gunshot sound
        const shotSelection = Phaser.Math.Between(0, this.gunshotSounds.length - 1);
        this.gunshotSounds[shotSelection].play();
        
        // Return bullet spawn data
        return {
            x: bulletStartX,
            y: bulletStartY,
            vx: vx,
            vy: vy
        };
    }
    
    getBarrelAngle() {
        return this.gunBarrel.angle;
    }
    
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    update(time, delta) {
        // Update muzzle flash position
        this.updateMuzzleFlashPosition();
    }
}


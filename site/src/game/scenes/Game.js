import { GameConfig } from '../config.js';
import { Helicopter } from '../objects/Helicopter.js';
import { Jet } from '../objects/Jet.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        
        // Game state object to share between objects
        this.gameState = {};
    }

    preload() {
        // Enable advanced timing for FPS display
        this.time.advancedTiming = true;
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor(GameConfig.STATE_BG_COLOR_GAME);
        
        // Create keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.quitKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.hitboxKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
        
        // Pause state
        this.isPaused = false;
        
        // Hitbox debug state
        this.showHitboxes = false;
        this.hitboxGraphics = this.add.graphics();
        this.hitboxGraphics.setDepth(100000); // Always on top
        
        // Setup game systems
        this.setupBackground();
        this.setupText();
        this.setupPlayer();
        this.setupBullets();
        this.setupPyro();
        this.setupEnemies();
        this.setupAudio();
        
        // Start spawning enemies
        this.spawnEnemies();
        
        // Play ambient music
        if (this.bassReverbClip) {
            this.bassReverbClip.play();
        }
        
        // Setup event listeners for game objects
        this.events.on('score', (data) => this.addToScore(data.amount));
        
    }

    setupBackground() {
        // Create scrolling background
        this.sky = this.add.tileSprite(
            0, 
            0, 
            this.game.config.width, 
            this.game.config.height, 
            'bgTest'
        );
        this.sky.setOrigin(0, 0);
        this.sky.setTileScale(40, 1);
        // Phaser 3 doesn't have autoScroll - use tilePositionY in update
        this.skyScrollSpeed = GameConfig.AUTOSCROLL_SPEED;
    }

    setupText() {
        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 3;
        
        // Instructions text
        this.instructions = this.add.text(
            centerX,
            centerY,
            'Left and right arrows to move the gun.\n\nPress Z to fire.\n',
            { font: '16px monospace', fill: '#923', align: 'center' }
        );
        this.instructions.setOrigin(0.5, 0.5);
        this.instructionsExpire = this.time.now + GameConfig.INSTRUCTION_EXPIRE;
        
        // Score text
        this.score = 0;
        this.scoreText = this.add.text(
            centerX,
            15,
            '' + this.score,
            { font: '14px monospace', fill: '#eed', align: 'center' }
        );
        this.scoreText.setOrigin(0.5, 0.5);
        
        // Pause text
        this.pauseText = this.add.text(
            centerX,
            centerY,
            'PAUSED\n\nPress P to resume',
            { font: '24px monospace', fill: '#fff', align: 'center' }
        );
        this.pauseText.setOrigin(0.5, 0.5);
        this.pauseText.setVisible(false);
        this.pauseText.setDepth(10000);
    }

    addToScore(reward) {
        this.score += reward;
        this.scoreText.setText(this.score);
    }

    setupPlayer() {
        // Create ground sprite
        this.player = this.physics.add.sprite(
            this.game.config.width / 2,
            this.game.config.height - 24,
            'ground2'
        );
        this.player.setOrigin(0.5, 0);
        this.player.body.setVelocity(0, 0);
        this.player.setDisplaySize(this.game.config.width, 50);
        this.player.body.immovable = true;
        
        // Create gun barrel
        this.gunBarrel = this.add.sprite(
            this.game.config.width / 2,
            this.game.config.height - 38,
            'gunBarrel'
        );
        this.gunBarrel.setOrigin(0.5, 1);
        
        // Create muzzle flash (positioned separately, will rotate with barrel calculations)
        this.muzzleFlash = this.add.sprite(0, 0, 'gunMuzzleFlash');
        this.muzzleFlash.setFrame(4);
        this.muzzleFlash.setOrigin(0.5, 0.5);
        
        // Create animations for muzzle flash
        if (!this.anims.exists('fire1')) {
            this.anims.create({
                key: 'fire1',
                frames: this.anims.generateFrameNumbers('gunMuzzleFlash', { frames: [0, 1, 2, 3, 4] }),
                frameRate: 30,
                hideOnComplete: true
            });
            this.anims.create({
                key: 'fire2',
                frames: this.anims.generateFrameNumbers('gunMuzzleFlash', { frames: [3, 2, 1, 0, 4] }),
                frameRate: 30,
                hideOnComplete: true
            });
            this.anims.create({
                key: 'fire3',
                frames: this.anims.generateFrameNumbers('gunMuzzleFlash', { frames: [2, 1, 4] }),
                frameRate: 30,
                hideOnComplete: true
            });
            this.anims.create({
                key: 'fire4',
                frames: this.anims.generateFrameNumbers('gunMuzzleFlash', { frames: [0, 4, 2, 1, 4] }),
                frameRate: 30,
                hideOnComplete: true
            });
        }
        
        // Create muzzle smoke particle emitter (stays at origin, we emit at specific positions)
        // This ensures particles don't follow the gun as it moves
        this.muzzleSmoke = this.add.particles(0, 0, 'smokePuff', {
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
        this.gunMantle = this.add.sprite(
            this.game.config.width / 2,
            this.game.config.height - 40,
            'gunMantle'
        );
        this.gunMantle.setOrigin(0.5, 0.5);
    }

    setupBullets() {
        // Create group to hold bullets (for collision detection)
        this.bullets = this.physics.add.group();
        
        // Shot timing
        this.nextShotAt = 0;
        this.shotDelay = GameConfig.SHOT_DELAY;
    }

    setupPyro() {
        // Create explosion animation
        if (!this.anims.exists('boom')) {
            this.anims.create({
                key: 'boom',
                frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 2 }),
                frameRate: 15,
                repeat: 0,
                hideOnComplete: true
            });
        }
    }

    setupEnemies() {
        // Paratrooper group (for collision detection) - using physics group for better collision detection
        this.paratroopers = this.physics.add.group({ runChildUpdate: true });
        
        // Parachute group (for collision detection)
        this.parachutes = this.physics.add.group();
        
        // Helicopter group (for collision detection only) - using physics group
        this.helicopters = this.physics.add.group({ runChildUpdate: true });
        this.nextHeloAt = 0;
        this.heloDelay = GameConfig.HELO_SPAWN_DELAY;
        
        // Jet group (for collision detection only) - using physics group
        this.jets = this.physics.add.group({ runChildUpdate: true });
        this.nextJetAt = 4000;
        this.jetDelay = GameConfig.JET_SPAWN_DELAY;
        
        // Bomb group (for collision detection only)
        this.bombs = this.physics.add.group();
        
        // Air debris group (for collision detection only)
        this.airDebris = this.physics.add.group();
    }

    setupAudio() {
        // Load sound effects
        this.sfxExplosion001 = this.sound.add('explosion1');
        this.hitParachute = this.sound.add('hit-parachute');
        this.falling = this.sound.add('falling');
        this.bassReverbClip = this.sound.add('bassReverbClip', { loop: true });
        this.thwack = this.sound.add('thwack');
        
        // Gunshot sounds array
        this.gunshotSounds = [
            this.sound.add('shoot1'),
            this.sound.add('shoot2'),
            this.sound.add('shoot3'),
            this.sound.add('shoot4')
        ];
    }

    drawHitboxes() {
        // Clear previous frame
        this.hitboxGraphics.clear();
        
        // Set line style: green, 2px width
        this.hitboxGraphics.lineStyle(2, 0x00ff00, 1);
        
        // Helper function to draw a body's hitbox
        const drawBody = (sprite, body) => {
            if (!body || !body.enable) return;
            
            // Use body's actual bounds properties (these are world coordinates)
            const left = body.left;
            const top = body.top;
            const width = body.width;
            const height = body.height;
            
            // Draw rectangle using body bounds
            this.hitboxGraphics.strokeRect(left, top, width, height);
        };
        
        // Draw hitboxes for bullets
        this.bullets.children.entries.forEach(bullet => {
            if (bullet.active && bullet.body) {
                drawBody(bullet, bullet.body);
            }
        });
        
        // Draw hitboxes for helicopters
        this.helicopters.children.entries.forEach(helo => {
            if (helo.active && helo.body) {
                drawBody(helo, helo.body);
            }
        });
        
        // Draw hitboxes for jets
        this.jets.children.entries.forEach(jet => {
            if (jet.active && jet.body) {
                drawBody(jet, jet.body);
            }
        });
        
        // Draw hitboxes for paratroopers
        this.paratroopers.children.entries.forEach(para => {
            if (para.active && para.body) {
                drawBody(para, para.body);
            }
            
            // Draw hitbox for parachute if active
            if (para.myChute && para.myChute.active && para.myChute.body) {
                drawBody(para.myChute, para.myChute.body);
            }
        });
        
        // Draw hitboxes for bombs
        this.bombs.children.entries.forEach(bomb => {
            if (bomb.active && bomb.body) {
                drawBody(bomb, bomb.body);
            }
        });
        
        // Draw hitboxes for air debris
        this.airDebris.children.entries.forEach(debris => {
            if (debris.active && debris.body) {
                drawBody(debris, debris.body);
            }
        });
        
        // Draw hitbox for player gun (if it has a body)
        if (this.player && this.player.body) {
            drawBody(this.player, this.player.body);
        }
    }

    update(time, delta) {
        // Handle pause toggle
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            this.isPaused = !this.isPaused;
            this.pauseText.setVisible(this.isPaused);
            
            if (this.isPaused) {
                console.log('[GAME] PAUSED - Press P to resume');
                this.physics.pause();
            } else {
                console.log('[GAME] RESUMED');
                this.physics.resume();
            }
        }
        
        // Handle hitbox debug toggle
        if (Phaser.Input.Keyboard.JustDown(this.hitboxKey)) {
            this.showHitboxes = !this.showHitboxes;
            this.hitboxGraphics.clear();
            if (!this.showHitboxes) {
                console.log('[DEBUG] Hitboxes hidden');
            } else {
                console.log('[DEBUG] Hitboxes shown');
            }
        }
        
        // If paused, don't update anything else
        if (this.isPaused) {
            return;
        }
        
        // Draw hitboxes if enabled
        if (this.showHitboxes) {
            this.drawHitboxes();
        }
        
        // Scroll background
        this.sky.tilePositionY -= this.skyScrollSpeed * (delta / 1000);
        
        // Gun barrel rotation control
        if (this.cursors.left.isDown) {
            this.gunBarrel.angle -= GameConfig.GUN_BARREL_ROTATION_SPEED;
        }
        if (this.cursors.right.isDown) {
            this.gunBarrel.angle += GameConfig.GUN_BARREL_ROTATION_SPEED;
        }
        
        // Clamp gun barrel rotation
        if (this.gunBarrel.angle > GameConfig.GUN_BARREL_ROTATION_LIMIT) {
            this.gunBarrel.angle = GameConfig.GUN_BARREL_ROTATION_LIMIT;
        }
        if (this.gunBarrel.angle < -GameConfig.GUN_BARREL_ROTATION_LIMIT) {
            this.gunBarrel.angle = -GameConfig.GUN_BARREL_ROTATION_LIMIT;
        }
        
        // Update muzzle flash position and rotation
        this.updateMuzzleFlashPosition();
        
        // Fire weapon
        if (this.fireKey.isDown) {
            this.fire();
        }
        
        // Quit game
        if (this.quitKey.isDown) {
            this.quitGame();
        }
        
        // Spawn enemies
        this.spawnEnemies();
        
        // Process delayed effects
        this.processDelayedEffects();
        
        // Clean up bullets that are out of bounds
        this.bullets.children.entries.forEach(bullet => {
            if (bullet.active && (
                bullet.x < -50 || 
                bullet.x > this.game.config.width + 50 ||
                bullet.y < -50 || 
                bullet.y > this.game.config.height + 50
            )) {
                bullet.destroy();
            }
        });
        
        // Check collisions
        this.checkCollisions();
    }
    
    updateMuzzleFlashPosition() {
        // Calculate muzzle flash position at tip of gun barrel
        const gunAngle = this.gunBarrel.angle - 90;
        const gunAngleRads = Phaser.Math.DegToRad(gunAngle);
        const barrelLength = 46;
        
        const flashX = this.gunBarrel.x + Math.cos(gunAngleRads) * barrelLength;
        const flashY = this.gunBarrel.y + Math.sin(gunAngleRads) * barrelLength;
        
        this.muzzleFlash.setPosition(flashX, flashY);
        this.muzzleFlash.setRotation(gunAngleRads);
    }

    fire() {
        if (this.nextShotAt > this.time.now) {
            return;
        }
        
        this.nextShotAt = this.time.now + this.shotDelay;
        
        // Create new bullet dynamically
        const bullet = this.physics.add.sprite(0, 0, 'bulletFriendly');
        bullet.setOrigin(0.5, 0.5);
        bullet.body.setCollideWorldBounds(false);
        bullet.body.checkWorldBounds = true;
        this.bullets.add(bullet);
        
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
        const bulletStartX = this.gunMantle.x - gunAngleX;
        const bulletStartY = this.gunMantle.y - gunAngleY;
        
        // Activate bullet
        bullet.setActive(true).setVisible(true);
        bullet.setPosition(bulletStartX, bulletStartY);
        
        // Set bullet velocity
        const vx = Math.cos(Phaser.Math.DegToRad(gunAngle)) * GameConfig.FRIENDLY_BULLET_SPEED;
        const vy = Math.sin(Phaser.Math.DegToRad(gunAngle)) * GameConfig.FRIENDLY_BULLET_SPEED;
        bullet.body.setVelocity(vx, vy);
        
        // Play muzzle flash animation
        const randomValue = Phaser.Math.Between(1, 4);
        const animationSelection = 'fire' + randomValue;
        this.muzzleFlash.setVisible(true);
        this.muzzleFlash.setFrame(0);  // Reset to first frame
        this.muzzleFlash.play(animationSelection);

        // Position and emit muzzle smoke at barrel tip (reuse gunAngle from above)
        const smokeBarrelLength = 44;
        const smokeX = this.gunBarrel.x + Math.cos(gunAngleRads) * smokeBarrelLength;
        const smokeY = this.gunBarrel.y + Math.sin(gunAngleRads) * smokeBarrelLength;
        
        // Emit particles at the barrel tip without moving the emitter
        // This ensures already-emitted particles don't follow the gun
        this.muzzleSmoke.emitParticleAt(smokeX, smokeY, 4);
        
        // Play gunshot sound
        const shotSelection = Phaser.Math.Between(0, this.gunshotSounds.length - 1);
        this.gunshotSounds[shotSelection].play();
    }

    spawnEnemies() {
        // Spawn helicopters
        if (this.nextHeloAt < this.time.now) {
            this.nextHeloAt = this.time.now + this.heloDelay;
            
            const coinFlip = Phaser.Math.Between(0, 9);
            
            // Create helicopter dynamically
            const helo = new Helicopter(this, 0, 0);
            this.helicopters.add(helo);
            
            if (coinFlip > 5) {
                helo.setPosition(0, Phaser.Math.Between(20, 200));
                helo.body.setVelocityX(Phaser.Math.Between(30, 60));
                helo.setFlipX(false);
            } else {
                helo.setPosition(this.game.config.width + 10, Phaser.Math.Between(20, 200));
                helo.body.setVelocityX(-Phaser.Math.Between(30, 60));
                helo.setFlipX(true);
            }
            
            helo.spawnHelo(this.paratroopers);
        }
        
        // Spawn jets
        if (this.nextJetAt < this.time.now) {
            this.nextJetAt = this.time.now + this.jetDelay;
            
            const coinFlip = Phaser.Math.Between(0, 9);
            
            // Create jet dynamically
            const jet = new Jet(this, 0, 0);
            this.jets.add(jet);
            
            if (coinFlip > 5) {
                jet.setPosition(0, Phaser.Math.Between(20, 90));
                jet.body.setVelocityX(Phaser.Math.Between(60, 100));
                jet.setFlipX(false);
            } else {
                jet.setPosition(this.game.config.width + 10, Phaser.Math.Between(20, 90));
                jet.body.setVelocityX(-Phaser.Math.Between(60, 100));
                jet.setFlipX(true);
            }
            
            jet.spawnJet(this.bombs);
        }
    }

    checkCollisions() {
        // Bullets vs helicopters
        this.physics.overlap(this.bullets, this.helicopters, (bullet, helo) => {
            if (!bullet.active || !helo.active) return;
            // Make sure the helo object has the method (it's a Helicopter instance)
            if (typeof helo.onHitByBullet !== 'function') return;
            bullet.destroy();
            helo.onHitByBullet();
        }, null, this);
        
        // Bullets vs jets
        this.physics.overlap(this.bullets, this.jets, (bullet, jet) => {
            if (!bullet.active || !jet.active) return;
            // Make sure the jet object has the method (it's a Jet instance)
            if (typeof jet.onHitByBullet !== 'function') return;
            bullet.destroy();
            jet.onHitByBullet();
        }, null, this);
        
        // Bullets vs paratroopers
        this.physics.overlap(this.bullets, this.paratroopers, (bullet, para) => {
            if (!bullet.active || !para.active) return;
            // Make sure the para object has the method (it's a Paratrooper instance)
            if (typeof para.onHitByBullet !== 'function') return;
            bullet.destroy();
            para.onHitByBullet();
        }, null, this);
        
        // Bullets vs bombs
        this.physics.overlap(this.bullets, this.bombs, (bullet, bomb) => {
            if (!bullet.active || !bomb.active) return;
            // Make sure the bomb object has the method (it's a Bomb instance)
            if (typeof bomb.onHitByBullet !== 'function') return;
            bullet.destroy();
            bomb.onHitByBullet();
        }, null, this);
        
        // Air debris vs helicopters
        this.physics.overlap(this.airDebris, this.helicopters, (debris, helo) => {
            if (!debris.active || !helo.active) return;
            // Make sure both objects have the methods
            if (typeof debris.onHitHelicopter !== 'function' || typeof helo.onHitByDebris !== 'function') return;
            debris.onHitHelicopter(helo);
        }, null, this);
        
        // Air debris vs jets
        this.physics.overlap(this.airDebris, this.jets, (debris, jet) => {
            if (!debris.active || !jet.active) return;
            // Make sure both objects have the methods
            if (typeof debris.onHitJet !== 'function' || typeof jet.onHitByDebris !== 'function') return;
            debris.onHitJet(jet);
        }, null, this);
        
        // Air debris vs paratroopers
        this.physics.overlap(this.airDebris, this.paratroopers, (debris, para) => {
            if (!debris.active || !para.active) return;
            // Make sure the para object has the method (it's a Paratrooper instance)
            if (typeof para.onHitByDebris !== 'function') return;
            debris.onHitParatrooper(para);
        }, null, this);
        
        // Air debris vs ground
        this.physics.overlap(this.airDebris, this.player, (player, debris) => {
            if (!debris.active) return;
            // Make sure the debris object has the method
            if (typeof debris.onHitGround !== 'function') return;
            debris.onHitGround();
        }, null, this);
        
        // Bombs vs paratroopers
        this.physics.overlap(this.paratroopers, this.bombs, (para, bomb) => {
            if (!para.active || !bomb.active) return;
            // Make sure the para object has the method (it's a Paratrooper instance)
            if (typeof para.onHitByBomb !== 'function') return;
            bomb.onHitEnemy(para);
            para.onHitByBomb(bomb);
        }, null, this);
        
        // Bombs vs ground
        this.physics.overlap(this.player, this.bombs, (player, bomb) => {
            if (!bomb.active) return;
            // Make sure the bomb object has the method
            if (typeof bomb.onHitGround !== 'function') return;
            bomb.onHitGround();
        }, null, this);
        
        // Paratrooper vs paratrooper collisions
        this.physics.overlap(this.paratroopers, this.paratroopers, (para1, para2) => {
            if (!para1.active || !para2.active || para1 === para2) return;
            // Make sure both objects have the method (they're Paratrooper instances)
            if (typeof para1.onCollideWithPara !== 'function' || typeof para2.onCollideWithPara !== 'function') return;
            para1.onCollideWithPara(para2);
        }, null, this);
        
        // Paratroopers vs ground
        this.physics.overlap(this.player, this.paratroopers, (player, para) => {
            if (!para.active) return;
            // Make sure the para object has the method (it's a Paratrooper instance)
            if (typeof para.hitGround !== 'function') return;
            para.hitGround();
        }, null, this);
        
        // Parachute collisions (using parachutes group)
        // Bullets vs parachutes
        this.physics.overlap(this.bullets, this.parachutes, (bullet, chute) => {
            if (!bullet.active || !chute.active) return;
            if (typeof chute.onHitByBullet !== 'function') return;
            bullet.destroy();
            chute.onHitByBullet();
        }, null, this);
        
        // Air debris vs parachutes
        this.physics.overlap(this.airDebris, this.parachutes, (debris, chute) => {
            if (!debris.active || !chute.active) return;
            if (typeof chute.onHitByDebris !== 'function') return;
            debris.kill();
            chute.onHitByDebris();
        }, null, this);
        
        // Bombs vs parachutes
        this.physics.overlap(this.bombs, this.parachutes, (bomb, chute) => {
            if (!bomb.active || !chute.active) return;
            if (typeof chute.onHitByBomb !== 'function') return;
            if (typeof bomb.onHitEnemy === 'function') {
                bomb.onHitEnemy(chute.parent);
            }
            chute.onHitByBomb();
        }, null, this);
    }


    processDelayedEffects() {
        if (this.instructions && this.instructions.visible && this.time.now > this.instructionsExpire) {
            this.instructions.setVisible(false);
        }
    }

    quitGame() {
        // Clean up and return to menu or restart
        this.scene.restart();
    }
}

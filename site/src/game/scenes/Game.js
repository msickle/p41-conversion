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
        
        // Create gore emitter for paratroopers using colored particles
        // Create a simple red circle texture for gore particles
        const goreGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        goreGraphics.fillStyle(0x8B0000, 1); // Dark red color
        goreGraphics.fillCircle(4, 4, 4); // 8x8 circle
        goreGraphics.generateTexture('goreParticle', 8, 8);
        goreGraphics.destroy();
        
        this.goreEmitter = this.add.particles(0, 0, 'goreParticle', {
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
        this.goreEmitter.setDepth(10000);
        
        // Store in game state
        this.gameState.flamePool = this.flamePool;
    }

    setupEnemies() {
        // Paratrooper group (for collision detection only)
        this.paratroopers = this.add.group({ runChildUpdate: true });
        
        // Helicopter group (for collision detection only)
        this.helicopters = this.add.group({ runChildUpdate: true });
        this.nextHeloAt = 0;
        this.heloDelay = GameConfig.HELO_SPAWN_DELAY;
        
        // Jet group (for collision detection only)
        this.jets = this.add.group({ runChildUpdate: true });
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
        // Bullets vs enemies
        this.physics.overlap(this.bullets, this.helicopters, this.enemyHit, null, this);
        this.physics.overlap(this.bullets, this.paratroopers, this.enemyHit, null, this);
        this.physics.overlap(this.bullets, this.jets, this.enemyHit, null, this);
        this.physics.overlap(this.bullets, this.bombs, this.enemyHit, null, this);
        
        // Air debris collisions
        this.physics.overlap(this.airDebris, this.helicopters, this.heloHitByDebris, null, this);
        this.physics.overlap(this.airDebris, this.paratroopers, this.debrisHitPara, null, this);
        this.physics.overlap(this.airDebris, this.player, this.debrisHitGround, null, this);
        this.physics.overlap(this.airDebris, this.jets, this.heloHitByDebris, null, this);
        
        // Bombs and paratroopers
        this.physics.overlap(this.paratroopers, this.bombs, this.enemyHit, null, this);
        this.physics.overlap(this.player, this.bombs, this.hitGround, null, this);
        
        // Paratrooper collisions
        this.physics.overlap(this.paratroopers, this.paratroopers, this.hitAnotherPara, null, this);
        this.physics.overlap(this.player, this.paratroopers, this.hitGround, null, this);
        
        // Parachute collisions
        this.paratroopers.children.entries.forEach(para => {
            if (para.active && para.myChute && para.myChute.active) {
                this.physics.overlap(this.bullets, para.myChute, this.parachuteHit, null, this);
                this.physics.overlap(this.airDebris, para.myChute, this.parachuteHit, null, this);
                this.physics.overlap(this.bombs, para.myChute, this.parachuteHit, null, this);
            }
        });
    }

    enemyHit(obj1, obj2) {
        // Only process active objects
        if (!obj1.active || !obj2.active) {
            return;
        }
        
        // Determine which is the bullet/projectile and which is the enemy
        let bullet, enemy;
        
        if (obj1.texture.key === 'bulletFriendly' || obj1.texture.key === 'bomb') {
            bullet = obj1;
            enemy = obj2;
        } else if (obj2.texture.key === 'bulletFriendly' || obj2.texture.key === 'bomb') {
            bullet = obj2;
            enemy = obj1;
        } else {
            // Neither is a projectile - shouldn't happen, but handle it
            enemy = obj2;
            bullet = obj1;
        }
        
        // Handle projectile destruction/explosion
        if (bullet.texture.key === 'bulletFriendly') {
            bullet.destroy();
        } else if (bullet.texture.key === 'bomb') {
            // Bombs explode when hitting anything
            this.explode(bullet);
            bullet.destroy();
        }
        
        if (enemy.texture.key === 'heloEnemy001') {
            this.explode(enemy);
            this.addToScore(enemy.reward);
            enemy.kill();
            return;
        }
        
        if (enemy.texture.key === 'jet') {
            this.explode(enemy);
            this.addToScore(enemy.reward);
            enemy.kill();
            return;
        }
        
        if (enemy.texture.key === 'bomb') {
            this.explode(enemy);
            this.addToScore(enemy.reward);
            enemy.destroy();
            return;
        }
        
        if (enemy.texture.key === 'paratrooper') {
            if (enemy.onGround) {
                enemy.onGround = false;
            }
            if (enemy.myChute && enemy.myChute.active) {
                enemy.killChute();
            }
            
            this.spawnGore(enemy);
            this.addToScore(enemy.reward);
            enemy.kill();
        }
    }

    heloHitByDebris(debris, enemy) {
        // Only process active objects
        if (!debris.active || !enemy.active) {
            return;
        }
        
        this.explode(enemy);
        this.addToScore(enemy.reward * 2);
        debris.kill();
        enemy.kill();
    }

    parachuteHit(projectile, parachute) {
        // Only process active objects
        if (!projectile.active || !parachute.active) {
            return;
        }
        
        if (parachute.texture.key === 'parachute' && parachute.parent) {
            parachute.parent.killChute(true);
            this.hitParachute.play();
            this.addToScore(parachute.reward * 2);
            
            // Destroy or explode the projectile
            if (projectile.texture.key === 'bulletFriendly') {
                projectile.destroy();
            } else if (projectile.texture.key === 'bomb') {
                this.explode(projectile);
                projectile.destroy();
            } else if (projectile.texture.key === 'airDebris') {
                // Air debris destroys chute and itself
                projectile.kill();
            }
            return;
        }
    }

    debrisHitPara(debris, target) {
        // Only process active objects
        if (!debris.active || !target.active) {
            return;
        }
            this.spawnGore(target);
            this.addToScore(target.reward * 2);
            target.kill();
            debris.kill(); // Destroy the debris that hit the paratrooper
    }

    debrisHitGround(player, debris) {
        // Only process active debris
        if (!debris || !debris.active) {
            return;
        }
        
        if (debris.kill) {
            debris.kill();
        } else if (debris.setActive) {
            debris.setActive(false).setVisible(false);
        }
    }

    hitGround(player, impactee) {
        // Only process active objects
        if (!impactee.active) {
            return;
        }
        
        if (impactee.texture.key === 'paratrooper') {
            const landedSafe = impactee.hitGround();
            
            if (!landedSafe) {
                this.thwack.play();
                this.spawnGore({ x: impactee.x, y: impactee.y });
                this.addToScore(impactee.reward * 2);
            }
            return;
        }
        
        if (impactee.texture.key === 'bomb') {
            // Store position before destroying
            const bombX = impactee.x;
            const bombY = impactee.y;
            // Pass position object for explosion
            this.explode({ x: bombX, y: bombY, texture: { key: 'bomb' }, body: null });
            impactee.destroy();
            return;
        }
    }

    hitAnotherPara(para1, para2) {
        // Only process active paratroopers
        if (!para1.active || !para2.active || para1 === para2) {
            return;
        }
        
        if (!para1.onGround && !para2.onGround) {
            para1.killChute(true);
            para2.killChute(true);
            return;
        }
        
        if (para1.body.velocity.y > para1.downwardPull * 2 || 
            para2.body.velocity.y > para2.downwardPull * 2) {
            // Spawn gore for both paratroopers
            this.spawnGore(para1);
            this.spawnGore(para2);
            
            para1.kill();
            para2.kill();
            this.thwack.play();
            this.addToScore(para1.reward * 4);
        }
    }

    spawnGore(target) {
        const particleCount = Phaser.Math.Between(7, 18);
        this.goreEmitter.setPosition(target.x, target.y);
        this.goreEmitter.explode(particleCount);
        this.thwack.play();
    }

    explode(sprite) {
        // Create explosion dynamically
        const explosion = this.physics.add.sprite(sprite.x, sprite.y, 'explosion');
        explosion.setOrigin(0.5, 0.5);
        
        // Play explosion animation
        explosion.play('boom');
        
        // If the sprite has velocity (helicopter or jet), make explosion move with it
        if (sprite.body && (sprite.texture.key === 'heloEnemy001' || sprite.texture.key === 'jet')) {
            explosion.body.setVelocity(sprite.body.velocity.x, sprite.body.velocity.y);
        }
        
        // Destroy explosion after animation completes
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });
        
        // Play explosion sound
        this.sfxExplosion001.play();
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

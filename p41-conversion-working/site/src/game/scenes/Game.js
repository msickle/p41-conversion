import { GameConfig } from '../config.js';
import { Paratrooper } from '../objects/Paratrooper.js';
import { Helicopter } from '../objects/Helicopter.js';
import { Jet } from '../objects/Jet.js';
import { AirDebris } from '../objects/AirDebris.js';
import { FlameEmitter } from '../objects/FlameEmitter.js';

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
        
        // Create muzzle smoke particles (positioned at barrel tip during firing)
        this.muzzleSmoke = this.add.particles(0, 0, 'smokePuff', {
            speed: { min: -20, max: 20 },
            speedY: { min: -3, max: -20 },
            gravityY: -200,
            scale: { start: 0.1, end: 0.3 },
            alpha: { start: 1, end: 0.1 },
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
        // Create bullet pool
        this.bulletPool = this.physics.add.group({
            defaultKey: 'bulletFriendly',
            maxSize: GameConfig.FRIENDLY_BULLET_POOL_SIZE,
            runChildUpdate: false
        });
        
        // Create bullets
        for (let i = 0; i < GameConfig.FRIENDLY_BULLET_POOL_SIZE; i++) {
            const bullet = this.bulletPool.create(0, 0, 'bulletFriendly');
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.setOrigin(0.5, 0.5);
            bullet.body.checkWorldBounds = true;
            bullet.body.onWorldBounds = true;
        }
        
        // Listen for bullets leaving world bounds
        this.physics.world.on('worldbounds', (body) => {
            if (this.bulletPool.contains(body.gameObject)) {
                body.gameObject.setActive(false).setVisible(false);
            }
        });
        
        // Shot timing
        this.nextShotAt = 0;
        this.shotDelay = GameConfig.SHOT_DELAY;
        
        // Store in game state
        this.gameState.bulletPool = this.bulletPool;
    }

    setupPyro() {
        // Create explosion pool
        this.explosionPool = this.physics.add.group({
            defaultKey: 'explosion',
            maxSize: GameConfig.EXPLOSION_POOL_SIZE,
            runChildUpdate: false
        });
        
        // Create explosion animation
        if (!this.anims.exists('boom')) {
            this.anims.create({
                key: 'boom',
                frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 2 }),
                frameRate: 15,
                hideOnComplete: true
            });
        }
        
        for (let i = 0; i < GameConfig.EXPLOSION_POOL_SIZE; i++) {
            const explosion = this.explosionPool.create(0, 0, 'explosion');
            explosion.setActive(false);
            explosion.setVisible(false);
            explosion.setOrigin(0.5, 0.5);
            explosion.body.checkWorldBounds = true;
            explosion.body.onWorldBounds = true;
            explosion.on('animationcomplete', () => {
                explosion.setActive(false).setVisible(false);
            });
        }
        
        // Create flame pool
        this.flamePool = this.add.group({
            classType: FlameEmitter,
            maxSize: GameConfig.AIR_DEBRIS_SPAWN_TOTAL,
            runChildUpdate: true
        });
        
        for (let i = 0; i < GameConfig.AIR_DEBRIS_SPAWN_TOTAL; i++) {
            const flame = new FlameEmitter(this, 0, 0);
            this.flamePool.add(flame);
        }
        
        // Create gore emitter for paratroopers
        this.goreEmitter = this.add.particles(0, 0, 'bloodyMess', {
            frame: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            speed: { min: -40, max: 40 },
            gravityY: 0,
            scale: { start: 0.2, end: 0.05 },
            alpha: { start: 1, end: 0.6 },
            lifespan: 500,
            frequency: -1,
            emitting: false
        });
        
        // Store in game state
        this.gameState.flamePool = this.flamePool;
    }

    setupEnemies() {
        // Paratrooper pool
        this.paraPool = this.add.group({
            classType: Paratrooper,
            maxSize: GameConfig.PARA_SPAWN_TOTAL,
            runChildUpdate: true
        });
        
        for (let i = 0; i < GameConfig.PARA_SPAWN_TOTAL; i++) {
            const para = new Paratrooper(this, 100, 100);
            this.paraPool.add(para);
            para.setActive(false).setVisible(false);
        }
        
        // Helicopter pool
        this.heloPool = this.add.group({
            classType: Helicopter,
            maxSize: GameConfig.HELO_SPAWN_TOTAL,
            runChildUpdate: true
        });
        
        for (let i = 0; i < GameConfig.HELO_SPAWN_TOTAL; i++) {
            const helo = new Helicopter(this, 0, 0);
            this.heloPool.add(helo);
            helo.setActive(false).setVisible(false);
        }
        
        this.nextHeloAt = 0;
        this.heloDelay = GameConfig.HELO_SPAWN_DELAY;
        
        // Jet pool
        this.jetPool = this.add.group({
            classType: Jet,
            maxSize: GameConfig.JET_SPAWN_TOTAL,
            runChildUpdate: true
        });
        
        for (let i = 0; i < GameConfig.JET_SPAWN_TOTAL; i++) {
            const jet = new Jet(this, 0, 0);
            this.jetPool.add(jet);
            jet.setActive(false).setVisible(false);
        }
        
        this.nextJetAt = 4000;
        this.jetDelay = GameConfig.JET_SPAWN_DELAY;
        
        // Bomb pool
        this.bombPool = this.physics.add.group({
            defaultKey: 'bomb',
            maxSize: GameConfig.BOMB_SPAWN_TOTAL,
            runChildUpdate: false
        });
        
        for (let i = 0; i < GameConfig.BOMB_SPAWN_TOTAL; i++) {
            const bomb = this.bombPool.create(0, 0, 'bomb');
            bomb.setActive(false);
            bomb.setVisible(false);
            bomb.setOrigin(0.5, 0.5);
            bomb.body.checkWorldBounds = true;
            bomb.body.onWorldBounds = true;
            bomb.reward = GameConfig.BOMB_REWARD;
        }
        
        // Air debris pool
        this.airDebrisPool = this.add.group({
            classType: AirDebris,
            maxSize: GameConfig.AIR_DEBRIS_SPAWN_TOTAL,
            runChildUpdate: true
        });
        
        for (let i = 0; i < GameConfig.AIR_DEBRIS_SPAWN_TOTAL; i++) {
            const debris = new AirDebris(this, 0, 0);
            this.airDebrisPool.add(debris);
        }
        
        // Store in game state
        this.gameState.airDebrisPool = this.airDebrisPool;
        this.gameState.flamePool = this.flamePool;
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

    update(time, delta) {
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
        
        const bullet = this.bulletPool.getFirstDead();
        if (!bullet) {
            return;
        }
        
        this.nextShotAt = this.time.now + this.shotDelay;
        
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
        this.muzzleFlash.play(animationSelection);
        
        // Position and emit muzzle smoke at barrel tip (reuse gunAngle from above)
        const smokeBarrelLength = 44;
        const smokeX = this.gunBarrel.x + Math.cos(gunAngleRads) * smokeBarrelLength;
        const smokeY = this.gunBarrel.y + Math.sin(gunAngleRads) * smokeBarrelLength;
        this.muzzleSmoke.setPosition(smokeX, smokeY);
        this.muzzleSmoke.explode(4);
        
        // Play gunshot sound
        const shotSelection = Phaser.Math.Between(0, this.gunshotSounds.length - 1);
        this.gunshotSounds[shotSelection].play();
    }

    spawnEnemies() {
        // Spawn helicopters
        if (this.nextHeloAt < this.time.now) {
            const enemy = this.heloPool.getFirstDead();
            
            if (enemy) {
                this.nextHeloAt = this.time.now + this.heloDelay;
                
                const coinFlip = Phaser.Math.Between(0, 9);
                
                if (coinFlip > 5) {
                    enemy.setActive(true).setVisible(true);
                    enemy.setPosition(0, Phaser.Math.Between(20, 200));
                    enemy.body.setVelocityX(Phaser.Math.Between(30, 60));
                    enemy.setScale(1, 1);
                } else {
                    enemy.setActive(true).setVisible(true);
                    enemy.setPosition(this.game.config.width + 10, Phaser.Math.Between(20, 200));
                    enemy.body.setVelocityX(-Phaser.Math.Between(30, 60));
                    enemy.setScale(-1, 1);
                }
                
                enemy.spawnHelo(this.paraPool);
            }
        }
        
        // Spawn jets
        if (this.nextJetAt < this.time.now) {
            const enemy = this.jetPool.getFirstDead();
            
            if (enemy) {
                this.nextJetAt = this.time.now + this.jetDelay;
                
                const coinFlip = Phaser.Math.Between(0, 9);
                
                if (coinFlip > 5) {
                    enemy.setActive(true).setVisible(true);
                    enemy.setPosition(0, Phaser.Math.Between(20, 90));
                    enemy.body.setVelocityX(Phaser.Math.Between(60, 100));
                    enemy.setScale(1, 1);
                } else {
                    enemy.setActive(true).setVisible(true);
                    enemy.setPosition(this.game.config.width + 10, Phaser.Math.Between(20, 90));
                    enemy.body.setVelocityX(-Phaser.Math.Between(60, 100));
                    enemy.setScale(-1, 1);
                }
                
                enemy.spawnJet(this.bombPool);
            }
        }
    }

    checkCollisions() {
        // Bullets vs enemies
        this.physics.overlap(this.bulletPool, this.heloPool, this.enemyHit, null, this);
        this.physics.overlap(this.bulletPool, this.paraPool, this.enemyHit, null, this);
        this.physics.overlap(this.bulletPool, this.jetPool, this.enemyHit, null, this);
        this.physics.overlap(this.bulletPool, this.bombPool, this.enemyHit, null, this);
        
        // Air debris collisions
        this.physics.overlap(this.airDebrisPool, this.heloPool, this.heloHitByDebris, null, this);
        this.physics.overlap(this.airDebrisPool, this.paraPool, this.debrisHitPara, null, this);
        this.physics.overlap(this.airDebrisPool, this.player, this.debrisHitGround, null, this);
        this.physics.overlap(this.airDebrisPool, this.jetPool, this.heloHitByDebris, null, this);
        
        // Bombs and paratroopers
        this.physics.overlap(this.paraPool, this.bombPool, this.enemyHit, null, this);
        this.physics.overlap(this.player, this.bombPool, this.hitGround, null, this);
        
        // Paratrooper collisions
        this.physics.overlap(this.paraPool, this.paraPool, this.hitAnotherPara, null, this);
        this.physics.overlap(this.player, this.paraPool, this.hitGround, null, this);
        
        // Parachute collisions
        this.paraPool.children.entries.forEach(para => {
            if (para.active && para.myChute && para.myChute.active) {
                this.physics.overlap(this.bulletPool, para.myChute, this.parachuteHit, null, this);
                this.physics.overlap(this.airDebrisPool, para.myChute, this.parachuteHit, null, this);
            }
        });
    }

    enemyHit(bullet, enemy) {
        bullet.setActive(false).setVisible(false);
        
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
            enemy.setActive(false).setVisible(false);
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
        this.explode(enemy);
        this.addToScore(enemy.reward * 2);
        debris.kill();
        enemy.kill();
    }

    parachuteHit(bullet, parachute) {
        if (parachute.texture.key === 'parachute' && parachute.parent) {
            parachute.parent.killChute(true);
            this.hitParachute.play();
            this.addToScore(parachute.reward * 2);
            
            if (bullet.setActive) {
                bullet.setActive(false).setVisible(false);
            }
            return;
        }
    }

    debrisHitPara(debris, target) {
        if (target.texture.key === 'paratrooper') {
            this.spawnGore(target);
            this.addToScore(target.reward * 2);
            target.kill();
        }
        if (target.texture.key === 'parachute' && target.parent) {
            target.parent.killChute(true);
            return;
        }
    }

    debrisHitGround(player, debris) {
        debris.kill();
    }

    hitGround(player, impactee) {
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
            impactee.setActive(false).setVisible(false);
            this.explode(impactee);
            return;
        }
    }

    hitAnotherPara(para1, para2) {
        if (para1 === para2) {
            return;
        }
        
        if (!para1.onGround && !para2.onGround) {
            para1.killChute(true);
            para2.killChute(true);
            return;
        }
        
        if (para1.body.velocity.y > para1.downwardPull * 2 || 
            para2.body.velocity.y > para2.downwardPull * 2) {
            para1.kill();
            para2.kill();
            this.thwack.play();
            this.addToScore(para1.reward * 4);
        }
    }

    spawnGore(target) {
        this.goreEmitter.setPosition(target.x, target.y);
        this.goreEmitter.explode(Phaser.Math.Between(7, 18));
        this.thwack.play();
    }

    explode(sprite) {
        const explosion = this.explosionPool.getFirstDead();
        if (!explosion) {
            return;
        }
        
        explosion.setActive(true).setVisible(true);
        explosion.setPosition(sprite.x, sprite.y);
        explosion.play('boom');
        
        if (sprite.body && (sprite.texture.key === 'heloEnemy001' || sprite.texture.key === 'jet')) {
            explosion.body.setVelocity(sprite.body.velocity.x, sprite.body.velocity.y);
        }
        
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

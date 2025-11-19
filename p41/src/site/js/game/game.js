'use strict'; 

BasicGame.Game = function(game){

};

var g = BasicGame.Game;

BasicGame.Game.prototype = {

	// Primary functions

	preload: function() {
		this.time.advancedTiming = true;
	},
	create: function() {
		
		this.cursors = this.input.keyboard.createCursorKeys();

		this.setupBackground();
		this.setupText();
		this.setupPlayer();
		this.setupEnemies();
		this.spawnEnemies();
		this.setupAudio();
		this.setupBullets();
		this.setupPyro();
		this.bassReverbClip.play();

	},
	update: function() {

		// Collisions

		this.physics.arcade.overlap( g.bulletPool, this.heloPool, this.enemyHit, null, this );
		this.physics.arcade.overlap( g.bulletPool, this.paraPool, this.enemyHit, null, this );
		this.physics.arcade.overlap( g.bulletPool, this.jetPool, this.enemyHit, null, this );
		this.physics.arcade.overlap( g.bulletPool, this.bombPool, this.enemyHit, null, this );

		this.physics.arcade.overlap( g.airDebrisPool, this.heloPool, this.heloHitByDebris, null, this );
		this.physics.arcade.overlap( g.airDebrisPool, this.paraPool, this.debrisHitPara, null, this );
		this.physics.arcade.overlap( g.airDebrisPool, this.player, this.debrisHitGround, null, this);
		this.physics.arcade.overlap( g.airDebrisPool, this.jetPool, this.heloHitByDebris, null, this);


		// new
		this.physics.arcade.overlap( this.paraPool, this.bombPool, this.enemyHit, null, this);



		this.physics.arcade.overlap( this.player, this.bombPool, this.hitGround, null, this);

		this.physics.arcade.overlap( this.paraPool, this.paraPool, this.hitAnotherPara, null, this );
		this.physics.arcade.overlap( this.player, this.paraPool, this.hitGround, null, this);
		

		this.paraPool.forEachAlive( function(para){

			if (para.myChute.exists === true) {

				this.physics.arcade.overlap( g.bulletPool, para.myChute, this.parachuteHit, null, this );

				this.physics.arcade.overlap( g.airDebrisPool, para.myChute, this.parachuteHit, null, this);
			}

		}, this);


		// Gun keyboard control	
		if (this.cursors.left.isDown) {
			this.gunBarrel.angle -= BasicGame.GUN_BARREL_ROTATION_SPEED;
		}
		if (this.cursors.right.isDown) {
			this.gunBarrel.angle += BasicGame.GUN_BARREL_ROTATION_SPEED;
		}
		if (this.gunBarrel.angle > BasicGame.GUN_BARREL_ROTATION_LIMIT ) {
			this.gunBarrel.angle = BasicGame.GUN_BARREL_ROTATION_LIMIT;
		}
		if (this.gunBarrel.angle < -BasicGame.GUN_BARREL_ROTATION_LIMIT ) {
			this.gunBarrel.angle = -BasicGame.GUN_BARREL_ROTATION_LIMIT;
		}

		if (this.input.keyboard.isDown(Phaser.Keyboard.Z)) {
			this.fire();
		}

		if (this.input.keyboard.isDown(Phaser.Keyboard.Q)) {
			this.quitGame();
		}

		this.spawnEnemies();

		this.processDelayedEffects();

	},
	render: function() {

		// For debugging

		// Show body collision bounds
		// this.game.debug.body(this.enemy);


		// Show FPS
		//this.game.debug.text(this.time.fps, 40, 40);

	},

	/////////////////////////
	// Secondary functions

	setupBackground: function() {
		this.stage.backgroundColor = BasicGame.STATE_BG_COLOR_GAME;
		this.sky = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'bgTest');
		this.sky.tileScale = new PIXI.Point(40,1);
		this.sky.autoScroll(0, -BasicGame.AUTOSCROLL_SPEED);
	},

	setupText: function() {

		this.instructions = this.add.text(
			this.game.width / 2,
			this.game.height / 3,
			'Left and right arrows to move the gun.\n\n'+
			'Press Z to fire.\n',
			{ font: '16px monospace', fill: '#923', align: 'center' }
		);
		this.instructions.anchor.setTo(0.5, 0.5);
		this.instructionsExpire = this.time.now + BasicGame.INSTRUCTION_EXPIRE;

		this.score = 0;
		this.scoreText = this.add.text(
			this.game.width / 2,
			15,
			''+this.score,
			{ font: '14px monospace', fill: '#eed', align: 'center' }
		);
		this.scoreText.anchor.setTo(0.5, 0.5);
	},

	addToScore: function(reward) {
		this.score += reward;
		this.scoreText.text = this.score;
	},

	setupPlayer: function() {

		// Just a brown block

		// Remove this image
		//this.player = this.add.sprite(this.game.width/2, this.game.height-24, 'testImage');

		this.player = this.add.sprite(this.game.width/2, this.game.height-24, 'ground2');

		this.physics.enable(this.player, Phaser.Physics.ARCADE);
		this.player.anchor.setTo(0.5, 0);
		this.player.body.velocity.x = 0;
		this.player.body.velocity.y = 0;
		this.player.width = this.game.width;
		this.player.height = 50;

		// The gun turret

		this.gunBarrel = this.add.sprite(this.game.width/2,this.game.height-38, 'gunBarrel');
		this.gunBarrel.anchor.setTo(0.5, 1);

		this.muzzleFlash = this.add.sprite(-9, -46, 'gunMuzzleFlash');
		this.muzzleFlash.animations.add('fire1', [ 0, 1, 2, 3, 4 ], 30, false, true);
		this.muzzleFlash.animations.add('fire2', [ 3, 2, 1, 0, 4 ], 30, false, true);
		this.muzzleFlash.animations.add('fire3', [ 2, 1, 4 ], 30, false, true);
		this.muzzleFlash.animations.add('fire4', [ 0, 4, 2, 1, 4 ], 30, false, true);

		this.muzzleFlash.animations.frame = 4;

		this.muzzleSmoke = this.add.emitter(0, -44, 20);

		this.muzzleSmoke.minParticleSpeed.setTo(-15, -3);
		this.muzzleSmoke.maxParticleSpeed.setTo(15, -20);

		this.muzzleSmoke.gravity = -200;
		this.muzzleSmoke.setAlpha(0.1, 1, 3000);
		this.muzzleSmoke.setScale(0.1, 0.3, 0.1, 0.3, 6000, Phaser.Easing.Quintic.Out);
		this.muzzleSmoke.makeParticles('smokePuff');


		this.gunBarrel.addChild(this.muzzleSmoke);
		this.gunBarrel.addChild(this.muzzleFlash);

		this.gunMantle = this.add.sprite(this.game.width/2, this.game.height-40, 'gunMantle');
		this.gunMantle.anchor.setTo(0.5, 0.5);

	},

	setupBullets: function() {

		g.bulletPool = this.add.group();

		g.bulletPool.enableBody = true;
		g.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;

		g.bulletPool.createMultiple(BasicGame.FRIENDLY_BULLET_POOL_SIZE, 'bulletFriendly');
		g.bulletPool.setAll('anchor.x', 0.5);
		g.bulletPool.setAll('anchor.y', 0.5);

		g.bulletPool.setAll('outOfBoundsKill', true);
		g.bulletPool.setAll('checkWorldBounds', true);

		this.nextShotAt = 0;
		this.shotDelay = BasicGame.SHOT_DELAY;

	},

	setupPyro: function() {
		this.explosionPool = this.add.group();
		this.explosionPool.enableBody = true;
		this.explosionPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.explosionPool.createMultiple(BasicGame.EXPLOSION_POOL_SIZE, 'explosion');
		this.explosionPool.setAll('anchor.x', 0.5);
		this.explosionPool.setAll('anchor.y', 0.5);

		this.explosionPool.forEach(function (explosion) {
			explosion.animations.add('boom',[ 0, 1, 2 ], 20, true);
		});

		g.flamePool = this.add.group();

		for (var i=0;i<BasicGame.AIR_DEBRIS_SPAWN_TOTAL;i++) {
			g.flamePool.add(new BasicGame.GameObject.FlameEmitter(this.game, 0, 0, ''));
		}

		g.flamePool.setAll('exists', false);
		g.flamePool.setAll('alive', false);
		g.flamePool.setAll('visible', false);

		g.flamePool.setAll('outOfBoundsKill',true);
		g.flamePool.setAll('checkWorldBounds',true);


	},

	setupEnemies: function() {

		// Paratroopers
		this.paraPool = this.add.group();

		for (var i=0;i<BasicGame.PARA_SPAWN_TOTAL;i++) {
			this.paraPool.add(new BasicGame.GameObject.Paratrooper(this.game, 100, 100, 'paratrooper'));
		}
		
		this.paraPool.setAll('exists', false);
		this.paraPool.setAll('alive', false);
		this.paraPool.setAll('visible', false);

		this.paraPool.setAll('outOfBoundsKill',true);
		this.paraPool.setAll('checkWorldBounds',true);

		this.paraPool.setAll('anchor.x', 0.5);
		this.paraPool.setAll('anchor.y', 0.5);

		this.paraPool.setAll('reward', BasicGame.PARA_REWARD, false, false, 0, true);

		this.goreEmitter = this.add.emitter(0, 0, 10);
		this.goreEmitter.gravity = 0;
		this.goreEmitter.setAlpha(0.6, 1, 100);
		this.goreEmitter.setScale(0.05, 0.2, 0.05, 0.2, 500, Phaser.Easing.Quintic.Out);
		this.goreEmitter.minParticleSpeed.setTo(-40, -40);
		this.goreEmitter.maxParticleSpeed.setTo(40, 40);

		this.goreEmitter.makeParticles('bloodyMess',[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);


		// Helocopters
		this.heloPool = this.add.group();

		for (var i=0;i<BasicGame.HELO_SPAWN_TOTAL;i++) {
			var helo = new BasicGame.GameObject.Helicopter(this.game, 0, 0, 'heloEnemy001', this.paraPool);
			this.heloPool.add(helo);

		}
		this.heloPool.setAll('exists', false);
		this.heloPool.setAll('alive', false);
		this.heloPool.setAll('visible', false);

		this.heloPool.setAll('anchor.x', 0.5);
		this.heloPool.setAll('anchor.y', 0.5);

		this.heloPool.setAll('outOfBoundsKill',true);
		this.heloPool.setAll('checkWorldBounds',true);

		this.heloPool.setAll('reward', BasicGame.HELO_REWARD, false, false, 0, true);

		this.nextHeloAt = 0;
		this.heloDelay = BasicGame.HELO_SPAWN_DELAY;


		// Air Debris

		g.airDebrisPool = this.add.group();

		for (var i=0;i<BasicGame.AIR_DEBRIS_SPAWN_TOTAL;i++) {
			g.airDebrisPool.add(new BasicGame.GameObject.AirDebris(this.game, 0, 0, 'airDebris'));
		}

		g.airDebrisPool.setAll('outOfBoundsKill',true);
		g.airDebrisPool.setAll('checkWorldBounds',true);

		// Bombs
		this.bombPool = this.add.group();

		this.bombPool.enableBody = true;
		this.bombPool.physicsBodyType = Phaser.Physics.ARCADE;

		this.bombPool.createMultiple(BasicGame.BOMB_SPAWN_TOTAL, 'bomb');
		this.bombPool.setAll('anchor.x', 0.5);
		this.bombPool.setAll('anchor.y', 0.5);

		this.bombPool.setAll('outOfBoundsKill', true);
		this.bombPool.setAll('checkWorldBounds', true);

		this.bombPool.setAll('reward', BasicGame.BOMB_REWARD, false, false, 0, true);
		

		// Jets
		this.jetPool = this.add.group();

		for (var i=0;i<BasicGame.JET_SPAWN_TOTAL;i++) {
			var jet = new BasicGame.GameObject.Jet(this.game, 0, 0, 'jet', this.bombPool);
			this.jetPool.add(jet);

		}
		this.jetPool.setAll('exists', false);
		this.jetPool.setAll('alive', false);
		this.jetPool.setAll('visible', false);

		this.jetPool.setAll('anchor.x', 0.5);
		this.jetPool.setAll('anchor.y', 0.5);

		this.jetPool.setAll('outOfBoundsKill',true);
		this.jetPool.setAll('checkWorldBounds',true);

		this.nextJetAt = 4000;
		this.jetDelay = BasicGame.JET_SPAWN_DELAY;

	},

	spawnEnemies: function() {
		if (this.nextHeloAt < this.time.now && this.heloPool.countDead() > 0) {
			this.nextHeloAt = this.time.now + this.heloDelay;
			var enemy = this.heloPool.getFirstExists(false);

			var coinFlip = this.rnd.integerInRange(0, 9);

			if (coinFlip > 5) {
				enemy.reset(0, this.rnd.integerInRange(20, 200));
				enemy.body.velocity.x = this.rnd.integerInRange(30, 60);
				enemy.scale.x = 1;
			} else {
				enemy.reset(this.game.width+10, this.rnd.integerInRange(20, 200));
				enemy.body.velocity.x = -this.rnd.integerInRange(30, 60);
				enemy.scale.x = -1;
			}

			enemy.spawnHelo(this.paraPool);
		}

		if (this.nextJetAt < this.time.now && this.jetPool.countDead() > 0) {
			this.nextJetAt = this.time.now + this.jetDelay;

			var enemy = this.jetPool.getFirstExists(false);

			var coinFlip = this.rnd.integerInRange(0, 9);

			if (coinFlip > 5) {
				enemy.reset(0, this.rnd.integerInRange(20, 90));
				enemy.body.velocity.x = this.rnd.integerInRange(60, 100);
				enemy.scale.x = 1;
			} else {
				enemy.reset(this.game.width+10, this.rnd.integerInRange(20, 90));
				enemy.body.velocity.x = -this.rnd.integerInRange(60, 100);
				enemy.scale.x = -1;
			}

			enemy.spawnJet(this.bombPool);
		}

	},

	enemyHit: function(bullet, enemy) {

		bullet.kill();

		if (enemy.key === 'heloEnemy001') {
			this.explode(enemy);
			this.addToScore(enemy.reward);
			enemy.kill();
			return;
		}

		if (enemy.key === 'jet') {
			this.explode(enemy);
			this.addToScore(enemy.reward);
			enemy.kill();
			return;
		}

		if (enemy.key === 'bomb') {
			this.explode(enemy);
			this.addToScore(enemy.reward);
			enemy.kill();
			return;
		}

		if (enemy.key === 'paratrooper') {
			if (enemy.onGround) {
				enemy.onGround = false;
			}
			if (enemy.myChute.exists) {
				enemy.killChute();
			}

			this.spawnGore(enemy);
			this.addToScore(enemy.reward);
			enemy.kill();
		}

	},

	heloHitByDebris: function(debris, enemy) {
		this.explode(enemy);
		this.addToScore(enemy.reward * 2);
		debris.kill(debris);
		enemy.kill();
	},

	parachuteHit: function(parachute, bullet) {
		if (parachute.key === 'parachute') {
			parachute.parent.killChute(true);
			this.hitParachute.play();
			this.addToScore(parachute.reward * 2);
			return;
		}
	},

	thisTest: function(message){
		console.log('thisTest was passed: '+message);
	},

	debrisHitPara: function(debris, target) {
		if(target.key ==="paratrooper") {
			this.spawnGore(target);
			this.addToScore(target.reward * 2);
			target.kill();
		}
		if(target.key ==="parachute") {
			target.parent.killChute(true);
			return;
		}
	},

	debrisHitGround: function(player, debris) {
		debris.kill();
	},

	hitGround: function(player, impactee) {

		var targetStandin = {};
		targetStandin.x = impactee.x;
		targetStandin.y = impactee.y;


		if(impactee.key === 'paratrooper') {
			var landedSafe = impactee.hitGround();

			if (!landedSafe) {
				this.thwack.play();
				this.spawnGore(targetStandin);
				this.addToScore(impactee.reward * 2);
			};
			return;	
		}

		if(impactee.key === 'bomb') {

			impactee.kill();
			
			this.explode(impactee);
			return;	
		}


	},

	hitAnotherPara: function(para1, para2) {

		 if (para1 === para2) {
		 	return;
		 }

		if (!para1.onGround && !para2.onGround) {
			para1.killChute(true);
			para2.killChute(true);
			return;
		}

		if (para1.body.velocity.y > para1.downwardPull*2 || para2.body.velocity.y > para2.downwardPull *2) {
			para1.kill();
			para2.kill();
			this.thwack.play();
			this.addToScore(para1.reward * 4);
		}

	},

	spawnGore: function(target) {
		this.goreEmitter.x = target.x;
		this.goreEmitter.y = target.y;
		this.goreEmitter.explode(400,this.game.rnd.integerInRange(7,18));
		this.thwack.play();
	},

	explode: function(sprite){

		// Will need handling for different cases.  Jets, paratroopers, etc

		if(this.explosionPool.countDead() === 0){
			return;
		}

		var explosion = this.explosionPool.getFirstExists(false);
		explosion.reset(sprite.x, sprite.y);
		explosion.play('boom', 15, false, true);

		if (sprite.key === 'heloEnemy001') {
			explosion.body.velocity.x = sprite.body.velocity.x;
			explosion.body.velocity.y = sprite.body.velocity.y;
		}

		this.sfxExplosion001.play();

	},

	fire: function() {

		if (this.nextShotAt > this.time.now) {
			return;
		}

		if(g.bulletPool.countDead() === 0){
			return;
		}

		this.nextShotAt = this.time.now + this.shotDelay;

		// Set the bullet at the end of the gun barrel
		var gunAngle = this.gunBarrel.angle - 90;



		var gunAngleRads = Phaser.Math.degToRad(gunAngle);

		var gunAngleSlopAmount = 0.05;
		var gunAngleSlop = this.rnd.realInRange(-gunAngleSlopAmount,gunAngleSlopAmount);
		gunAngleRads += gunAngleSlop;

		var angleOffsetModifierX = -32;
		var angleOffsetModifierY = -32;
		var gunAngleX = Math.cos( gunAngleRads ) * angleOffsetModifierX;
		var gunAngleY = Math.sin( gunAngleRads ) * angleOffsetModifierY;
		var bulletStartX = this.gunMantle.x - gunAngleX;
		var bulletStartY = this.gunMantle.y - gunAngleY;

		var bullet = g.bulletPool.getFirstExists(false);

		// Give it some velocity
		var vx = Math.cos( Phaser.Math.degToRad(gunAngle)) * BasicGame.FRIENDLY_BULLET_SPEED;
		var vy = Math.sin( Phaser.Math.degToRad(gunAngle)) * BasicGame.FRIENDLY_BULLET_SPEED;
		
		var randomValue = this.rnd.integerInRange(1, 4);
		var animationSeletion = "fire"+randomValue;

		this.muzzleFlash.play(animationSeletion);
		this.muzzleSmoke.flow(200,150,4,4);

		var shotSelection = this.gunshotSounds.length -1;

		bullet.reset(bulletStartX, bulletStartY);
		bullet.body.velocity.x = vx;
		bullet.body.velocity.y = vy;

		this.gunshotSounds[this.rnd.integerInRange(0, shotSelection)].play();

	},

	setupAudio: function() {
		this.sfxExplosion001 = this.add.audio('explosion1');
		this.hitParachute = this.add.audio('hit-parachute');
		
		this.falling = this.add.audio('falling');
		this.bassReverbClip = this.add.audio('bassReverbClip');
		this.thwack = this.add.audio('thwack');

		this.gunshotSounds = [];
		this.gunshotSounds.push(this.add.audio('shoot1'));
		this.gunshotSounds.push(this.add.audio('shoot2'));
		this.gunshotSounds.push(this.add.audio('shoot3'));
		this.gunshotSounds.push(this.add.audio('shoot4'));


	},

	processDelayedEffects: function() {
		if(this.instructions.exists && this.time.now > this.instructionsExpire){
			this.instructions.destroy();
		}
	},

	quitGame: function() {

		g.bulletPool.destroy();
		g.airDebrisPool.destroy();
		g.flamePool.destroy();

		this.sky.destroy();
		this.scoreText.destroy();
		this.player.destroy();
		this.gunMantle.destroy();
		this.gunBarrel.destroy();
		this.heloPool.destroy();
		this.paraPool.destroy();
		this.jetPool.destroy();
		this.bombPool.destroy();
		this.explosionPool.destroy();
		this.gunshotSounds = null; // It is an array of sounds
		this.sfxExplosion001.destroy();

	},
};
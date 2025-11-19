'use strict'; 

BasicGame.GameObject.Helicopter = function (game, x, y, img) {


	Phaser.Sprite.call(this, game, x, y, img);
	this.game.physics.enable(this, Phaser.Physics.ARCADE);

	this.paraSpawnDelay = game.rnd.integerInRange(500, 1200);
	this.nextParatrooperSpawn = 0;

	this.testVariable = true;

	this.animations.add('fly',[ 0, 1, 2 ], 20, true);

	this.game.add.existing(this);

};

BasicGame.GameObject.Helicopter.prototype = Object.create(Phaser.Sprite.prototype);
BasicGame.GameObject.Helicopter.prototype.constructor = BasicGame.GameObject.Helicopter;

BasicGame.GameObject.Helicopter.prototype.update = function() {

};

BasicGame.GameObject.Helicopter.prototype.spawnHelo = function(paraPool) {

	this.play('fly');

	var timerValue = this.game.rnd.realInRange(1.5,3);

	this.jumpTimer = this.game.time.events.loop(Phaser.Timer.SECOND * timerValue, this.spawnPara, this, paraPool);
	this.jumpTimer.timer.start();

};

BasicGame.GameObject.Helicopter.prototype.spawnPara = function(paraPool) {

	if (this.alive === true && paraPool.countDead() > 0 ) {

		var para = paraPool.getFirstExists(false);
		para.reset();
		para.x = this.x;
		para.y = this.y+32;
		para.body.velocity.x = this.body.velocity.x;

		para.jump();

	}

};

BasicGame.GameObject.Helicopter.prototype.kill = function() {

	// Grab some debris from pool
	var spawnAmount = this.game.rnd.integerInRange(0,BasicGame.AIR_DEBRIS_MAX_EVENT);

	if (this.inWorld){
		for (var i=0;i < spawnAmount;i++) {
			var debris = g.airDebrisPool.getFirstExists(false);
			debris.addDebris(this.x, this.y, this.body.velocity.x, this.body.velocity.y	);
		}
	}

	this.jumpTimer.timer.stop();

	this.alive = false;
	this.exists = false;
	this.visible = false;

	if (this.events)
	{
		this.events.onKilled$dispatch(this);
	}

	return this;

};
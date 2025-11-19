'use strict'; 

BasicGame.GameObject.AirDebris = function (game, x, y, img) {

	Phaser.Sprite.call(this, game, x, y, img, 5);
	this.anchor.setTo(0.5, 0.5);
	game.physics.enable(this, Phaser.Physics.ARCADE);
	
	this.kill();
	this.game.add.existing(this);

};

BasicGame.GameObject.AirDebris.prototype = Object.create(Phaser.Sprite.prototype);
BasicGame.GameObject.AirDebris.prototype.constructor = BasicGame.GameObject.AirDebris;

BasicGame.GameObject.AirDebris.prototype.update = function() {

};

BasicGame.GameObject.AirDebris.prototype.addDebris = function(x, y, vx, vy) {

	this.reset(x,y);

	var spreadX = 42;
	var spreadY = 16;
	var rotationAmount = this.game.rnd.integerInRange(-600,600);
	var size = this.game.rnd.realInRange(0.2, 0.6);

	this.body.velocity.x = vx + this.game.rnd.realInRange(-spreadX,spreadX);
	this.y += this.game.rnd.realInRange(-spreadY,spreadY);
	this.body.velocity.y = BasicGame.TERMINAL_VELOCITY;
	this.body.angularVelocity = rotationAmount;
	this.scale.setTo(size, size);
	this.frame = this.game.rnd.integerInRange(0,16);

	// Need to add local reference for flame so it can be killed

	var flameSpawnChance = this.game.rnd.integerInRange(1,100);

	if (this.inWorld && flameSpawnChance > 50) {
			var flame = g.flamePool.getFirstExists(false);
			flame.makeFire(this.x, this.y, this.body.velocity.x, this.body.velocity.y);
	}

};

BasicGame.GameObject.AirDebris.prototype.hitGround = function() {

};

BasicGame.GameObject.AirDebris.prototype.kill = function() {

	this.alive = false;
	this.exists = false;
	this.visible = false;

	if (this.events)
	{
		this.events.onKilled$dispatch(this);
	}

	return this;

};
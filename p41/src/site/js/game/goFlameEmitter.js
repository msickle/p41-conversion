// goFlameEmitter.js

'use strict'; 

BasicGame.GameObject.FlameEmitter = function (game, x, y, img) {

	Phaser.Sprite.call(this, game, x, y, img);
	this.anchor.setTo(0.5, 0.5);

	game.physics.enable(this, Phaser.Physics.ARCADE);
	
		this.flameEmitter = this.game.add.emitter(0, 0, 10);
		this.flameEmitter.gravity = 0;
		this.flameEmitter.setAlpha(0.6, 1, 100);
		this.flameEmitter.setScale(0.05, 0.2, 0.05, 0.2, 500, Phaser.Easing.Quintic.Out);
		this.flameEmitter.minParticleSpeed.setTo(-10, -10);
		this.flameEmitter.maxParticleSpeed.setTo(10, 10);

		this.flameEmitter.makeParticles('flamingMess',[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]);

	this.kill();
	this.game.add.existing(this);

};

BasicGame.GameObject.FlameEmitter.prototype = Object.create(Phaser.Sprite.prototype);
BasicGame.GameObject.FlameEmitter.prototype.constructor = BasicGame.GameObject.FlameEmitter;

BasicGame.GameObject.FlameEmitter.prototype.update = function() {

	if (this.alive) {
		this.flameEmitter.x = this.x;
		this.flameEmitter.y = this.y;
	}

};

BasicGame.GameObject.FlameEmitter.prototype.makeFire = function(x, y, vx, vy) {

	this.reset(x,y);
	this.flameEmitter.on = true;

	this.body.x = x;
	this.body.y = y;
	this.body.velocity.x = vx;
	this.body.velocity.y = vy;


	this.flameEmitter.flow(500,250,2);

};

BasicGame.GameObject.FlameEmitter.prototype.hitGround = function() {

};

BasicGame.GameObject.FlameEmitter.prototype.kill = function() {

	this.flameEmitter.on = false;

	this.alive = false;
	this.exists = false;
	this.visible = false;

	if (this.events)
	{
		this.events.onKilled$dispatch(this);
	}

	return this;

};
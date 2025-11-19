'use strict'; 

BasicGame.GameObject.Paratrooper = function (game, x, y, img) {

	this.downwardPull = BasicGame.TERMINAL_VELOCITY * BasicGame.PARACHUTE_DESCENT_MULTIPLIER;
	this.maxImpactVelocity = BasicGame.TERMINAL_VELOCITY * BasicGame.PARATROOPER_IMPACT_VELOCITY_LIMIT;

	this.jumped = false;
	this.onGround = false;
	this.deployedChute = false;
	this.chuteDestroyed = false;

	Phaser.Sprite.call(this, game, 0, 0, img);
	this.anchor.setTo(0.5, 0.5);
	//this.scale.setTo(0.5, 0.5);

	this.game.physics.enable(this, Phaser.Physics.ARCADE);

	this.myChute = game.add.sprite(0,0,'parachute');
	this.game.physics.enable(this.myChute, Phaser.Physics.ARCADE);
	
	this.myChute.anchor.setTo(0.5, 1.5);
	//this.myChute.scale.setTo(2, 2);
	this.myChute.reward = BasicGame.CHUTE_REWARD;

	this.addChild(this.myChute);

	this.myChute.kill();

	this.game.add.existing(this);

};

BasicGame.GameObject.Paratrooper.prototype = Object.create(Phaser.Sprite.prototype);
BasicGame.GameObject.Paratrooper.prototype.constructor = BasicGame.GameObject.Paratrooper;

BasicGame.GameObject.Paratrooper.prototype.update = function() {

	// Anything to run on update.

};

BasicGame.GameObject.Paratrooper.prototype.jump = function() {

	this.jumped = true;
	this.onGround = false;
	this.chuteDestroyed = false;

	this.body.velocity.y = BasicGame.TERMINAL_VELOCITY;

	var timerValue = this.game.rnd.realInRange(.25,.5);
	this.deployChuteTimer = this.game.time.events.add(Phaser.Timer.SECOND * timerValue, this.deployChute, this);

};

BasicGame.GameObject.Paratrooper.prototype.deployChute = function() {
	this.myChute.reset(0,0);
	this.deployedChute = true;
	this.body.velocity.y = this.downwardPull;
	this.body.drag = new Phaser.Point(10,0);
};

BasicGame.GameObject.Paratrooper.prototype.hitGround = function() {

	if (this.body.velocity.y > this.maxImpactVelocity) {
		this.killChute();
		this.kill();

		return false;
	}

	this.body.velocity.y = 0;
	this.body.velocity.x = 0;

	this.onGround = true;

	if (this.myChute.exists) {
		this.killChute();
	}

	return true;
	
};

BasicGame.GameObject.Paratrooper.prototype.killChute = function(chuteOnly) {


	 if (this.myChute.exists) {

		this.myChute.kill();
		this.chuteDestroyed = true;

		if (chuteOnly) {
			this.body.velocity.y = BasicGame.TERMINAL_VELOCITY;
			
			//this.game.falling.play();
			// Interested to see about acceleration instead of a flat change

		}
		
	}

};

BasicGame.GameObject.Paratrooper.prototype.kill = function() {

	// Duplicate of Sprite kill() method but with local data handled.
	// The only real reason to do this is to handle children objects like this.myChute



	this.alive = false;
	this.exists = false;
	this.visible = false;

	this.myChute.kill();



	this.jumped = false;
	this.onGround = false;
	this.deployedChute = false;
	this.chuteDestroyed = false;

	if (this.events) {
		this.events.onKilled$dispatch(this);
	}

	return this;

};
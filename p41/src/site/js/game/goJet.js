'use strict'; 

BasicGame.GameObject.Jet = function (game, x, y, img) {

	Phaser.Sprite.call(this, game, x, y, img);
	this.game.physics.enable(this, Phaser.Physics.ARCADE);
	this.reward = BasicGame.JET_REWARD;

	this.game.add.existing(this);

};

BasicGame.GameObject.Jet.prototype = Object.create(Phaser.Sprite.prototype);
BasicGame.GameObject.Jet.prototype.constructor = BasicGame.GameObject.Jet;

BasicGame.GameObject.Jet.prototype.update = function() {

};

BasicGame.GameObject.Jet.prototype.spawnJet = function(bombPool) {

	var timerValue = this.game.rnd.realInRange(0.25, 0.5);

	this.bombTimer = this.game.time.events.add(Phaser.Timer.SECOND * timerValue, this.dropBomb, this, bombPool);
	this.bombTimer.timer.start();

};

BasicGame.GameObject.Jet.prototype.dropBomb = function(bombPool) {

	if (this.alive === true && bombPool.countDead() > 0 ) {
		var bomb = bombPool.getFirstExists(false);

		bomb.reset();
		bomb.angle = 0;
		bomb.x = this.x;
		bomb.y = this.y+32;
		bomb.body.velocity.x = this.body.velocity.x;
		bomb.body.velocity.y = BasicGame.TERMINAL_VELOCITY;
		bomb.scale.x = this.scale.x;

		this.game.add.tween(bomb).to( { angle: 45 * bomb.scale.x }, 2000, Phaser.Easing.Linear.None, true);
	}

};

BasicGame.GameObject.Jet.prototype.kill = function() {

	// Grab some debris from pool
	var spawnAmount = this.game.rnd.integerInRange(0,BasicGame.AIR_DEBRIS_MAX_EVENT);

	if (this.inWorld){
		for (var i=0;i < spawnAmount;i++) {
			var debris = g.airDebrisPool.getFirstExists(false);
			debris.addDebris(this.x, this.y, this.body.velocity.x, this.body.velocity.y);
		}
	}

	this.bombTimer.timer.stop();

	this.alive = false;
	this.exists = false;
	this.visible = false;

	if (this.events)
	{
		this.events.onKilled$dispatch(this);
	}

	return this;

};
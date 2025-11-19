var BasicGame = {

	GLOBAL_VOLUME: 0.3,
	TERMINAL_VELOCITY: 60,
	PARACHUTE_DESCENT_MULTIPLIER: 0.4, // Makes them descend more slowly
	PARATROOPER_IMPACT_VELOCITY_LIMIT: 0.5,


	PLAYER_SPEED: 100,
	AUTOSCROLL_SPEED: 10,
	GUN_BARREL_ROTATION_SPEED: 1,
	GUN_BARREL_ROTATION_LIMIT: 88,
	SHOT_DELAY: 200,
	FRIENDLY_BULLET_SPEED: 100,
	FRIENDLY_BULLET_POOL_SIZE: 100,
	EXPLOSION_POOL_SIZE: 100,
	INSTRUCTION_EXPIRE: 2000,
	HELO_REWARD: 10,
	HELO_SPAWN_TOTAL: 5,
	HELO_SPAWN_DELAY: 1500,
	AIR_DEBRIS_SPAWN_TOTAL: 80,
	AIR_DEBRIS_MAX_EVENT: 3,
	PARA_REWARD: 20,
	CHUTE_REWARD: 5,
	PARA_SPAWN_TOTAL: 60,
	JET_REWARD: 30,
	JET_SPAWN_TOTAL: 4,
	JET_SPAWN_DELAY: 4000,
	BOMB_SPAWN_TOTAL:6,
	BOMB_REWARD: 5,

	STATE_BG_COLOR_PRELOADER: '#923',
	STATE_BG_COLOR_MAINMENU: '#239',
	STATE_BG_COLOR_GAME: '#042',

	TEXT_GAME_TITLE: "Paratroopy",
	TEXT_PRELOAD: "Loading..."

};

BasicGame.GameObject = {};

BasicGame.Boot = function(game) {

};

BasicGame.Boot.prototype = {

	init: function() {

		this.input.maxPointers = 1;

		if (this.game.device.desktop) {

			// Set a custom scale

		} else {
			this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
			//this.scale.setMinMax(480,260,640,480);
			//this.scale.forcedLandscape = true;
		}

		this.sound.volume = BasicGame.GLOBAL_VOLUME;

	},

	preload: function() {
		this.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
		this.load.image('preloaderBar','assets/preloader-bar.png');
	},

	create: function() {
		this.state.start('Preloader');
	}

};
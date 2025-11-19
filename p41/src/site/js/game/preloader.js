BasicGame.Preloader = function (game) {

	this.background = null;
	this.preLoadBar = null;

};

BasicGame.Preloader.prototype = {

	preload : function() {

		this.stage.backgroundColor = BasicGame.STATE_BG_COLOR_PRELOADER;
		//this.stage.smoothed = false;

		this.preLoadBar = this.add.sprite(this.game.width / 2 - 100, this.game.height/2, 'preloaderBar');
		this.add.text(this.game.width / 2, this.game.height/2 - 30, BasicGame.TEXT_PRELOAD, { font: "32px monospace", fill: "#ffe"}).anchor.setTo(0.5,0.5);

		this.load.setPreloadSprite(this.preLoadBar);

		this.load.spritesheet('testSpriteSheet','assets/gridtiles.png', 16, 16, 12);
		this.load.spritesheet('testHelo','assets/ss-helo-air-rescue.png', 45, 20, 12);
		this.load.spritesheet('heloEnemy001','assets/ss-helo-new-001.png', 32, 16, 3);
		this.load.spritesheet('explosion','assets/explosion.png', 32, 32);
		this.load.spritesheet('gunMantle','assets/gun-mantle.png', 32, 32);
		this.load.spritesheet('gunBarrel','assets/gun-barrel.png', 32, 32);
		this.load.spritesheet('gunMuzzleFlash','assets/gun-muzzle-flash.png', 16, 16);

		this.load.image('smokePuff','assets/smoke-puff.png');

		this.load.spritesheet('parachute','assets/parachute.png', 22, 15);
		this.load.spritesheet('paratrooper','assets/paratrooper-test-004.png', 24, 24, 4);

		this.load.spritesheet('bloodyMess','assets/bloody-mess.png', 16, 16);

		this.load.spritesheet('airDebris','assets/air-debris.png', 32, 32);
		
		this.load.spritesheet('flamingMess','assets/flaming-mess.png', 16, 16);

		this.load.spritesheet('jet','assets/jet.png', 64, 16);
		this.load.image('bomb','assets/bomb.png');

		this.load.image('testImage','assets/muddy-ground.png');
		this.load.image('ground2','assets/ground-2.png');

		this.load.image('bulletFriendly','assets/bullet.png');
		this.load.image('sea','assets/sea.png');
		this.load.image('bgTest','assets/bg_vertical_004.png');
		this.load.image('bgBlue001','assets/bg_vertical_003.png');

		this.load.audio('explosion1', ['assets/audio/Explosion1.ogg','assets/audio/Explosion1.mp3']);
		this.load.audio('hit-parachute', ['assets/audio/hit-parachute.ogg','assets/audio/hit-parachute.mp3']);
		this.load.audio('falling', ['assets/audio/falling.ogg','assets/audio/falling.mp3']);
		this.load.audio('bassReverbClip', ['assets/audio/bass-reverb-clip.ogg','assets/audio/bass-reverb-clip.mp3']);
		this.load.audio('thwack', ['assets/audio/thwack.ogg','assets/audio/thwack.mp3']);

		this.load.audio('shoot1', ['assets/audio/shoot-01.ogg','assets/audio/shoot-01.mp3']);
		this.load.audio('shoot2', ['assets/audio/shoot-02.ogg','assets/audio/shoot-02.mp3']);
		this.load.audio('shoot3', ['assets/audio/shoot-03.ogg','assets/audio/shoot-03.mp3']);
		this.load.audio('shoot4', ['assets/audio/shoot-04.ogg','assets/audio/shoot-04.mp3']);

	},
	create: function() {

		this.preLoadBar.cropEnabled = false;

	},
	update: function(){

		// Would be MainMenu normally
		this.state.start('Game');

	}

};
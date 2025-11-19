window.onload = function() {

	// Aiming for a 16:9 resolution, to scale up on all devices, using letterbox as needed
	// http://www.iosres.com/
	var game = new Phaser.Game(850, 478, Phaser.CANVAS, 'phaser-example', null, false, true);

	game.state.add('Boot', BasicGame.Boot);
	game.state.add('Preloader', BasicGame.Preloader);
	game.state.add('MainMenu', BasicGame.MainMenu);
	game.state.add('Game', BasicGame.Game);

	game.state.start('Boot');

};
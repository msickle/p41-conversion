import { GameConfig } from '../config.js';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        // Set background color for preloader
        this.cameras.main.setBackgroundColor(GameConfig.STATE_BG_COLOR_PRELOADER);

        // Display preloader bar
        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;

        this.preLoadBar = this.add.sprite(centerX - 100, centerY, 'preloaderBar');
        
        // Add loading text
        this.add.text(centerX, centerY - 30, GameConfig.TEXT_PRELOAD, { 
            font: "32px monospace", 
            fill: "#ffe" 
        }).setOrigin(0.5, 0.5);

        // Use the preloader bar as loading indicator
        this.load.on('progress', (value) => {
            this.preLoadBar.setCrop(0, 0, this.preLoadBar.width * value, this.preLoadBar.height);
        });
    }

    preload() {
        // Set base path for assets
        this.load.setPath('src/assets/game');

        // Load sprite sheets
        this.load.spritesheet('testSpriteSheet', 'gridtiles.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('heloEnemy001', 'ss-helo-new-001.png', { frameWidth: 32, frameHeight: 16 });
        this.load.spritesheet('explosion', 'explosion.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('gunMantle', 'gun-mantle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('gunBarrel', 'gun-barrel.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('gunMuzzleFlash', 'gun-muzzle-flash.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('parachute', 'parachute.png', { frameWidth: 22, frameHeight: 15 });
        this.load.spritesheet('paratrooper', 'paratrooper-test-004.png', { frameWidth: 24, frameHeight: 24 });
        this.load.spritesheet('bloodyMess', 'bloody-mess.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('airDebris', 'air-debris.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('flamingMess', 'flaming-mess.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('jet', 'jet.png', { frameWidth: 64, frameHeight: 16 });

        // Load images
        this.load.image('smokePuff', 'smoke-puff.png');
        this.load.image('bomb', 'bomb.png');
        this.load.image('testImage', 'muddy-ground.png');
        this.load.image('ground2', 'ground-2.png');
        this.load.image('bulletFriendly', 'bullet.png');
        this.load.image('sea', 'sea.png');
        this.load.image('bgTest', 'bg_vertical_004.png');
        this.load.image('bgBlue001', 'bg_vertical_003.png');

        // Load audio files with fallbacks
        this.load.setPath('src/assets/audio');
        this.load.audio('explosion1', ['Explosion1.ogg', 'Explosion1.mp3']);
        this.load.audio('hit-parachute', ['hit-parachute.ogg', 'hit-parachute.mp3']);
        this.load.audio('falling', ['falling.ogg', 'falling.mp3']);
        this.load.audio('bassReverbClip', ['bass-reverb-clip.ogg', 'bass-reverb-clip.mp3']);
        this.load.audio('thwack', ['thwack.ogg', 'thwack.mp3']);
        this.load.audio('shoot1', ['shoot-01.ogg', 'shoot-01.mp3']);
        this.load.audio('shoot2', ['shoot-02.ogg', 'shoot-02.mp3']);
        this.load.audio('shoot3', ['shoot-03.ogg', 'shoot-03.mp3']);
        this.load.audio('shoot4', ['shoot-04.ogg', 'shoot-04.mp3']);
    }

    create() {
        // Disable crop on preloader bar
        this.preLoadBar.setCrop();

        // Start the Game scene
        this.scene.start('Game');
    }
}

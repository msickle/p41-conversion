import { GameConfig } from '../config.js';

export class Boot extends Phaser.Scene
{
    constructor ()
    {
        super('Boot');
    }

    init ()
    {
        // Set input configuration
        this.input.maxPointers = 1;

        // Configure scale mode for mobile/desktop
        // Phaser 3 handles this in the main config, but we can add responsive settings here if needed
        
        // Set global volume
        this.sound.volume = GameConfig.GLOBAL_VOLUME;
    }

    preload ()
    {
        // Load the preloader bar asset for the Preloader scene
        this.load.image('preloaderBar', 'src/game/assets/image/preloader-bar.png');
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}

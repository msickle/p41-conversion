import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { Preloader } from './scenes/Preloader.js';

// Game configuration
const gameConfig = {
    // Game dimensions (16:9-ish ratio for original Paratroopy game)
    dimensions: {
        width: 850,
        height: 478,
    },
    // Visual settings
    colors: {
        background: '#042',
        primary: '#ffffff',
        accent: '#ff6b35',
    },
    // Physics settings (Arcade physics, no default gravity - handled per object)
    physics: {
        gravity: { y: 0 },
        debug: false,
    },
    // Game settings
    game: {
        title: 'Paratroopy',
        version: '1.0.0',
        fps: 60,
    },
    // Scale settings
    scale: {
        mode: 'FIT',
        autoCenter: 'CENTER_BOTH',
    },
    // Scene configuration
    scenes: {
        boot: 'Boot',
        preloader: 'Preloader',
        game: 'Game',
        gameOver: 'GameOver',
    },
};

// Helper functions for config access
const getGameDimensions = () => ({
    width: gameConfig.dimensions.width,
    height: gameConfig.dimensions.height,
});

const getPhysicsConfig = () => ({
    default: 'arcade',
    arcade: {
        debug: gameConfig.physics.debug,
        gravity: gameConfig.physics.gravity,
    },
});

const getScaleConfig = () => ({
    mode: 'FIT',
    autoCenter: 'CENTER_BOTH',
});

// Export game config for use in other files (e.g., main.ts)
export { gameConfig };

// Phaser game configuration
export const config = {
    type: Phaser.AUTO,
    width: gameConfig.dimensions.width,
    height: gameConfig.dimensions.height,
    parent: 'game-container',
    backgroundColor: gameConfig.colors.background,
    physics: getPhysicsConfig(),
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        Game
    ]
};

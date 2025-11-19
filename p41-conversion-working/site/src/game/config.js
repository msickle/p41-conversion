// Game Configuration Constants
// Ported from original Phaser 2 game

export const GameConfig = {
    // Audio
    GLOBAL_VOLUME: 0.3,

    // Physics
    TERMINAL_VELOCITY: 60,
    PARACHUTE_DESCENT_MULTIPLIER: 0.4, // Makes paratroopers descend more slowly
    PARATROOPER_IMPACT_VELOCITY_LIMIT: 0.5,

    // Player & Gun
    PLAYER_SPEED: 100,
    AUTOSCROLL_SPEED: 10,
    GUN_BARREL_ROTATION_SPEED: 1,
    GUN_BARREL_ROTATION_LIMIT: 88,
    SHOT_DELAY: 200,
    FRIENDLY_BULLET_SPEED: 100,
    FRIENDLY_BULLET_POOL_SIZE: 100,

    // Effects
    EXPLOSION_POOL_SIZE: 100,
    INSTRUCTION_EXPIRE: 2000,

    // Helicopters
    HELO_REWARD: 10,
    HELO_SPAWN_TOTAL: 5,
    HELO_SPAWN_DELAY: 1500,

    // Air Debris
    AIR_DEBRIS_SPAWN_TOTAL: 80,
    AIR_DEBRIS_MAX_EVENT: 3,

    // Paratroopers
    PARA_REWARD: 20,
    CHUTE_REWARD: 5,
    PARA_SPAWN_TOTAL: 60,

    // Jets
    JET_REWARD: 30,
    JET_SPAWN_TOTAL: 4,
    JET_SPAWN_DELAY: 4000,

    // Bombs
    BOMB_SPAWN_TOTAL: 6,
    BOMB_REWARD: 5,

    // Colors
    STATE_BG_COLOR_PRELOADER: '#923',
    STATE_BG_COLOR_MAINMENU: '#239',
    STATE_BG_COLOR_GAME: '#042',

    // Text
    TEXT_GAME_TITLE: "Paratroopy",
    TEXT_PRELOAD: "Loading..."
};

export default GameConfig;


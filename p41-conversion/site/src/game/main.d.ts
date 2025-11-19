export const gameConfig: {
    dimensions: {
        width: number;
        height: number;
    };
    colors: {
        background: string;
        primary: string;
        accent: string;
    };
    physics: {
        gravity: { y: number };
        debug: boolean;
    };
    game: {
        title: string;
        version: string;
        fps: number;
    };
    scale: {
        mode: string;
        autoCenter: string;
    };
    scenes: {
        boot: string;
        preloader: string;
        game: string;
        gameOver: string;
    };
};

export const config: any;


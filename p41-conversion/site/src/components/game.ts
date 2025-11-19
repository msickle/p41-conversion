// @ts-ignore - Phaser is loaded globally via script tag
import { config } from '../game/main.js';

declare const Phaser: any;

export function setupGame(element: HTMLDivElement) {
    const game = new Phaser.Game({
        ...config,
        parent: element
    });
    return game;
}

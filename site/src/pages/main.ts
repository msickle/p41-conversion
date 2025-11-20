import { setupGame } from '../components/game'
import { gameConfig } from '../game/main'

import '../styles/style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>${gameConfig.game.title}</h1>
    <div id="game"></div>
  </div>
`
setupGame(document.querySelector<HTMLDivElement>('#game')!)
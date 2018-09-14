import { GameMove } from "../base/game-move";
import { Player } from "../player";

export class ConnectFourMove extends GameMove {

    constructor(player: Player, selectedPosition: number) {
        super(player, selectedPosition);
    }

}
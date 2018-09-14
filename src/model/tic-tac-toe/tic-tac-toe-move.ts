import { Player } from "../../model/player";
import { GameMove } from "../base/game-move";

export class TicTacToeMove extends GameMove {

    constructor(player: Player, selectedPosition: number) {
        super(player, selectedPosition);
    }

}
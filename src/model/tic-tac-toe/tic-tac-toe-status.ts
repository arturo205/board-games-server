import { GameStatus } from "../base/game-status";

export class TicTacToeStatus extends GameStatus {

    public charactersFromPlayers: Array<string>;

    constructor(gameID: number) {

        super(gameID);
        this.charactersFromPlayers = new Array<string>();
        
    }

}
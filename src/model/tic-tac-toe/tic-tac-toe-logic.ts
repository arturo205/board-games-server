import { GameLogic } from "../base/game-logic";
import { Player } from "../player";
import { TicTacToeStatus } from "./tic-tac-toe-status";

export class TicTacToeLogic extends GameLogic{

    public constructor(gameId: number) {
        super(gameId);
        this.status = new TicTacToeStatus(gameId);
    }

    public joinGame(socket: any, player: Player): boolean {
        let result: boolean = super.joinGame(socket, player);
        this.assignCharToPlay(this.status.playersConnected.length);
        return result;
    }

    private assignCharToPlay(position: number): void {

        if ((<TicTacToeStatus>this.status).charactersFromPlayers.length < 2) {

            if (position === 1) {
                (<TicTacToeStatus>this.status).charactersFromPlayers.push("O");
            }
            else {
                (<TicTacToeStatus>this.status).charactersFromPlayers.push("X");
            }
        }

    }

}
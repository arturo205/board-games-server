import { TicTacToeLogic } from "./tic-tac-toe-logic";
import { TicTacToeSummaryElement } from "./tic-tac-toe-summary-element";
import { Player } from "../player";
import { GameCluster } from "../base/game-cluster";

export class TicTacToeCluster extends GameCluster {

    public constructor() {
        super();
    }

    public addNewGame(socket: any, player: Player): Promise<number> {

        return new Promise<number>((resolve, reject) => {

            let newGame: TicTacToeLogic = new TicTacToeLogic(this.getGameIndex());

            newGame.joinGame(socket, player);
            this.activeGames.push(newGame);

            resolve(newGame.status.gameId);

        });

    }

    public getSummary(): Array<TicTacToeSummaryElement> {

        let summary: Array<TicTacToeSummaryElement> = new Array<TicTacToeSummaryElement>();
        let summaryElement: TicTacToeSummaryElement = null;

        this.removeEmptyGames();

        this.activeGames.forEach(game => {

            summaryElement = new TicTacToeSummaryElement(game.status.gameId);

            if (game.status.playersConnected[0] !== undefined && game.status.playersConnected[0] !== null) {
                summaryElement.player1 = game.status.playersConnected[0];
            }

            if (game.status.playersConnected[1] !== undefined && game.status.playersConnected[1] !== null) {
                summaryElement.player2 = game.status.playersConnected[1];
            }

            summary.push(summaryElement);

        });

        return summary;

    }

}
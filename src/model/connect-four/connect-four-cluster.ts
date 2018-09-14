import { GameCluster } from "../base/game-cluster";
import { Player } from "../player";
import { GameLogic } from "../base/game-logic";
import { ConnectFourLogic } from '../connect-four/connect-four-logic';
import { ConnectFourSummaryElement } from '../connect-four/connect-four-summary-element';

export class ConnectFourCluster extends GameCluster {

    public constructor() {
        super();
    }

    public addNewGame(socket: any, player: Player): Promise<number> {

        return new Promise<number>((resolve, reject) => {

            let newGame: GameLogic = new ConnectFourLogic(this.getGameIndex());

            newGame.joinGame(socket, player);
            this.activeGames.push(newGame);

            resolve(newGame.status.gameId);

        });

    }

    public getSummary(): Array<ConnectFourSummaryElement> {

        let summary: Array<ConnectFourSummaryElement> = new Array<ConnectFourSummaryElement>();
        let summaryElement: ConnectFourSummaryElement = null;

        this.removeEmptyGames();

        this.activeGames.forEach(game => {

            summaryElement = new ConnectFourSummaryElement(game.status.gameId);

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
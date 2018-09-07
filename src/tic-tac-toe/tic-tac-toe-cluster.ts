import { TicTacToeLogic } from "./tic-tac-toe-logic";
import { Player } from "../model/player";
import { TicTacToeSummaryElement } from "./tic-tac-toe-summary-element";
import { Score } from "../model/score";
import { BoardGamesDB } from "../database/database";

export class TicTacToeCluster {

    public static activeGames: Array<TicTacToeLogic> = new Array<TicTacToeLogic>();
    private static gameIndex: number = 0;

    public static addNewGame(socket: any, player: Player): Promise<number> {

        return new Promise<number>((resolve, reject) => {

            let newGame: TicTacToeLogic = new TicTacToeLogic(TicTacToeCluster.getGameIndex());

            newGame.joinGame(socket, player);
            TicTacToeCluster.activeGames.push(newGame);

            resolve(newGame.status.gameId);

        });

    }

    public static getGameIndex(): number {

        TicTacToeCluster.gameIndex ++;
        return TicTacToeCluster.gameIndex;

    }

    public static removePlayerFromActiveGame(socket: any, player: Player) {

        let removePlayer: boolean = false;

        TicTacToeCluster.activeGames.forEach(game => {

            game.status.playersConnected.forEach(playerConnected => {
                if (playerConnected.name === player.name) {
                    removePlayer = true;
                }
            });

            if (removePlayer) {
                game.removeConnectedPlayer(socket, player);
                removePlayer = false;
            }
            
        });

    }

    public static getSummary(): Array<TicTacToeSummaryElement> {

        let summary: Array<TicTacToeSummaryElement> = new Array<TicTacToeSummaryElement>();
        let summaryElement: TicTacToeSummaryElement = null;

        TicTacToeCluster.removeEmptyGames();

        TicTacToeCluster.activeGames.forEach(game => {

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

    private static removeEmptyGames(): void {

        for (let i=TicTacToeCluster.activeGames.length - 1; i>=0; i--) {
            if (TicTacToeCluster.activeGames[i].status.playersConnected.length === 0) {
                TicTacToeCluster.activeGames.splice(i, 1);
            }
        }

    }

    public static getGame(gameId: number): TicTacToeLogic {

        let foundGames: Array<TicTacToeLogic> = TicTacToeCluster.activeGames.filter(x => x.status.gameId === gameId);
        let gameToBeReturned: TicTacToeLogic = null;

        if (foundGames.length === 1) {
            gameToBeReturned = foundGames[0];
        }

        return gameToBeReturned;

    }

    public static getGameID(player: Player): number {

        let foundID: number = -1;

        if (player !== null) {

            TicTacToeCluster.activeGames.forEach(game => {
                game.status.playersConnected.forEach(playerInGame => {
                    if (playerInGame.name === player.name) {
                        foundID = game.status.gameId;
                    }
                });
            });
        }

        return foundID;

    }
    
    public static saveScoreForPlayer(player: Player, score: number): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {

            BoardGamesDB.addOrUpdateScore(player, 1, score)
            .then(result => {
                if (result) {
                    resolve(true);
                }
                else {
                    reject(false);
                }
            })
            .catch(error => {
                reject(error);
            });

        });

    }

}
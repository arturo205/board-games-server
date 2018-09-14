import { GameLogic } from "./game-logic";
import { Player } from "../player";
import { GameSummaryElement } from './game-summary-element';
import { BoardGamesDB } from "../../database/database";

export abstract class GameCluster {

    public activeGames: Array<GameLogic>;
    private gameIndex: number;

    public constructor() {

        this.activeGames = new Array<GameLogic>();
        this.gameIndex = 0;
        
    }

    public abstract addNewGame(socket: any, player: Player): Promise<number>;

    public getGameIndex(): number {

        this.gameIndex ++;
        return this.gameIndex;

    }

    public removePlayerFromActiveGame(socket: any, player: Player) {

        let removePlayer: boolean = false;

        this.activeGames.forEach(game => {

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

    public abstract getSummary(): Array<GameSummaryElement>;

    public removeEmptyGames(): void {

        for (let i=this.activeGames.length - 1; i>=0; i--) {
            if (this.activeGames[i].status.playersConnected.length === 0) {
                this.activeGames.splice(i, 1);
            }
        }

    }

    public getGame(gameId: number): GameLogic {

        let foundGames: Array<GameLogic> = this.activeGames.filter(x => x.status.gameId === gameId);
        let gameToBeReturned: GameLogic = null;

        if (foundGames.length === 1) {
            gameToBeReturned = foundGames[0];
        }

        return gameToBeReturned;

    }

    public getGameID(player: Player): number {

        let foundID: number = -1;

        if (player !== null) {

            this.activeGames.forEach(game => {
                game.status.playersConnected.forEach(playerInGame => {
                    if (playerInGame.name === player.name) {
                        foundID = game.status.gameId;
                    }
                });
            });
        }

        return foundID;

    }
    
    public saveScoreForPlayer(player: Player, score: number): Promise<boolean> {

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
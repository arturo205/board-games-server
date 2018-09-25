import { Player } from "../player";
import { GameMove } from '../base/game-move';
import { GameStatus } from './game-status';

export abstract class GameLogic {

    public socketsFromActivePlayers: Array<any>;
    public status: GameStatus;
    protected maxPlayers: number;

    public constructor(gameId: number) {
        this.socketsFromActivePlayers = new Array<any>();
        this.maxPlayers = 2;
    }

    public joinGame(socket: any, player: Player): boolean {

        let joinedGame: boolean = false;

        if (this.status.playersConnected.length < this.maxPlayers) {
            this.status.playersConnected.push(player);
            this.status.systemMessage.result = true;
            this.status.systemMessage.message = player.name + " joined the game!";
            this.socketsFromActivePlayers.push(socket);
            joinedGame = true;
        }
        else {
            this.status.systemMessage.result = false;
            this.status.systemMessage.message = "The game is already being played by " + this.maxPlayers + " persons! Please wait";
        }

        if (this.status.playersConnected.length === this.maxPlayers && this.status.currentTurn === null) {
            this.beginGame();
        }

        return joinedGame;

    }

    public leaveGame(socket: any, player: Player): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {

            let playerWasRemoved: boolean = this.removeConnectedPlayer(socket, player);

            if (playerWasRemoved) {

                this.resetGame()
                .then(resetResult => {
                    resolve(resetResult);
                })
                .catch(error => {
                    reject(error);
                });
            }
            else {
                resolve(false);
            }
        })

    }

    public removeConnectedPlayer(socket: any, playerToRemove: Player): boolean {

        let indexToDelete: number = -1;
        let playerRemoved: boolean = false;

        this.status.playersConnected.forEach((player, index) => {
            if (player.name === playerToRemove.name) {
                indexToDelete = index;
            }
        });

        if (indexToDelete >= 0) {
            this.status.playersConnected.splice(indexToDelete, 1);
            this.removeActiveSocket(socket);
            playerRemoved = true;
        }

        return playerRemoved;

    }

    public removeActiveSocket(socket: any): void {

        let indexToDelete: number = -1;

        this.socketsFromActivePlayers.forEach((activeSocket, index) => {
            if (activeSocket.id === socket.id) {
                indexToDelete = index;
            }
        });

        if (indexToDelete >= 0) {
            this.socketsFromActivePlayers.splice(indexToDelete, 1);
        }

    }

    public abstract beginGame(): void;

    public abstract resetGame(): Promise<boolean>;

    public abstract async performMove(move: GameMove): Promise<boolean>;

    protected changeTurn(): void {

        let changeApplied: boolean = false;

        this.status.playersConnected.forEach(user => {
            if (user.name !== this.status.currentTurn.name && !changeApplied) {
                changeApplied = true;
                this.status.currentTurn = user;
            }
        });

    }

    protected abstract freeSquaresLeft(): boolean;

    public updateTurnMessage(): void {

        this.status.systemMessage.message = this.status.currentTurn.name + " please make your move! ";

    }

    protected abstract initializeSquareStatus(): void;

    protected abstract checkForWinner(): number;

    public playerIsConnected(player: Player) {

        this.status.playersConnected.forEach(playerConnected => {
            if (player.name === playerConnected.name) {

            }
        });

    }

}
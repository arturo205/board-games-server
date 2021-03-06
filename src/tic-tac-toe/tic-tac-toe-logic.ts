import { TicTacToeMove } from "./tic-tac-toe-move";
import { TicTacToeStatus } from "./tic-tac-toe-status";
import { Player } from "../model/player";
import { BoardGamesDB } from "../database/database";

export class TicTacToeLogic {

    private winnerCombinations: Array<{ keyA: number, keyB: number, keyC: number }>;
    public socketsFromActivePlayers: Array<any>;
    public status: TicTacToeStatus;

    public constructor(gameId: number) {
        this.winnerCombinations = new Array<any>();
        this.socketsFromActivePlayers = new Array<any>();
        this.status = new TicTacToeStatus(gameId);
    }

    public joinGame(socket: any, player: Player): boolean {

        let joinedGame: boolean = false;

        if (this.status.playersConnected.length < 2) {
            this.status.playersConnected.push(player);
            this.status.systemMessage.result = true;
            this.status.systemMessage.message = player.name + " joined the game!";
            this.socketsFromActivePlayers.push(socket);
            this.assignCharToPlay(this.status.playersConnected.length);
            joinedGame = true;
        }
        else {
            this.status.systemMessage.result = false;
            this.status.systemMessage.message = "The game is already being played by 2 users! Please wait";
        }

        if (this.status.playersConnected.length === 2 && this.status.currentTurn === null) {
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

    private assignCharToPlay(position: number): void {

        if (this.status.charactersFromPlayers.length < 2) {

            if (position === 1) {
                this.status.charactersFromPlayers.push("O");
            }
            else {
                this.status.charactersFromPlayers.push("X");
            }
        }

    }

    public beginGame(): void {

        this.buildMovementsToWin();
        this.initializeSquareStatus();
        if (this.status.playersConnected.length > 0) {
            this.status.currentTurn = this.status.playersConnected[0];
        }
        this.status.systemMessage.message = this.status.currentTurn.name + " please make your move!";

    }

    public resetGame(): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {
            this.status.squaresStatus.splice(0, this.status.squaresStatus.length);
            this.status.winnerCombination = null;
            this.status.currentTurn = null;
            this.status.systemMessage.message = "";
            this.status.gameOver = false;
            if (this.status.playersConnected.length === 2) {
                this.beginGame();
            }
            resolve(true);
        });

    }

    public async performMove(move: TicTacToeMove): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {

            if (!this.status.gameOver) {

                if (this.status.squaresStatus[move.selectedPosition] === null) {

                    this.status.squaresStatus[move.selectedPosition] = this.status.currentTurn;
                    let winnerCombinationIndex = this.checkForWinner();

                    if (winnerCombinationIndex === -1) {

                        if (this.freeSquaresLeft()) {

                            this.changeTurn();
                            this.updateTurnMessage();

                        }
                        else {

                            this.status.systemMessage.message = "There are no winners today. Try again!";
                            this.status.gameOver = true;
                            this.status.winnerCombination = {keyA: -1, keyB: -1, keyC: -1};
                            this.status.playersConnected.forEach(player => {
                                BoardGamesDB.addOrUpdateScore(player, 1, 20);
                            });

                        }
                    }
                    else {

                        this.status.systemMessage.message = "Congratulations! " + this.status.currentTurn.name + " won!";
                        this.status.gameOver = true;
                        this.status.winnerCombination = this.winnerCombinations[winnerCombinationIndex];
                        BoardGamesDB.addOrUpdateScore(this.status.currentTurn, 1, 100);

                    }
                }
                else {

                    this.status.systemMessage.message = "Cannot choose this square! Please choose another one!";
                    reject(true);

                }
            }

            resolve(true);
        });
    }

    private changeTurn(): void {

        let changeApplied: boolean = false;

        this.status.playersConnected.forEach(user => {
            if (user.name !== this.status.currentTurn.name && !changeApplied) {
                changeApplied = true;
                this.status.currentTurn = user;
            }
        });

    }

    private freeSquaresLeft(): boolean {

        let freeSquaresFound = false;

        this.status.squaresStatus.forEach(square => {
            if (square === null) {
                freeSquaresFound = true;
            }
        });

        return freeSquaresFound;
    }

    private buildMovementsToWin(): void {

        this.winnerCombinations.splice(0, this.winnerCombinations.length);

        this.winnerCombinations.push({ keyA: 0, keyB: 1, keyC: 2 });
        this.winnerCombinations.push({ keyA: 3, keyB: 4, keyC: 5 });
        this.winnerCombinations.push({ keyA: 6, keyB: 7, keyC: 8 });
        this.winnerCombinations.push({ keyA: 0, keyB: 3, keyC: 6 });
        this.winnerCombinations.push({ keyA: 1, keyB: 4, keyC: 7 });
        this.winnerCombinations.push({ keyA: 2, keyB: 5, keyC: 8 });
        this.winnerCombinations.push({ keyA: 0, keyB: 4, keyC: 8 });
        this.winnerCombinations.push({ keyA: 2, keyB: 4, keyC: 6 });

    }

    public updateTurnMessage(): void {

        this.status.systemMessage.message = this.status.currentTurn.name + " please make your move! ";

    }

    private initializeSquareStatus(): void {

        for (let i = 0; i < 9; i++) {
            this.status.squaresStatus.push(null);
        }

    }

    private checkForWinner(): number {

        let winnerCombination: number = -1;

        this.winnerCombinations.forEach((combination, index) => {
            if (this.checkLineForWinner(combination.keyA, combination.keyB, combination.keyC)) {
                winnerCombination = index;
            }
        });

        return winnerCombination;
    }

    private checkLineForWinner(keyA: number, keyB: number, keyC: number) {

        let result = false;

        if (this.status.currentTurn === this.status.squaresStatus[keyA] && this.status.currentTurn === this.status.squaresStatus[keyB] &&
            this.status.currentTurn === this.status.squaresStatus[keyC]) {
            result = true;

        }

        return result;
    }

    public playerIsConnected(player: Player) {



        this.status.playersConnected.forEach(playerConnected => {
            if (player.name === playerConnected.name) {

            }
        });

    }

}
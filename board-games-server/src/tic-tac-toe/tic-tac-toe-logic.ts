import { TicTacToeMove } from "./tic-tac-toe-move";
import { TicTacToeStatus } from "./tic-tac-toe-status";
import { User } from "../model/user";

export class TicTacToeLogic {

    private static winnerCombinations: Array<{ keyA: number, keyB: number, keyC: number }> = new Array<any>();
    public static socketsFromActivePlayers: Array<any> = new Array<any>();
    public static status: TicTacToeStatus = new TicTacToeStatus();

    public static joinGame(socket: any, user: User): boolean {

        let joinedGame: boolean = false;

        if (this.status.playersConnected.length < 2) {
            this.status.playersConnected.push(user);
            this.status.systemMessage.result = true;
            this.status.systemMessage.message = user.userName + " joined the game!";
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

    private static assignCharToPlay(position: number): void {

        if (this.status.charactersFromPlayers.length < 2) {

            if (position === 1) {
                this.status.charactersFromPlayers.push("O");
            }
            else {
                this.status.charactersFromPlayers.push("X");
            }
        }

    }

    public static beginGame(): void {

        this.buildMovementsToWin();
        this.initializeSquareStatus();
        this.status.currentTurn = this.status.playersConnected[0];
        this.status.systemMessage.message = this.status.currentTurn.userName + " please make your move!";

    }

    public static resetGame(): Promise<boolean> {

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

    public static async performMove(move: TicTacToeMove): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {

            if (!this.status.gameOver) {

                console.log("All Status:");
                console.log(this.status);
                console.log("move:");
                console.log(move);

                if (this.status.squaresStatus[move.selectedPosition] === null) {
                    console.log("Current turn:");
                    console.log(this.status.currentTurn);
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

                        }
                    }
                    else {

                        this.status.systemMessage.message = "Congratulations! " + this.status.currentTurn.userName + " won!";
                        this.status.gameOver = true;
                        this.status.winnerCombination = this.winnerCombinations[winnerCombinationIndex];

                    }
                }
                else {

                    this.status.systemMessage.message = "Cannot choose this square! Please choose another one!";
                    reject(true);

                }
            }
            console.log("Final status print:");
            console.log(this.status);
            resolve(true);
        });
    }

    private static changeTurn(): void {

        let changeApplied: boolean = false;

        this.status.playersConnected.forEach(user => {
            if (user.userName !== this.status.currentTurn.userName && !changeApplied) {
                changeApplied = true;
                this.status.currentTurn = user;
            }
        });

    }

    private static freeSquaresLeft(): boolean {

        let freeSquaresFound = false;

        this.status.squaresStatus.forEach(square => {
            if (square === null) {
                freeSquaresFound = true;
            }
        });

        return freeSquaresFound;
    }

    private static buildMovementsToWin(): void {

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

    public static updateTurnMessage(): void {

        this.status.systemMessage.message = this.status.currentTurn.userName + " please make your move! ";

    }

    private static initializeSquareStatus(): void {

        for (let i = 0; i < 9; i++) {
            this.status.squaresStatus.push(null);
        }

    }

    private static checkForWinner(): number {

        let winnerCombination: number = -1;

        this.winnerCombinations.forEach((combination, index) => {
            if (this.checkLineForWinner(combination.keyA, combination.keyB, combination.keyC)) {
                winnerCombination = index;
            }
        });

        return winnerCombination;
    }

    private static checkLineForWinner(keyA: number, keyB: number, keyC: number) {

        let result = false;

        if (this.status.currentTurn === this.status.squaresStatus[keyA] && this.status.currentTurn === this.status.squaresStatus[keyB] &&
            this.status.currentTurn === this.status.squaresStatus[keyC]) {
            result = true;

        }

        return result;
    }

}
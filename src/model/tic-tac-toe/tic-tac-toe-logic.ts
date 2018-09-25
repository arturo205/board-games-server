import { GameLogic } from "../base/game-logic";
import { Player } from "../player";
import { TicTacToeStatus } from "./tic-tac-toe-status";
import { GameMove } from "../base/game-move";
import { BoardGamesDB } from "../../database/database";

export class TicTacToeLogic extends GameLogic{

    private winnerCombinations: Array<{ keyA: number, keyB: number, keyC: number }>;

    public constructor(gameId: number) {
        super(gameId);
        this.maxPlayers = 2;
        this.winnerCombinations = new Array<any>();
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
            if (this.status.playersConnected.length === this.maxPlayers) {
                this.beginGame();
            }
            resolve(true);
        });

    }

    public async performMove(move: GameMove): Promise<boolean> {

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

    protected freeSquaresLeft(): boolean {

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

    protected initializeSquareStatus(): void {

        for (let i = 0; i < 9; i++) {
            this.status.squaresStatus.push(null);
        }

    }

    protected checkForWinner(): number {

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

}
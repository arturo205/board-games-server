import { GameLogic } from "../base/game-logic";
import { ConnectFourStatus } from '../connect-four/connect-four-status';
import { ConnectFourMove } from "../connect-four/connect-four-move";
import { BoardGamesDB } from "../../database/database";

export class ConnectFourLogic extends GameLogic {

    public constructor(gameId: number) {
        super(gameId);
        this.status = new ConnectFourStatus(gameId);
    }

    public addCustomBoardDimensions(boardWidth: number, boardHeight: number): void {
        (<ConnectFourStatus>this.status).boardWidth = boardWidth;
        (<ConnectFourStatus>this.status).boardHeight = boardHeight;
    }

    public beginGame(): void {

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

    protected freeSquaresLeft(): boolean {

        let freeSquaresFound = false;

        this.status.squaresStatus.forEach(square => {
            if (square === null) {
                freeSquaresFound = true;
            }
        });

        return freeSquaresFound;
    }

    protected initializeSquareStatus(): void {

        let squareNumber: number = (<ConnectFourStatus>this.status).boardWidth * (<ConnectFourStatus>this.status).boardHeight;
        
        for (let i = 0; i < squareNumber; i++) {
            this.status.squaresStatus.push(null);
        }

    }

    public performMove(move: ConnectFourMove): Promise<boolean> {
        
        return new Promise<boolean>((resolve, reject) => {

            let columnIndex: number = this.getColumnIndexFromMainIndex(move.selectedPosition);
            let columnIndexTarget: number = this.getLowestSquareIndexAvailableInColumn(columnIndex);

            if (!this.status.gameOver) {

                if (columnIndexTarget >= 0) {
                    this.status.squaresStatus[columnIndexTarget] = this.status.currentTurn;
                }
                else {
                    this.status.systemMessage.message = "Cannot choose this square! Please choose another one!";
                    reject(false);
                }

                if (this.checkForWinner() === -1) {

                    if (this.freeSquaresLeft()) {

                        this.changeTurn();
                        this.updateTurnMessage();
                        resolve(true);

                    }
                    else {
                        
                        this.status.systemMessage.message = "There are no winners today. Try again!";
                        this.status.gameOver = true;
                        this.status.winnerCombination = {keyA: -1, keyB: -1, keyC: -1, keyD: -1};
                        
                        this.status.playersConnected.forEach(player => {
                            BoardGamesDB.addOrUpdateScore(player, 2, 40);
                        });

                    }
                }
                else {

                    this.status.systemMessage.message = "Congratulations! " + this.status.currentTurn.name + " won!";
                    this.status.gameOver = true;
                    this.status.winnerCombination = {keyA: 1, keyB: 2, keyC: 3, keyD: 4}; // TODO: Add the real code
                    BoardGamesDB.addOrUpdateScore(this.status.currentTurn, 2, 100);

                }
            }

            resolve(true);

        });

    }

    private getColumnIndexFromMainIndex(mainSquaresIndex: number): number {

        let index: number = (mainSquaresIndex + 1) % (<ConnectFourStatus>this.status).boardWidth;
        
        if (index === 0) {
            index = (<ConnectFourStatus>this.status).boardWidth;
        }

        return index;

    }

    private getLowestSquareIndexAvailableInColumn(columnIndex: number): number {

        let lowestIndex: number = -1;

        this.getAllIndexInColumn(columnIndex).forEach(columnIndexToCheck => {
            if (lowestIndex === -1 && this.status.squaresStatus[columnIndexToCheck] === null) {
                lowestIndex = columnIndexToCheck;
            }
        });

        return lowestIndex;

    }

    private getAllIndexInColumn(columnIndex: number): Array<number> {

        let reversedIndexesInColumn: Array<number> = new Array<number>();
        let tempIndex: number = columnIndex - 1;

        reversedIndexesInColumn.push(tempIndex);

        for (let i: number = 1; i < (<ConnectFourStatus>this.status).boardHeight; i++) {
            tempIndex += (<ConnectFourStatus>this.status).boardWidth;
            reversedIndexesInColumn.push(tempIndex);
        }

        return reversedIndexesInColumn.sort();

    }

    protected checkForWinner(): number {

        let winnerCombination: Array<number> = new Array<number>();
        
        this.status.squaresStatus.forEach((playerInSquare, index) => {
            if (winnerCombination.length < 4) {
                if (playerInSquare != null) {
                    winnerCombination = this.checkHorizontalWinnerCases(index);
                }
            }
        });

        if (winnerCombination.length === 4) {
            return winnerCombination[0];
        }
        else {
            return -1;
        }

    }

    private checkHorizontalWinnerCases(indexToCheck: number): Array<number> {

        let winnerCombination: Array<number> = new Array<number>();

        if (this.getColumnIndexFromMainIndex(indexToCheck) + 3 <= (<ConnectFourStatus>this.status).boardWidth) {
            if ((this.status.squaresStatus[indexToCheck].name === this.status.squaresStatus[indexToCheck+1].name) && 
                (this.status.squaresStatus[indexToCheck].name === this.status.squaresStatus[indexToCheck+2].name) &&
                (this.status.squaresStatus[indexToCheck].name === this.status.squaresStatus[indexToCheck+3].name)) {

                winnerCombination.push();

            }
        }

        return winnerCombination;

    }

}
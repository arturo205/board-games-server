import { User } from "../model/user";
import { SystemMessage } from "../model/system-message";

export class TicTacToeStatus {

    public squaresStatus: Array<User>;
    public winnerCombination: any;
    public currentTurn: User;
    public gameOver: boolean;
    public playersConnected: Array<User>;
    public charactersFromPlayers: Array<string>;
    public systemMessage: SystemMessage;

    constructor() {

        this.squaresStatus = new Array<User>();
        this.winnerCombination = [];
        this.currentTurn = null;
        this.gameOver = false;
        this.playersConnected = new Array<User>();
        this.charactersFromPlayers = new Array<string>();
        this.systemMessage = new SystemMessage(true, "");
        
    }

}
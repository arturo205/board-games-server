import { Player } from "../player";
import { SystemMessage } from "../system-message";

export abstract class GameStatus {

    public gameId: number;
    public squaresStatus: Array<Player>;
    public winnerCombination: any;
    public currentTurn: Player;
    public gameOver: boolean;
    public playersConnected: Array<Player>;
    public systemMessage: SystemMessage;

    constructor(gameID: number) {

        this.gameId = gameID;
        this.squaresStatus = new Array<Player>();
        this.winnerCombination = [];
        this.currentTurn = null;
        this.gameOver = false;
        this.playersConnected = new Array<Player>();
        this.systemMessage = new SystemMessage(true, "");
        
    }

}
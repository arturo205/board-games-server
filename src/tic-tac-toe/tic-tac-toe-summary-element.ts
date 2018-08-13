import { Player } from "../model/player";

export class TicTacToeSummaryElement {

    public id: number;
    public player1: Player;
    public player2: Player;

    public constructor(id: number) {

        this.id = id;
        this.player1 = null;
        this.player2 = null;
        
    }

}
import { Player } from "../player";

export abstract class GameMove {

    public player: Player;
    public selectedPosition: number;

    constructor(player: Player, selectedPosition: number) {
        this.player = player;
        this.selectedPosition = selectedPosition;
    }

}
import { Player } from "./player";

export class ChatMessage {

    public player: Player;
    public message: string;

    constructor(player: Player, message: string) {
        this.player = player;
        this.message = message;
    }

}
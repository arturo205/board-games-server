import { User } from "../model/user";

export class TicTacToeMove {

    public user: User;
    public selectedPosition: number;

    constructor(user: User, selectedPosition: number) {
        this.user = user;
        this.selectedPosition = selectedPosition;
    }

}
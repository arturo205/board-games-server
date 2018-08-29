export class Score {

    public playerName: string;
    public score: number;
    public date: string;

    constructor(playerName: string, score: number, date: string) {
        this.playerName = playerName;
        this.score = score;
        this.date = date;
    }

}
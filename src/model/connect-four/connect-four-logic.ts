import { GameLogic } from "../base/game-logic";
import { ConnectFourStatus } from '../connect-four/connect-four-status';

export class ConnectFourLogic extends GameLogic{

    public constructor(gameId: number) {
        super(gameId);
        this.status = new ConnectFourStatus(gameId);
    }

}
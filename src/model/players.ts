import { Player } from "./player";
import { BoardGamesDB } from "../database/database";

export class Players {

    public static loggedInPlayers: Array<Player> = new Array<Player>();

    public static getAllPlayers(): Array<Player> {

        return BoardGamesDB.getAllPlayers();

    }

    public static createPlayer(newPlayer: Player, socketId: string): Promise<Player> {

        return new Promise<Player>((resolve, reject) => {

            BoardGamesDB.playerNameExists(newPlayer.name)
            .then(playerExists => {

                if (playerExists === false) {
                    BoardGamesDB.insertNewPlayer(newPlayer)
                    .then(playerInserted => {
                        playerInserted.socketId = socketId;
                        this.loggedInPlayers.push(playerInserted);
                        resolve(playerInserted);
                    })
                    .catch(error => {
                        reject(error);
                    });
                }
                else {
                    reject("This name is being used. Please choose another name");
                }

            })
            .catch(error => {
                reject(error);
            });
        });

    }

    public static updatePlayer(updatedPlayer: Player): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {
            
            BoardGamesDB.updatePlayer(updatedPlayer)
            .then(playerWasUpdated => {
                this.updateLocalPlayer(updatedPlayer);
                resolve(playerWasUpdated);
            })
            .catch(error => {
                reject(error);
            });

        })

    }

    private static updateLocalPlayer(updatedPlayer: Player): void {

        let playerIndex = this.loggedInPlayers.findIndex(x => x.id == updatedPlayer.id);
        this.loggedInPlayers[playerIndex].password = updatedPlayer.password;
        this.loggedInPlayers[playerIndex].colorId = updatedPlayer.colorId;
        this.loggedInPlayers[playerIndex].iconId = updatedPlayer.iconId;

    }

    public static login(name: string, password: string, socketId: string): Promise<Player> {

        return new Promise<Player>((resolve, reject) => {

            BoardGamesDB.login(name, password)
            .then(playerFromDB => {

                playerFromDB.socketId = socketId;
                this.loggedInPlayers.push(playerFromDB);
                resolve(playerFromDB);

            })
            .catch(error => {
                reject(error);
            });
        });

    }

    public static logout(socketId: string): void {

        this.removeConnectedPlayer(socketId);

    }

    public static playerIsConnected(name: string): boolean {

        let socketWasFound: boolean = false;

        this.loggedInPlayers.forEach(player => {
            if (player.name === name) {
                socketWasFound = true;
            }
        });

        return socketWasFound;

    }

    public static removeConnectedPlayer(socketId: string): void {

        let indexToDelete: number = -1;

        this.loggedInPlayers.forEach((player, index) => {
            if (player.socketId === socketId) {
                indexToDelete = index;
            }
        });

        this.loggedInPlayers.splice(indexToDelete, 1);

    }

    public static getPlayerFromSocketId(socketId: string) : Player {

        let playerFound: Player = null;

        this.loggedInPlayers.forEach(player => {
            if (player.socketId === socketId) {
                playerFound = player;
            }
        });

        return playerFound;

    }

}
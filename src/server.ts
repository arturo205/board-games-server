import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';

import { ChatMessage } from './model/chat-message';
import { Player } from './model/player';
import { Players } from './model/players';
import { SystemMessage } from './model/system-message';
import { ChatSystem } from './model/chat-system';
import { BoardGamesDB } from './database/database';
import { TicTacToeMove } from './model/tic-tac-toe/tic-tac-toe-move';
import { TicTacToeCluster } from './model/tic-tac-toe/tic-tac-toe-cluster';
import { TicTacToeLogic } from './model/tic-tac-toe/tic-tac-toe-logic';

export class LogicServer {
    public static readonly PORT:number = 8080;
    private app: express.Application;
    private server: Server;
    private io: SocketIO.Server;
    private port: string | number;

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
        BoardGamesDB.initialize();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || LogicServer.PORT;
    }

    private sockets(): void {
        this.io = socketIo(this.server);
    }

    private listen(): void {

        this.server.listen(this.port, () => {
            console.log('[server]: Running server on port - %s', this.port);
        });

        this.io.on('connect', (socket: any) => {

            console.log('[connect]: Connected client with socket id - %s', socket.id);

            socket.on('newPlayer', (newPlayer: Player) => {
                this.newPlayerAction(socket, newPlayer);
            });

            socket.on('updatePlayer', (updatedPlayer: Player) => {
                this.updatePlayerAction(socket, updatedPlayer);
            });

            socket.on('login', (data: string, pwd: string) => {
                this.loginAction(socket, data, pwd);
            });

            socket.on('logout', () => {
                this.logoutAction(socket);
            });

            socket.on('allPlayers', () => {
                this.allPlayersAction(socket);
            });

            socket.on('newChatMessage', (chatMessage: ChatMessage) => {
                this.newChatMessageAction(socket, chatMessage);
            });

            socket.on('disconnect', () => {
                this.disconnectAction(socket);
            });

            socket.on('newTicTacToe', (player: Player) => {
                this.newTicTacToeAction(socket, player);
            });

            socket.on('joinTicTacToe', (player: Player, gameID: number) => {
                this.joinTicTacToeGameAction(socket, player, gameID);
            });

            socket.on('performTicTacToeMove', (move: TicTacToeMove, gameID: number) => {
                this.performTicTacToeMoveAction(socket, move, gameID);
            });

            socket.on('resetTicTacToe', (gameID: number) => {
                this.resetTicTacToeAction(socket, gameID);
            });

            socket.on('leaveTicTacToe', (player: Player, gameID: number) => {
                this.leaveTicTacToeAction(socket, player, gameID);
            });

            socket.on('ticTacToeSummary', () => {
                this.ticTacToeSummaryAction(socket);
            });

            socket.on('ticTacToeSaveScore', (player: Player, score: number) => {
                this.saveScoreFromUser(socket, player, score);
            });

            socket.on('userScore', (player: Player, gameId: number) => {
                this.sendScoreToUser(socket, player, gameId);
            });

            socket.on('highestScores', (numberOfLines: number, gameId: number) => {
                this.sendHighestScoresToUser(socket, numberOfLines, gameId);
            });

            socket.on('newConnectFour', (boardWidth: number, boardHeight: number) => {
                
            });

        });
    }

    public getApp(): express.Application {
        return this.app;
    }

    private newPlayerAction(socket: any, newPlayer: Player): void {

        if (!Players.playerIsConnected(socket.id)) {

            Players.createPlayer(newPlayer, socket.id)
            .then(createdPlayer => {
                socket.emit('newPlayer', createdPlayer);
                this.broadcastPlayersLoggedIn(socket);
                console.log("[newPlayer]: The following player was created - %s", newPlayer.name);
            })
            .catch(error => {
                socket.emit('newPlayer', new SystemMessage(false, error));
                console.log("[newPlayer]: The following player failed to be created - %s", newPlayer.name);
            });

        }
        else {
            socket.emit('newPlayer', new SystemMessage(true, 'There is a player already logged in!'));
            console.log("[newPlayer]: The following socket has a player already logged in - %s", socket.id);
        }
    }

    private updatePlayerAction(socket: any, updatedPlayer: Player): void {

        Players.updatePlayer(updatedPlayer)
        .then(() => {
            socket.emit('updatePlayer', new SystemMessage(true, "The player was successfully updated!"));
            this.broadcastPlayersLoggedIn(socket);
            console.log("[updatePlayer]: The following player was updated - %s", updatedPlayer.name);
        })
        .catch(error => {
            socket.emit('updatePlayer', new SystemMessage(false, error + " - logged out."));
            this.logoutAction(socket);
            console.log("[updatePlayer]: The following player was not updated - %s", updatedPlayer.name);
        });

    }

    private loginAction(socket: any, name: string, password: string): void {

        if (!Players.playerIsConnected(name)) {

            Players.login(name, password, socket.id)
            .then(player => {
                socket.emit('login', player);
                this.broadcastPlayersLoggedIn(socket);
                this.broadcastChatMessages();
                console.log("[login]: The following player logged in - %s", player.name);
            })
            .catch(error => {
                socket.emit('login', new SystemMessage(false, error));
                console.log("[login]: The following player failed to login - %s", name);
            });
        }
        else {
            socket.emit('login', new SystemMessage(false, 'There is a player already logged in!'));
            console.log("[login]: The following socket has a player already logged in - %s", socket.id);
        }
    }

    public logoutAction(socket: any): void {

        this.disconnectAction(socket);
    }

    private allPlayersAction(socket: any): void {

        socket.emit('allPlayers', Players.loggedInPlayers);
        console.log("[allPlayers]: A list of players was sent - %s", socket.id);

    }

    private newChatMessageAction(socket: any, chatMessage: ChatMessage): void {

        ChatSystem.addChatMessage(chatMessage);
        this.broadcastChatMessages();
        console.log('[newChatMessage]: Added a message on the main chat');

    }

    private broadcastChatMessages(): void {

        this.io.sockets.emit('newChatMessage', ChatSystem.mainChatLog);

    }

    private disconnectAction(socket: any): void {

        let player: Player = Players.getPlayerFromSocketId(socket.id);
        let ticTacToeGameID: number = TicTacToeCluster.getGameID(player);

        if (ticTacToeGameID >= 0) {
            this.leaveTicTacToeAction(socket, player, ticTacToeGameID)
            .then(() => {
                this.sendTicTacToeSummaryToEveryone();
            });
        }

        Players.removeConnectedPlayer(socket.id);
        this.broadcastPlayersLoggedIn(socket);

        console.log('[disconnect]: Client was disconnected with socket id - %s', socket.id);

    }

    private broadcastPlayersLoggedIn(socket: any): void {

        socket.broadcast.emit('allPlayers', Players.loggedInPlayers);

    }

    private newTicTacToeAction(socket: any, player: Player): void {

        TicTacToeCluster.addNewGame(socket, player)
        .then(gameID => {
            this.sendTicTacToeSummaryToEveryone();
            this.sendTicTacToeStatusToConnectedPlayers(socket, gameID);
        });

    }

    private joinTicTacToeGameAction(socket: any, player: Player, gameID: number): void {

        let game: TicTacToeLogic = TicTacToeCluster.getGame(gameID);
        let result: boolean = false;
        
        if (game !== null) {
            result = game.joinGame(socket, player);

            if (result) {
                this.sendTicTacToeStatusToConnectedPlayers(socket, gameID);
            }
            else {
                socket.emit('ticTacToeSystemMessage', game.status.systemMessage);
                console.log('[joinTicTacToe]: Player was denied to join tic-tac-toe game - %s', player.name);
            }
        }
        else {
            this.sendTicTacToeGameNotFoundMessage(socket);
        }

    }

    private performTicTacToeMoveAction(socket: any, move: TicTacToeMove, gameID: number): void {

        let game: TicTacToeLogic = TicTacToeCluster.getGame(gameID);

        if (game !== null) {
            game.performMove(move).then(() => {
                this.sendTicTacToeStatusToConnectedPlayers(socket, gameID);
            });
        }
        else {
            this.sendTicTacToeGameNotFoundMessage(socket);
        }

    }

    private sendTicTacToeStatusToConnectedPlayers(socket: any, gameID: number): void {

        let game: TicTacToeLogic = TicTacToeCluster.getGame(gameID);

        if (game !== null) {

            game.socketsFromActivePlayers.forEach(socketFromActivePlayer => {
                socketFromActivePlayer.emit('ticTacToeStatus', game.status);
            });

            console.log('[ticTacToeStatus]: Sent the tic-tac-toe status to players playing');
        }
        else {
            this.sendTicTacToeGameNotFoundMessage(socket);
        }

    }

    private sendTicTacToeGameNotFoundMessage(socket: any): void {

        socket.emit('ticTacToeSystemMessage', new SystemMessage(false, "The game did not exist when the player tried to join"));
        console.log('[joinTicTacToe]: Player was denied to join tic-tac-toe game - %s', socket.id);

    }

    private resetTicTacToeAction(socket: any, gameID: number): void {

        let game: TicTacToeLogic = TicTacToeCluster.getGame(gameID);

        if (game !== null) {

            game.resetGame()
            .then(() => {
                this.sendTicTacToeStatusToConnectedPlayers(socket, gameID);
            });

            console.log('[resetTicTacToe]: The tic-tac-toe was reset by a player');
        }
        else {
            this.sendTicTacToeGameNotFoundMessage(socket);
        }

    }

    private leaveTicTacToeAction(socket: any, player: Player, gameID: number): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {

            let game: TicTacToeLogic = TicTacToeCluster.getGame(gameID);

            if (game !== null) {

                game.resetGame()
                .then(() => {
                    game.leaveGame(socket, player)
                    .then(needUpdate => {
                        if (needUpdate === true) {
                            this.sendTicTacToeStatusToConnectedPlayers(socket, gameID);
                            this.sendTicTacToeSummaryToEveryone();
                        }
                        resolve(true);
                    });
                });

                console.log('[leaveTicTacToe]: A player left tic-tac-toe');
            }
            else {
                this.sendTicTacToeGameNotFoundMessage(socket);
                reject(false);
            }

        });

    }

    private sendHighestScoresToUser(socket: any, numberOfLines: number, gameId: number): void {

        BoardGamesDB.getHighestScores(numberOfLines, gameId)
        .then(scores => {
            socket.emit('highestScores', scores);
            console.log("[highestScores]: The highest scores were sent");
        })
        .catch(error => {
            console.log("[highestScores]: There was an error while trying to send the highest scores: " + error);
        });

    }

    private saveScoreFromUser(socket: any, player: Player, score: number): void {

        TicTacToeCluster.saveScoreForPlayer(player, score)
        .then(result => {
            if (result) {
                socket.emit('ticTacToeSaveScore', new SystemMessage(true, "Your score was saved!"));
                console.log("[ticTacToeSaveScore]: The tic-tac-toe score was saved for a player");
            }
            else {
                socket.emit('ticTacToeSaveScore', new SystemMessage(false, "There was a problem while trying to save your score!"));
                console.log("[ticTacToeSaveScore]: The tic-tac-toe score could not be saved for a player");
            }
        })
        .catch(error => {
            console.log("[ticTacToeSaveScore]: The following error ocurred - %s", error);
        });

    }

    private ticTacToeSummaryAction(socket: any): void {

        socket.emit('ticTacToeSummary', TicTacToeCluster.getSummary());
        console.log("[ticTacToeSummary]: The tic-tac-toe cluster summary was sent");

    }

    private sendTicTacToeSummaryToEveryone(): void {

        this.io.sockets.emit('ticTacToeSummary', TicTacToeCluster.getSummary());
        console.log("[ticTacToeSummary]: The tic-tac-toe cluster summary was sent to everyone");

    }

    private sendScoreToUser(socket: any, player: Player, gameId: number): void {

        BoardGamesDB.getScoreFromScoreTableForPlayer(player, gameId)
        .then(score => {
            socket.emit('userScore', score);
            console.log("[userScore]: The tic-tac-toe score was sent to %s", player.name);
        })
        .catch(error => {
            console.log("[userScore]: Error - %s", error);
        });
    
    }

    private createNew

}
import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';

import { ChatMessage } from './model/chat-message';
import { Player } from './model/player';
import { Players } from './model/players';
import { SystemMessage } from './model/system-message';
import { ChatSystem } from './model/chat-system';
import { TicTacToeLogic } from './tic-tac-toe/tic-tac-toe-logic';
import { TicTacToeMove } from './tic-tac-toe/tic-tac-toe-move';
import { BoardGamesDB } from './database/database';

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

            socket.on('joinTicTacToe', (player: Player) => {
                this.joinTicTacToeGameAction(socket, player);
            });

            socket.on('performTicTacToeMove', (move: TicTacToeMove) => {
                this.performTicTacToeMoveAction(socket, move);
            });

            socket.on('resetTicTacToe', () => {
                this.resetTicTacToeAction();
            });

            socket.on('leaveTicTacToe', (player: Player) => {
                this.leaveTicTacToeAction(socket, player);
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

        if (!Players.playerIsConnected(socket.id)) {

            Players.login(name, password, socket.id)
            .then(player => {
                socket.emit('login', player);
                this.broadcastPlayersLoggedIn(socket);
                console.log("[login]: The following player logged in - %s", player.name);
            })
            .catch(error => {
                socket.emit('login', new SystemMessage(false, error));
                console.log("[login]: The following player failed to login - %s", name);
            });
        }
        else {
            socket.emit('login', new SystemMessage(true, 'There is a player already logged in!'));
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
        this.io.sockets.emit('newChatMessage', ChatSystem.mainChatLog);
        console.log('[newChatMessage]: Added a message on the main chat - %s', socket.id);

    }

    private disconnectAction(socket: any): void {

        let player: Player = Players.getPlayerFromSocketId(socket.id);
        this.leaveTicTacToeAction(socket, player);
        Players.removeConnectedPlayer(socket.id);
        this.broadcastPlayersLoggedIn(socket);
        console.log('[disconnect]: Client was disconnected with socket id - %s', socket.id);

    }

    private broadcastPlayersLoggedIn(socket: any): void {

        socket.broadcast.emit('allPlayers', Players.loggedInPlayers);

    }

    private joinTicTacToeGameAction(socket: any, player: Player): void {

        let joinedGame = TicTacToeLogic.joinGame(socket, player);

        if (joinedGame) {
            this.sendTicTacToeStatusToConnectedPlayers();
        }
        else {
            socket.emit('ticTacToeSystemMessage', TicTacToeLogic.status.systemMessage);
            console.log('[joinTicTacToe]: Player was denied to join tic-tac-toe game - %s', player.name);
        }

    }

    private performTicTacToeMoveAction(socket: any, move: TicTacToeMove): void {

        TicTacToeLogic.performMove(move).then(() => {
            this.sendTicTacToeStatusToConnectedPlayers();
        });

    }

    private sendTicTacToeStatusToConnectedPlayers(): void {

        TicTacToeLogic.socketsFromActivePlayers.forEach(socketFromActivePlayer => {
            socketFromActivePlayer.emit('ticTacToeStatus', TicTacToeLogic.status);
        });

        console.log('[ticTacToeStatus]: Sent the tic-tac-toe status to players playing');

    }

    private resetTicTacToeAction(): void {

        TicTacToeLogic.resetGame()
        .then(() => {
            this.sendTicTacToeStatusToConnectedPlayers();
        });

        console.log('[resetTicTacToe]: The tic-tac-toe was reset by a player');

    }

    private leaveTicTacToeAction(socket: any, player: Player): void {

        TicTacToeLogic.resetGame()
        .then(() => {
            this.sendTicTacToeStatusToConnectedPlayers();
            TicTacToeLogic.leaveGame(socket, player)
            .then(needUpdate => {
                if (needUpdate === true) {
                    this.sendTicTacToeStatusToConnectedPlayers();
                    socket.emit('ticTacToeStatus', TicTacToeLogic.status);
                }
            });
        });

        console.log('[leaveTicTacToe]: A player left tic-tac-toe');

    }

}
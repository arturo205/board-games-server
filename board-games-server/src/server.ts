import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
import * as path from 'path';

import { ChatMessage } from './model/chat-message';
import { User } from './model/user';
import { Users } from './model/users';
import { SystemMessage } from './model/system-message';
import { Writter } from './model/writter';
import { ChatSystem } from './model/chat-system';
import { TicTacToeLogic } from './tic-tac-toe/tic-tac-toe-logic';
import { TicTacToeMove } from './tic-tac-toe/tic-tac-toe-move';

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
        this.loadInitialData();
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

    private loadInitialData(): void {
        Users.loadUsersFromFileDB();
    }

    private listen(): void {

        this.server.listen(this.port, () => {
            console.log('[server]: Running server on port - %s', this.port);
        });

        this.io.on('connect', (socket: any) => {

            console.log('[connect]: Connected client with socket id - %s', socket.id);

            socket.on('newUser', (newUser: User) => {
                this.newUserAction(socket, newUser);
            });

            socket.on('login', (user: User) => {
                this.loginAction(socket, user);
            });

            socket.on('allUsers', () => {
                this.allUsersAction(socket);
            });

            socket.on('newChatMessage', (chatMessage: ChatMessage) => {
                this.newChatMessageAction(socket, chatMessage);
            });

            socket.on('disconnect', () => {
                this.disconnectAction(socket);
            });

            socket.on('joinTicTacToe', (user: User) => {
                this.joinTicTacToeGameAction(socket, user);
            });

            socket.on('performTicTacToeMove', (move: TicTacToeMove) => {
                this.performTicTacToeMoveAction(socket, move);
            });

            socket.on('resetTicTacToe', () => {
                this.resetTicTacToeAction();
            });

        });
    }

    public getApp(): express.Application {
        return this.app;
    }

    private newUserAction(socket: any, newUser: User): void {

        if (!Users.userIsConnected(socket.id)) {
            let userCreated: boolean = Users.createUser(newUser, socket.id);

            if (userCreated) {
                socket.emit('newUser', new SystemMessage(true, 'The player was successfully created! You are logged in'));
                this.broadcastUsersLoggedIn(socket);
                console.log("[newUser]: The following user was created - %s", newUser.userName);
            }
            else {
                socket.emit('newUser', new SystemMessage(false, 'The player was not created. Please choose other username'));
                console.log("[newUser]: The following user failed to be created - %s", newUser.userName);
            }
        }
        else {
            socket.emit('newUser', new SystemMessage(true, 'There is a player already logged in!'));
            console.log("[newUser]: The following socket has a player already logged in - %s", socket.id);
        }
    }

    private loginAction(socket: any, user: User): void {

        if (!Users.userIsConnected(socket.id)) {
            let userIsLoggedIn: boolean = Users.login(user, socket.id);

            if (userIsLoggedIn) {
                socket.emit('login', new SystemMessage(true, 'You logged in! Welcome ' + user.userName));
                this.broadcastUsersLoggedIn(socket);
                console.log("[login]: The following user logged in - %s", user.userName);
            }
            else {
                socket.emit('login', new SystemMessage(false, 'Could not login. Incorrect user or password'));
                console.log("[login]: The following user failed to login - %s", user.userName);
            }
        }
        else {
            socket.emit('login', new SystemMessage(true, 'There is a player already logged in!'));
            console.log("[login]: The following socket has a player already logged in - %s", socket.id);
        }
    }

    private allUsersAction(socket: any): void {

        socket.emit('allUsers', Users.loggedInUsers);
        console.log("[allUsers]: A list of users was sent - %s", socket.id);

    }

    private newChatMessageAction(socket: any, chatMessage: ChatMessage): void {

        ChatSystem.addChatMessage(chatMessage);
        this.io.sockets.emit('newChatMessage', ChatSystem.mainChatLog);
        console.log('[newChatMessage]: Added a message on the main chat - %s', socket.id);

    }

    private disconnectAction(socket: any): void {

        Users.removeConnectedUser(socket.id);
        this.broadcastUsersLoggedIn(socket);
        console.log('[disconnect]: Client was disconnected with socket id - %s', socket.id);

    }

    private broadcastUsersLoggedIn(socket: any): void {

        socket.broadcast.emit('allUsers', Users.loggedInUsers);

    }

    private joinTicTacToeGameAction(socket: any, user: User): void {

        let joinedGame = TicTacToeLogic.joinGame(socket, user);

        if (joinedGame) {
            this.sendTicTacToeStatusToConnectedUsers();
        }
        else {
            socket.emit('ticTacToeSystemMessage', TicTacToeLogic.status.systemMessage);
            console.log('[joinTicTacToe]: User was denied to join tic-tac-toe game - %s', user.userName);
        }

    }

    private performTicTacToeMoveAction(socket: any, move: TicTacToeMove): void {

        TicTacToeLogic.performMove(move).then(() => {
            this.sendTicTacToeStatusToConnectedUsers();
        });

    }

    private sendTicTacToeStatusToConnectedUsers(): void {

        TicTacToeLogic.socketsFromActivePlayers.forEach(socketFromActivePlayer => {
            console.log("Data sent to someone");
            console.log(TicTacToeLogic.status);
            socketFromActivePlayer.emit('ticTacToeStatus', TicTacToeLogic.status);
        });

        console.log('[ticTacToeStatus]: Sent the tic-tac-toe status to users playing');

    }

    private resetTicTacToeAction(): void {

        TicTacToeLogic.resetGame().then(() => {
            this.sendTicTacToeStatusToConnectedUsers();
        });

        console.log('[resetTicTacToe]: The tic-tac-toe was reset by a user');

    }

}
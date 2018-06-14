import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
import * as path from 'path';

import { ChatMessage } from './model/chat-message';
import { User } from './model/user';
import { Users } from './model/users';
import { SystemMessage } from './model/system-message';
import { Writter } from './model/writter';

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

            socket.on('message', (message: ChatMessage) => {
                this.messageAction(socket, message);
            });

            socket.on('disconnect', () => {
                this.disconnectAction(socket);
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

    private messageAction(socket: any, message: ChatMessage): void {
        console.log('[message]: %s', JSON.stringify(message));
        this.io.emit('message', message);
    }

    private disconnectAction(socket: any): void {
        console.log('[disconnect]: Client was disconnected with socket id - %s', socket.id);
        Users.removeConnectedUser(socket.id);
    }

}
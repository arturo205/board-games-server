import { User } from "./user";
import { Writter } from "./writter";

export class Users {

    public static users: Array<User> = new Array<User>();
    public static loggedInUsers: Array<User> = new Array<User>();

    public static loadUsersFromFileDB(): void {

        let allUsersStr: Array<string> = Writter.loadAllUsers().split(/\r?\n/);
        let allUsersArr: Array<User> = new Array<User>();

        allUsersStr.forEach(userStr => {
            if (userStr.length > 20) {
                let userTemp: User = new User(userStr);
                allUsersArr.push(userTemp);
            }
        });

        this.users = allUsersArr;

    }

    public static createUser(tempUser: User, socketId: string): boolean {

        let validUser: boolean = true;

        this.users.forEach(user => {
            if (user.userName === tempUser.userName) {
                validUser = false;
            }
        });

        if (validUser) {
            tempUser.socketId = socketId;
            Writter.saveUserIntoFile(tempUser);
            this.users.push(tempUser);
            this.loggedInUsers.push(tempUser);
        }

        return validUser;

    }

    public static login(user: User, socketId: string): boolean {

        let userIsLoggedIn: boolean = false;

        this.users.forEach(userDB => {
            if (user.userName === userDB.userName && user.password === userDB.password) {
                user.socketId = socketId;
                this.loggedInUsers.push(user);
                userIsLoggedIn = true;
            }
        });

        return userIsLoggedIn;

    }

    public static userIsConnected(socketId: string): boolean {

        let socketWasFound: boolean = false;

        this.loggedInUsers.forEach(user => {
            if (user.socketId === socketId) {
                socketWasFound = true;
            }
        });

        return socketWasFound;

    }

    public static removeConnectedUser(socketId: string): void {

        let indexToDelete: number = -1;

        this.loggedInUsers.forEach((user, index) => {
            if (user.socketId === socketId) {
                indexToDelete = index;
            }
        });

        this.loggedInUsers.splice(indexToDelete, 1);

    }

}
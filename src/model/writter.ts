import { User } from "./user";
import fs = require('fs');

export class Writter {

    private static readonly directory: string = './file_db';
    private static readonly usersFileName: string = '/users.txt';

    public static saveUserIntoFile(user: User): void {

        let userInJson: string = JSON.stringify(user) + "\r\n";

        this.verifyDirectory();
        fs.appendFileSync(Writter.directory + Writter.usersFileName, userInJson);
    }

    public static loadAllUsers(): string {

        this.verifyDirectory();
        return fs.readFileSync(Writter.directory + Writter.usersFileName).toString();

    }

    private static verifyDirectory(): void {

        if (!fs.existsSync(Writter.directory)) {
            fs.mkdirSync(Writter.directory);
            fs.appendFileSync(Writter.directory + Writter.usersFileName, "");
        }

    }

}
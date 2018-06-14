export class User {

    public socketId: string;
    public userName: string;
    public password: string;

    constructor(jsonString: string) {

        let parsedObj = JSON.parse(jsonString);

        this.socketId = parsedObj.socketId;
        this.userName = parsedObj.userName;
        this.password = parsedObj.password;

    }

}

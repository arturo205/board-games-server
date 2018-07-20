export class Player {

    public socketId: string;
    public id: number;
    public name: string;
    public password: string;
    public colorId: number;
    public iconId: number;

    constructor(name: string, password: string, colorId: number, iconId: number) {

        this.socketId = "";
        this.id = 0;
        this.name = name;
        this.password = password;
        this.colorId =colorId;
        this.iconId = iconId;

    }

}

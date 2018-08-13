import { Player } from "../model/player";

const Sequelize = require('sequelize');

export class BoardGamesDB {

    private static PlayerDB;
    public static sequelize;

    public static initialize(): void {
        this.initializeDBObject();
        this.openDB();
        this.createModels();
    }

    private static initializeDBObject(): void {

        let connectionSource: string = process.env.HEROKU_POSTGRESQL_GRAY_URL || "localhost";

        if (connectionSource === "localhost") {

            BoardGamesDB.sequelize = new Sequelize('BoardGamesDB', 'arturo', 'admin', {
                host: '127.0.0.1',
                dialect: 'postgres',
                protocol: "postgres",
                operatorsAliases: Sequelize.Op,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            });

        }
        else {

            BoardGamesDB.sequelize = new Sequelize(process.env.HEROKU_POSTGRESQL_GRAY_URL, {
                dialect: 'postgres',
                protocol: 'postgres',
                host: 'ec2-50-16-196-238.compute-1.amazonaws.com',
                port: 5432,
                logging: true,
                operatorsAliases: Sequelize.Op,
                pool: {
                    max: 10,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            });

        }

    }

    private static openDB(): void {

        this.sequelize
            .authenticate()
            .then(() => {
                console.log('Connection has been established successfully!');
            })
            .catch(err => {
                console.error('Unable to connect to the database: ', err);
            });
    }

    private static createModels(): void {

        BoardGamesDB.PlayerDB = this.sequelize.define('players', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING
            },
            password: {
                type: Sequelize.STRING
            },
            color_id: {
                type: Sequelize.INTEGER
            },
            icon_id: {
                type: Sequelize.INTEGER
            }
        },
        {
            paranoid: true,
            underscored: true,
            freezeTableName: true
        });

    }

    public static getAllPlayers(): Array<Player> {

        let allPlayers: Array<Player> = new Array<Player>();

        BoardGamesDB.PlayerDB.findAll().then(players => {
            players.forEach(player => {
                let playerBuilt: Player = new Player(player.name, player.password, player.color_id, player.icon_id);
                playerBuilt.id = player.id;
                allPlayers.push(playerBuilt);
            });
        });

        return allPlayers;

    }

    public static login(name: string, pwd: string): Promise<Player> {

        return new Promise<Player>((resolve, reject) => {

            BoardGamesDB.PlayerDB.findOne({
                where: {
                    name: name,
                    password: pwd
                }
            })
            .then(player => {
                if (player !== null) {
                    let foundPlayer: Player = new Player(player.name, player.password, player.color_id, player.icon_id);
                    foundPlayer.id = player.id;
                    resolve(foundPlayer);
                }
                else {
                    reject("Could not login. Incorrect player name or password");
                }
            })
            .catch(error => {
                reject(error);
            });
        });

    }

    public static playerNameExists(name: string): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {

            BoardGamesDB.PlayerDB.findOne({
                where: {
                    name: name
                }
            })
            .then(playerFound => {
                if (playerFound === null) {
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            })
            .catch(error => {
                reject(error);
            });

        });

    }

    public static insertNewPlayer(newPlayer: Player): Promise<Player> {

        return new Promise<Player>((resolve, reject) => {

            BoardGamesDB.PlayerDB.create({
                name: newPlayer.name,
                password: newPlayer.password,
                color_id: newPlayer.colorId,
                icon_id: newPlayer.iconId
            })
            .then(playerCreated => {
                let playerBuilt: Player = new Player(playerCreated.name, playerCreated.password, playerCreated.color_id, playerCreated.icon_id);
                playerBuilt.id = playerCreated.id;
                resolve(playerBuilt);
            })
            .catch(error => {
                reject(error);
            });

        });

    }

    public static updatePlayer(updatedPlayer: Player): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {
            
            BoardGamesDB.PlayerDB.update({
                password: updatedPlayer.password,
                color_id: updatedPlayer.colorId,
                icon_id: updatedPlayer.iconId
            },
            {
                where: {
                    id: updatedPlayer.id
                }
            })
            .then(() => {
                resolve(true);
            })
            .catch(error => {
                reject(error);
            });

        })

    }

}
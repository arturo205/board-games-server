import { Player } from "../model/player";
import { resolve } from "../../node_modules/@types/bluebird";
import { Score } from "../model/score";

const Sequelize = require('sequelize');

export class BoardGamesDB {

    private static PlayerDB;
    private static GamesDB;
    private static ScoreDB;
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

        BoardGamesDB.GamesDB = this.sequelize.define('games', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING
            },
            min_players: {
                type: Sequelize.INTEGER
            },
            max_players: {
                type: Sequelize.INTEGER
            }
        },
        {
            paranoid: true,
            underscored: true,
            freezeTableName: true
        });

        BoardGamesDB.ScoreDB = this.sequelize.define('score', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            player_id: {
                type: Sequelize.INTEGER
            },
            game_id: {
                type: Sequelize.INTEGER
            },
            score: {
                type: Sequelize.INTEGER
            }
        },
        {
            paranoid: true,
            underscored: true,
            freezeTableName: true
        });

        BoardGamesDB.ScoreDB.belongsTo(BoardGamesDB.PlayerDB, {foreignKey: 'player_id', targetKey: 'id'});
        BoardGamesDB.ScoreDB.belongsTo(BoardGamesDB.GamesDB, {foreignKey: 'game_id', targetKey: 'id'});

        BoardGamesDB.PlayerDB.sync();
        BoardGamesDB.ScoreDB.sync();

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

        });

    }

    public static getHighestScores(numberOfScores: number, gameId: number): Promise<Array<Score>> {

        return new Promise<Array<Score>>((resolve, reject) => {

            BoardGamesDB.getBestScores(gameId, numberOfScores)
            .then(bestScoresFound => {
                resolve(bestScoresFound);
            })
            .catch(error => {
                reject("Error while trying to retrieve the highest scores: " + error);
            });

        });

    }

    public static addOrUpdateScore(player: Player, gameId: number, newScore: number): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {

            BoardGamesDB.getIdFromScoreTableForPlayer(player, gameId)
            .then(scoreIdFound => {
                console.log("SCORE ID FOUND!!");
                console.log(scoreIdFound);
                if (scoreIdFound < 0) {
                    BoardGamesDB.insertScore(player, gameId, newScore)
                    .then(insertResult => {
                        if (insertResult) {
                            resolve(true);
                        }
                        else {
                            reject(false);
                        }
                    })
                    .catch(error => {
                        reject(error);
                    });
                }
                else {
                    BoardGamesDB.updateScore(scoreIdFound, newScore)
                    .then(updateResult => {
                        if (updateResult) {
                            resolve(true);
                        }
                        else {
                            reject(false);
                        }
                    })
                    .catch(error => {
                        reject(error);
                    });
                }
            })
            .catch(error => {
                reject(error);
            });
        });

    }

    private static getIdFromScoreTableForPlayer(player: Player, gameId: number): Promise<number> {

        let scoreId: number = -1;

        return new Promise<number>((resolve, reject) => {

            BoardGamesDB.ScoreDB.findOne({
                where: {
                    player_id: player.id,
                    game_id: gameId
                }
            })
            .then(scoreRow => {
                if (scoreRow !== null) {
                    if (scoreRow.id !== undefined && scoreRow.id !== null) {
                        scoreId = scoreRow.id;
                    }
                    resolve(scoreId);
                }
                else {
                    resolve(scoreId);
                }
            })
            .catch(error => {
                reject(error);
            });
        });

    }

    public static getScoreFromScoreTableForPlayer(player: Player, gameId: number): Promise<number> {

        let score: number = 0;

        return new Promise<number>((resolve, reject) => {

            BoardGamesDB.ScoreDB.findOne({
                where: {
                    player_id: player.id,
                    game_id: gameId
                }
            })
            .then(scoreRow => {

                if (scoreRow !== null) {
                    if (scoreRow.score !== undefined && scoreRow.score !== null) {
                        score = scoreRow.score;
                    }
                }
                
                resolve(score);
            })
            .catch(error => {
                reject(error);
            });
        });

    }

    private static insertScore(player: Player, gameId: number, score: number): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {

            BoardGamesDB.ScoreDB.create({
                player_id: player.id,
                game_id: gameId,
                score: score
            })
            .then(() => {
                resolve(true);
            })
            .catch(error => {
                reject(error);
            });

        });

    }

    private static updateScore(scoreId: number, newScore: number): Promise<boolean> {

        return new Promise<boolean>((resolve, reject) => {
            
            let currentScore: number = 0;

            BoardGamesDB.getScoreFromScoreId(scoreId)
            .then(scoreFound => {
                currentScore = scoreFound;

                BoardGamesDB.ScoreDB.update({
                    score: currentScore + newScore
                },
                {
                    where: {
                        id: scoreId
                    }
                })
                .then(() => {
                    resolve(true);
                })
                .catch(error => {
                    reject(error);
                });
            })
            .catch(error => {
                reject(error);
            });

        });

    }

    public static getScoreFromScoreId(scoreId: number): Promise<number> {

        let scoreFound: number = 0;

        return new Promise<number>((resolve, reject) => {

            BoardGamesDB.ScoreDB.find({
                where: {
                    id: scoreId
                }
            })
            .then(rowFound => {
                scoreFound = rowFound.score;
                resolve(scoreFound);
            })
            .catch(error => {
                reject(error);
            });

        });

    }

    public static getBestScores(gameId: number, count: number): Promise<Array<Score>> {
        
        let scores: Array<Score> = new Array<Score>();

        return new Promise<Array<Score>>((resolve, reject) => {

            BoardGamesDB.ScoreDB.findAll({
                include: [{
                    model: BoardGamesDB.PlayerDB
                }],
                where: {
                    game_id: gameId
                },
                order: [
                    ['score', 'DESC']
                ],
                limit: count
            })
            .then(scoreRows => {
                scoreRows.forEach(scoreFound => {
                    let updatedDate = new Date(scoreFound.updated_at);
                    let formattedDate = updatedDate.getFullYear() + "/" + (updatedDate.getMonth()+1) + "/" + updatedDate.getDate();
                    scores.push(new Score(scoreFound.player.name, scoreFound.score, formattedDate));
                });
                resolve(scores);
            })
            .catch(error => {
                reject(error);
            });

        });

    }

}
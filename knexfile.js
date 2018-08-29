// Update with your config settings.

module.exports = {

  /*development: {
    client: 'postgresql',
    connection: {
      database: 'testDB1',
      password: 'admin'
    },
    debug: true
  },*/

  development: {
    client: 'postgresql',
    connection: {
      database: 'BoardGamesDB',
      password: 'admin'
    },
    debug: true
  },

  production: {
    client: 'postgresql',
    connection: process.env.HEROKU_POSTGRESQL_GRAY_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};

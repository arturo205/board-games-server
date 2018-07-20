// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      database: 'testDB1',
      password: 'admin'
    },
    debug: true
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'postgres://gjnycjqoeqakrm:f180de86d7f9f7ea8b4e16592c326ac5c755e991390208fa2888ddd1da9ee189@ec2-54-83-33-213.compute-1.amazonaws.com:5432/dbccu8ef4cqr81',
      user:     'kmzhsfvxdstaxl',
      password: 'f5dec8a5020030bb83a50daeca810a72564d1ed1ae5835926accac617c3d26fe'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};

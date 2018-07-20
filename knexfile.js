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
      database: 'postgres://kmzhsfvxdstaxl:f5dec8a5020030bb83a50daeca810a72564d1ed1ae5835926accac617c3d26fe@ec2-50-16-196-238.compute-1.amazonaws.com:5432/d9mbp666mha5f2',
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

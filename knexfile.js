// Update with your config settings.
// createdb documents_dev -h 127.0.0.1
// dropdb documents_dev -h 127.0.0.1

// knex migrate:latest
// knex migrate:rollback

module.exports = {
  test: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      database: 'documents_test',
      user:     'mikemoore',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  development: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      database: 'documents_dev',
      user:     'mikemoore',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

};

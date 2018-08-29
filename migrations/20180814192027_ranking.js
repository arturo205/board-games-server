
exports.up = function(knex, Promise) {
    return knex.schema
        .createTable('games', function (table) {
            table.increments('id').unsigned().primary();
            table.string('name', 30).notNull().unique();
            table.integer('min_players').notNull();
            table.integer('max_players').notNull();
            table.dateTime('created_at').notNull().defaultTo(knex.fn.now());
            table.dateTime('updated_at').nullable().defaultTo(knex.fn.now());
            table.dateTime('deleted_at').nullable();
        })
        .createTable('score', function (table) {
            table.increments('id').unsigned().primary();
            table.integer('player_id').notNull().unsigned().references('id').inTable('players');
            table.integer('game_id').notNull().unsigned().references('id').inTable('games');
            table.integer('score').notNull();
            table.dateTime('created_at').notNull().defaultTo(knex.fn.now());
            table.dateTime('updated_at').nullable().defaultTo(knex.fn.now());
            table.dateTime('deleted_at').nullable();
        });
};

exports.down = function(knex, Promise) {
    return knex.schema
        .dropTable('games')
        .dropTable('score');
};

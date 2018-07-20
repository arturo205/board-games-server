
exports.up = function (knex, Promise) {
    return knex.schema.createTable('players', function (table) {
        table.increments('id').unsigned().primary();
        table.string('name', 20).notNull().unique();
        table.string('password', 20).notNull();
        table.integer('color_id').nullable();
        table.integer('icon_id').nullable();
        table.dateTime('created_at').notNull().defaultTo(knex.fn.now());
        table.dateTime('updated_at').nullable().defaultTo(knex.fn.now());
        table.dateTime('deleted_at').nullable();
    });
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('players');
};

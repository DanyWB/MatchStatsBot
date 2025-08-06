exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.bigInteger('telegram_id').primary();
    table.string('role').notNullable().defaultTo('user'); // 'user', 'admin'
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
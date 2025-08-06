exports.up = function(knex) {
  return knex.schema.createTable('rounds', function(table) {
    table.increments('id').primary();
    table.integer('tournament_id').references('id').inTable('tournaments').onDelete('CASCADE');
    table.integer('number').notNullable();
    table.unique(['tournament_id', 'number']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('rounds');
};
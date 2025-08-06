exports.up = function(knex) {
  return knex.schema.createTable('match_stats', function(table) {
    table.increments('id').primary();
    table.integer('match_id').references('id').inTable('matches').onDelete('CASCADE');
    table.integer('attribute_id').references('id').inTable('attributes').onDelete('CASCADE');
    table.string('value_team1');
    table.string('value_team2');
    table.unique(['match_id', 'attribute_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('match_stats');
};
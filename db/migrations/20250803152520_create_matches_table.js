exports.up = function(knex) {
  return knex.schema.createTable('matches', function(table) {
    table.increments('id').primary();
    table.integer('tournament_id').references('id').inTable('tournaments').onDelete('CASCADE');
    table.integer('round_id').references('id').inTable('rounds').onDelete('SET NULL');
    table.integer('team1_id').references('id').inTable('teams');
    table.integer('team2_id').references('id').inTable('teams');
    table.integer('stadium_id').references('id').inTable('stadiums');
    table.date('date');
    table.time('time');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('matches');
};
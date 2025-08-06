exports.up = function(knex) {
  return knex.schema.createTable('sessions', function(table) {
    table.bigInteger('telegram_id').primary();
    table.jsonb('data').defaultTo('{}');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    table.string('schema_version').defaultTo('1');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('sessions');
};
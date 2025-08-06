exports.up = function(knex) {
  return knex.schema.createTable('attribute_groups', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('attribute_groups');
};
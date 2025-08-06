exports.up = function(knex) {
  return knex.schema.createTable('attributes', function(table) {
    table.increments('id').primary();
    table.integer('group_id').references('id').inTable('attribute_groups').onDelete('CASCADE');
    table.string('name').notNullable();
    table.unique(['group_id', 'name']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('attributes');
};
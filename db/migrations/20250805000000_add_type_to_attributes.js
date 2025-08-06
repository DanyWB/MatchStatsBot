// migrations/20250805_add_type_to_attributes.js
exports.up = function(knex) {
  return knex.schema.alterTable('attributes', table => {
    table.enu('type', ['double', 'triple']).defaultTo('double').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('attributes', table => {
    table.dropColumn('type');
  });
};

// migrations/20250805_add_total_value_to_match_stats.js
exports.up = function(knex) {
  return knex.schema.alterTable('match_stats', table => {
    table.string('value_total').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('match_stats', table => {
    table.dropColumn('value_total');
  });
};

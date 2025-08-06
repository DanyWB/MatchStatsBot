exports.up = function (knex) {
  return knex.schema.table("teams", function (table) {
    table.string("file_name_logo").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("teams", function (table) {
    table.dropColumn("file_name_logo");
  });
};

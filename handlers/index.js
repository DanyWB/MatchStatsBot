module.exports = (bot, knex) => {
  require('./attribute_handler')(bot);
  require('./match_handler')(bot);
  require('./stats_handler')(bot);
  require('./tournament_handler')(bot);

};
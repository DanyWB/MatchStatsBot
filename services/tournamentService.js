const db = require('../db/connect');

async function createTournament(name) {
  await db('tournaments').insert({ name });
}

module.exports = {
  createTournament,
};
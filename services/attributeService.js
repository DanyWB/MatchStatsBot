const db = require('../db/connect');

async function createAttribute(group_id, name,type) {
  const exists = await db('attributes').where({ group_id, name }).first();
  if (exists) {
    throw new Error('Такой атрибут уже существует в группе');
  }

  await db('attributes').insert({ group_id, name,type });
}

module.exports = {
  createAttribute,
};

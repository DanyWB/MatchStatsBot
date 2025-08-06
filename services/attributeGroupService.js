const db = require('../db/connect');

async function createGroup(name) {
  const exists = await db('attribute_groups').where({ name }).first();
  if (exists) {
    throw new Error('Группа с таким названием уже существует');
  }

  await db('attribute_groups').insert({ name });
}
async function findGroup(id) {

  const group = await db('attribute_groups').where({id}).first();
  if (!group) {
    return false;
  }
  return group;
}




module.exports = {
  createGroup,
  findGroup,
};

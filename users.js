const bcrypt = require('bcrypt');

const { insertUser, usernameFound, idFound, selectUsers, updateUser } = require('./db');

async function comparePasswords(password, user) {
  const ok = await bcrypt.compare(password, user.password);
  if (ok) {
    return user;
  }

  return false;
}

async function insert(data) {
  const hashedPassword = await bcrypt.hash(data.password, 13);
  const values = [data.username, hashedPassword, data.name, data.email];
  if (data) {
    return insertUser(values);
  }

  return false;
}

async function allUsers() {
  const found = await selectUsers();

  if (found) {
    return Promise.resolve(found);
  }

  return Promise.resolve(null);
}

async function findByUsername(username) {
  const found = await usernameFound(username);
  if (found) {
    return Promise.resolve(found[0]);
  }

  return Promise.resolve(null);
}

async function findById(id) {
  const found = await idFound(id);

  if (found) {
    return Promise.resolve(found[0]);
  }

  return Promise.resolve(null);
}
async function changeAdmin(username) {
  if (username) {
    res = await updateUser(username);
  }

  return false;
}

module.exports = {
  comparePasswords,
  findByUsername,
  findById,
  insert,
  allUsers,
  changeAdmin,
};

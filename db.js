const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function query(q, values = []) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(q, values);

    return result;
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

async function insertUser(values) {
  const q = `
INSERT INTO users
(username, password, name, email)
VALUES
($1, $2, $3, $4)`;

  return query(q, values);
}

async function insert(data) {
  const q = `
INSERT INTO applications
(name, email, phone, text, job)
VALUES
($1, $2, $3, $4, $5)`;
  const values = [data.name, data.email, data.phone, data.text, data.job];

  return query(q, values);
}

async function select() {
  const result = await query('SELECT * FROM applications ORDER BY id');

  return result.rows;
}

async function selectUsers() {
  const result = await query('SELECT * FROM users ORDER BY id');

  return result.rows;
}

async function selectAdmins() {
  const result = await query('SELECT * FROM users WHERE admin = true ORDER BY id');

  return result.rows;
}

async function update(id) {
  const q = `
UPDATE applications
SET processed = true, updated = current_timestamp
WHERE id = $1`;

  return query(q, [id]);
}

async function deleteRow(id) {
  const q = 'DELETE FROM applications WHERE id = $1';
  return query(q, [id]);
}
// username er unique
async function usernameFound(username) {
  const q = 'SELECT * FROM users WHERE userName like $1';
  const result = await query(q, [username]);
  return result.rows;
}

async function idFound(id) {
  const q = 'SELECT * FROM users WHERE id = $1';
  const result = await query(q, [id]);
  return result.rows;
}

async function updateUser(username) {
  let values = username;
  if (!(values instanceof Array)) {
    values = [values];
  }

  const q1 = `
  UPDATE users
  SET admin = false WHERE admin = true`;
  await query(q1);
  const q2 = 'UPDATE users SET admin = true WHERE username = $1';
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < values.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    await query(q2, [values[i]]);
  }
}


module.exports = {
  query,
  insert,
  select,
  update,
  deleteRow, // delete er frátekið orð
  selectUsers,
  selectAdmins,
  usernameFound,
  idFound,
  insertUser,
  updateUser,
};

const express = require('express');

const { allUsers, changeAdmin } = require('./users');

const router = express.Router();


async function getUsers(req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  const myList = await allUsers();

  const data = {
    title: 'Notendur',
    username: 'Notendanafn',
    name: 'Nafn',
    email: 'Netfang',
    list: myList,
    path: 'admin',
  };
  return res.render('admin', data);
}

async function changeUsers(req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  if (req.user.admin) {
    const username = req.body.admin;

    await changeAdmin(username);
  }
  return getUsers(req, res);
}

router.get('/', getUsers);
router.post('/', changeUsers);

module.exports = router;

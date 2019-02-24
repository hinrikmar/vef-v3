const xss = require('xss');
const express = require('express');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const { insert } = require('./users');
const { usernameFound } = require('./db');

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * Hjálparfall sem XSS hreinsar reit í formi eftir heiti.
 *
 * @param {string} fieldName Heiti á reit
 * @returns {function} Middleware sem hreinsar reit ef hann finnst
 */
function sanitizeXss(fieldName) {
  return (req, res, next) => {
    if (!req.body) {
      next();
    }

    const field = req.body[fieldName];

    if (field) {
      req.body[fieldName] = xss(field);
    }

    next();
  };
}

const router = express.Router();


const validations = [
  check('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),

  check('email')
    .isLength({ min: 1 })
    .withMessage('Netfang má ekki vera tómt'),

  check('email')
    .isEmail()
    .withMessage('Netfang verður að vera netfang'),

  check('username')
    .isLength({ min: 1 })
    .withMessage('Notednanafn má ekki vera tómt'),

  check('username')
    .custom(
      async (val) => {
        const result = await usernameFound(val);
        return !(result.name === val);
      },
    ).withMessage('Notendanafn er nú þegar til'),

  check('password')
    .isLength({ min: 8 })
    .withMessage('Lykilorð verður að vera amk. 8 stafir'),

  check('passwordAgain')
    .isLength({ min: 8 })
    .withMessage('Lykilorð verður að vera amk. 8 stafir'),

  check('password')
    .custom((val, { req }) => val === req.body.passwordAgain)
    .withMessage('Lykilorðin verða að vera eins'),
];

// Fylki af öllum hreinsunum fyrir umsókn
const sanitazions = [
  sanitize('name').trim().escape(),
  sanitizeXss('name'),

  sanitizeXss('email'),
  sanitize('email').trim().normalizeEmail(),

  sanitizeXss('username'),
  sanitize('username'),

  sanitizeXss('password'),
  sanitize('password'),

  sanitizeXss('passwordAgain'),
  sanitize('passwordAgain'),
];

function showErrors(req, res, next) {
  const {
    body: {
      name = '',
      email = '',
      username = '',
      password = '',
      passwordAgain = '',
    } = {},
  } = req;

  const data = {
    name,
    email,
    username,
    password,
    passwordAgain,
    path: 'register',
  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.array();
    data.errors = errors;
    data.title = 'Nýskráning – vandræði';

    return res.render('register', data);
  }

  return next();
}

async function registerPost(req, res) {
  const {
    body: {
      name = '',
      email = '',
      username = '',
      password = '',
      passwordAgain = '',
    } = {},
  } = req;

  const data = {
    name,
    email,
    username,
    password,
    passwordAgain,
  };
  await insert(data);

  return res.redirect('/applications');
}

function register(req, res) {
  const data = {
    title: 'Nýskráning',
    name: '',
    email: '',
    username: '',
    password: '',
    passwordAgain: '',
    errors: [],
    path: 'register',
  };
  return res.render('register', data);
}

router.get('/', register);

router.post(
  '/',
  // Athugar hvort form sé í lagi
  validations,
  // Ef form er ekki í lagi, birtir upplýsingar um það
  showErrors,
  // Öll gögn í lagi, hreinsa þau
  sanitazions,
  // Senda gögn í gagnagrunn
  catchErrors(registerPost),
);

module.exports = router;

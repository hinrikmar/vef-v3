require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-local');

const users = require('./users');
const apply = require('./apply');
const register = require('./register');
const admin = require('./admin');
const applications = require('./applications');

/* todo sækja stillingar úr env */
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  console.error('Add SESSION_SECRET to .env');
  process.exit(1);
}

const app = express();

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  maxAge: 30 * 60 * 1000,
}));

app.use(express.urlencoded({ extended: true }));

/* todo stilla session og passport */

app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Middleware sem grípa á villur fyrir
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors) {
  return Boolean(errors.find(i => i.param === field));
}

app.locals.isInvalid = isInvalid;

/* todo setja upp login og logout virkni */

function thanks(req, res) {
  res.redirect('/login');
}

function thanksApplicaton(req, res) {
  res.render('thanks', { title: 'Takk fyrir umsóknina', page: 'thanks' });
}

function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { 
    page: 'error', title: '404', error: '404 fannst ekki', path: 'error',
  });
}

function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', {
    page: 'error', title: 'Villa', error, path: 'error',
  });
}

async function start(username, password, done) {
  try {
    const user = await users.findByUsername(username);
    if (!user) {
      return done(null, false);
    }
    const result = await users.comparePasswords(password, user);
    return done(null, result);
  } catch (err) {
    return done(null, err);
  }
}

passport.use(new Strategy(start));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
    res.locals.login = req.isAuthenticated();
    res.locals.isAdmin = req.user.admin;
  }
  next();
});

app.use('/', apply);

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/applications', applications);
  }
  return res.redirect('/login');  
});

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
  // og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }
  console.log(message);
  const data = {
    title: 'innskraning', 
    username: '', 
    password: '', 
    errors: message, 
    path: 'login',
  };
  res.render('login', data);
});

app.post('/login',
  passport.authenticate('local', {
    failureMessage: 'Notandi eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),
  (req, res) => {
    res.redirect('/applications');
  },
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.use('/thanks', thanksApplicaton);
app.get('/thanks', thanks);
// app.use('/', apply);
app.use('/register', register);
app.use('/applications', applications);
app.use('/admin', admin);


app.use(notFoundHandler);
app.use(errorHandler);

const {
  HOST: hostname = '127.0.0.1',
  PORT: port = 3000,
} = process.env;

console.info(process.env);

app.listen(port, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});

import express from 'express';
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import {db, User} from '../db';
import {Hasher} from '../hasher';

export const router = express.Router();
const hasher = new Hasher();

passport.use(
  new LocalStrategy(
    {usernameField: 'login', passwordField: 'pass'},
    (username, password, done) => {
      db.users
        .findOne({username: username})
        .then(user => {
          if (!user) return done(null, false);
          const {passHash} = (user as unknown) as User;
          hasher
            .comparePass(password, passHash)
            .then(good => {
              return done(null, good ? user : false);
            })
            .catch(err => {
              return done(err);
            });
        })
        .catch(err => {
          return done(err);
        });
    }
  )
);

passport.serializeUser((user: {_id: string}, done) => done(null, user._id));
passport.deserializeUser(async (id, done) =>
  done(null, await db.users.findOne({_id: id}))
);
/* GET home page. */
router.get('/', (req, res) => {
  return res.render('index');
});

router.get('/login', (req, res) => {
  return res.render('login', {csrfToken: req.csrfToken()});
});

router.post(
  '/login',
  passport.authenticate('local', {failureRedirect: '/login'}),
  (req, res) => {
    return res.redirect('/');
  }
);

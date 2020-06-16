import express, {NextFunction, Request, Response} from 'express';
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
// Global user proxy for templates
router.use((req, res, next) => {
  res.locals.user = req.user ? req.user : null;
  next();
});
// Authentication middleware for protected routes.
function requireAuth(req: Request, res: Response, next: NextFunction) {
  return req.isAuthenticated() ? next() : res.redirect('/login');
}

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

router.get('/logout', requireAuth, (req, res) => {
  req.logout();
  return res.redirect('/');
});

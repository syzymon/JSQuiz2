import express, {NextFunction, Request, Response} from 'express';
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import {db, Quiz, QuizResults, User} from '../src/db';
import {Hasher} from '../src/hasher';
import {Evaluation, Evaluator} from '../src/quiz_checker';
import createError from 'http-errors';

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

router.get('/quiz', requireAuth, async (req, res, next) => {
  const quizId = Number(req.query.id);
  // TODO: check if done previously by req.user
  let quiz: Quiz;
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    quiz = await db.quizzes.findOne({id: quizId}, {_id: 0});
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const done = await db.results.count({userId: req!.user!._id});
    if (done) return next(createError(403, 'Quiz already done'));
  } catch (err) {
    return next(createError(404, err));
  }
  req!.session!.startedAt = Date.now();
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  quiz.questions.forEach(question => delete question.answer);
  return res.render('quiz', {quiz: quiz, csrfToken: req.csrfToken()});
});

async function quizAverageTimes(quiz: Quiz): Promise<Map<number, number>> {
  const quizResults = await db.results.find({quizId: quiz.id}, {answers: 1});
  return new Map(
    quiz.questions.map(question => {
      const timeSum = quizResults.reduce((sum, currentValue) => {
        const getQuestionTime = (doc: QuizResults) =>
          doc.answers.filter(ans => ans.question.id === question.id)[0]
            .timeSpent as number;
        return sum + getQuestionTime((currentValue as unknown) as QuizResults);
      }, 0);
      return [question.id, timeSum / quiz.questions.length];
    })
  );
}

async function getTopScores(quiz: Quiz) {
  return db.results.find({quizId: quiz.id}).sort({timeMs: 1}).limit(5);
}

router.post('/quiz/:id', requireAuth, async (req, res, next) => {
  const quizId = Number(req.params.id);
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const userId = req!.user!._id as string;
  const startedAt = req.session!.startedAt as number;
  if (!startedAt)
    return next(createError(403, 'No information about quiz start'));
  const alreadyExists = await db.results.count({
    userId: userId,
    quizId: quizId,
  });
  if (alreadyExists) return next(createError(403, 'Quiz already done'));
  const quizTimeScore = Date.now() - startedAt;

  const quiz = (await db.quizzes.findOne({id: quizId})) as Quiz;
  const results = {
    quizId: quizId,
    userId: userId,
    answers: JSON.parse(req.body.results),
    timeMs: quizTimeScore,
  } as QuizResults;
  const evaluator = new Evaluator(quiz, results);
  results.timeMs += evaluator.penalty * 1000; // seconds to ms

  await db.results.insert(results);
  const avgTimes = await quizAverageTimes(quiz);
  const topResults = ((await getTopScores(quiz)) as unknown) as QuizResults[];
  const evaluation = evaluator.getCompleteEvaluation(avgTimes, topResults);
  return res.render('stats', {stats: [evaluation]});
});

router.get('/stats', requireAuth, async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const r = (await db.results.find({userId: req!.user!._id})) as QuizResults[];
  const evaluations = (await Promise.all(
    r.map(async result => {
      const quiz = (await db.quizzes.findOne({
        id: result.quizId,
      })) as Quiz;
      const avgTimes = await quizAverageTimes(quiz);
      const topResults = ((await getTopScores(
        quiz
      )) as unknown) as QuizResults[];
      const evaluator = new Evaluator(quiz, result);
      return evaluator.getCompleteEvaluation(avgTimes, topResults);
    })
  )) as Evaluation[];
  return res.render('stats', {stats: evaluations});
});

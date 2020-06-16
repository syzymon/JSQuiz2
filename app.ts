import createError, {HttpError} from 'http-errors';
import express, {Request, Response} from 'express';
import {join} from 'path';
import cookieParser from 'cookie-parser';
import {store} from './src/session_store';
import logger from 'morgan';
import nunjucks from 'nunjucks';
import {router as indexRouter} from './routes';
import session from 'express-session';
import passport from 'passport';
import csurf from 'csurf';

const app = express();
// view engine setup
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'html');
nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(csurf({cookie: true}));
app.use(
  session({
    secret: 'super secret',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 15 * 60 * 1000},
    store: store,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(join(__dirname, '/../public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err: HttpError, req: Request, res: Response) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import passport from 'passport';
import nodeSassMiddleware from 'node-sass-middleware';
import expressSession from 'express-session';

import config from './config';
import routes from './routes';

const app = express();

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'jade');

// session definition
app.set('expressSession', expressSession({ secret: config.express.session.secret, resave: true, saveUninitialized: true }));

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, '..', 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(nodeSassMiddleware({
  src: path.join(__dirname, '../sass'),
  dest: path.join(__dirname, '../public'),
  indentedSyntax: false,
  outputStyle: 'compressed'
}));
app.use(express.static(path.join(__dirname, '../public')));
app.use(app.get('expressSession'));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

export default app;
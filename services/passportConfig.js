var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var fbgraph = require('fbgraph');
var config = require('../config');
var log = require('../services/log');

var host = config.site.host.dev;
if(process.env.MODE == 'dev_c9') {
	host = config.site.host.c9;
}

module.exports = function(passport) {
	var User = require('../models/user');
	
	passport.serializeUser(function(user, done) {
		log.d('passport.serializeUser >> user.id', user.id);
		done(null, user.id);
	});

	passport.deserializeUser(function(userId, done) {
		log.d('passport.deserializeUser >> id', userId);
		User.findById(userId)
		.then(function (user) {
			done(null, user);
		}, function(err) {
			log.e(err);
		});
	});
	
	passport.use(new LocalStrategy(
		function(email, password, done) {
			// asynchronous verification, for effect...
			process.nextTick(function () {
				// Find the user by username.  If there is no user with the given
				// username, or the password is not correct, set the user to `false` to
				// indicate failure and set a flash message.  Otherwise, return the
				// authenticated `user`.
				User.find({ 'local.email': email }, function(err, user) {
					if (err) {
						return done(err);
					}
					
					if (!user) {
						return done(null, false, {
							message: 'Unknown user ' + email
						});
					}
					
					if (user.password != password) {
						return done(null, false, {
							message: 'Invalid password'
						});
					}
					
					return done(null, user);
				});
			});
		}
	));

	passport.use(new FacebookStrategy({
		clientID: config.passport.clientID,
		clientSecret: config.passport.clientSecret,
		callbackURL: host + config.passport.callbackURL
	}, function(accessToken, refreshToken, profile, done) {
		var dados = profile._json;
		log.d('profile json', dados);
		
		var email = '';
		
		email = (function* () {
			fbgraph.get('/me', { access_token: accessToken, fields: 'email' }, function*(err, res) {
				if(err) {
					log.e(err);
					done(err);
				}
				log.d('fbgraph.me', res);
				yield res.email;
			});
		})().next().data;
		
		log.d('email', email);
		
		var whereClause = { 
			where : { 
				$or: [
					{ facebookId : dados.id },
					{ email: dados.email }
				]
			}
		};
		
		log.d('whereClause', whereClause);
		
		User.findOne(whereClause).then(function(user) {
			if(user) {
				user = user.get();
	  			log.d('user data values', user);
	  			
	  			return done(null, user);
			} else {
				user = User.build({
					name: dados.name,
					email: dados.email,
					facebookId: dados.id
				}).save().then(function() {
					log.d('User.findOne >> save', user);
					return done(null, user);
				}, function(err) {
					log.e(err);
					return done(err);
				});
			}
		}, function(err) {
			log.e('user.findOne:', whereClause, err);
			return done(err);
		});
	}));
};
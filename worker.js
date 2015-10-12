if(process.env.NEW_RELIC_LICENSE_KEY) require('newrelic')

var express = require('express')
var path    = require('path')
var fs      = require('fs')
var minify  = require('express-minify')
var favicon = require('serve-favicon')
var cookie  = require('cookie-parser')
var random  = require('randomstring')
var bparser = require('body-parser')
var raven   = require('raven')
var i18n    = require('./helpers/i18n')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))



// global variables (and list of all used environment variables)
APP_VERSION        = process.env.VERSION || require('./package').version
APP_DEBUG          = process.env.DEBUG
APP_PORT           = process.env.PORT
APP_CACHE_DIR      = process.env.CACHEDIR || path.join(__dirname, 'cache')
APP_COOKIE_SECRET  = process.env.COOKIE_SECRET || random.generate(16)
APP_ENTU_URL       = process.env.ENTU_URL || 'https://helpific.entu.ee/api2'
APP_ENTU_USER      = process.env.ENTU_USER
APP_ENTU_KEY       = process.env.ENTU_KEY
APP_SENTRY         = process.env.SENTRY_DSN
APP_DEFAULT_LOCALE = 'en'
APP_TIMEZONE       = 'Europe/Tallinn'



// ensure cache directory exists
fs.existsSync(APP_CACHE_DIR) || fs.mkdirSync(APP_CACHE_DIR)



// Configure i18n
i18n.configure({
    locales: ['en', 'et', 'ru'],
    defaultLocale: APP_DEFAULT_LOCALE,
    redirectWrongLocale: true,
    file: path.join(__dirname, 'locales.yaml'),
    updateFile: true
})



// initialize getsentry.com client
var raven_client = new raven.Client({
    release: APP_VERSION,
    dataCallback: function(data) {
        delete data.request.env
        return data
    }
})



// start express app
var app = express()
    // get correct client IP behind nginx
    .set('trust proxy', true)

    // jade view engine
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'jade')

    // logs to getsentry.com - start
    .use(raven.middleware.express.requestHandler(raven_client))

    // cookies
    .use(cookie(APP_COOKIE_SECRET))

    // parse POST requests
    .use(bparser.json())
    .use(bparser.urlencoded({extended: true}))

    // use express-minify to minify css/js
    .use(minify({
        js_match: /javascript/,
        stylus_match: /stylus/,
        json_match: /do_not_cache_json/,
        cache: APP_CACHE_DIR
    }))

    // static files path & favicon
    .use(express.static(path.join(__dirname, 'public')))
    .use(favicon(path.join(__dirname, 'public', 'images', 'helpific-logo.ico')))

    // redirects
    .use('/piiridetaelu', function(req, res, next) {
        res.redirect('/et/bb')
    })

    // initiate i18n
    .use(i18n.init)

    // set defaults for views
    .use(function(req, res, next) {
        res.locals.path = req.path
        if(!req.signedCookies) next(null)
        if(req.signedCookies.auth_id && req.signedCookies.auth_token) {
            res.locals.user = {
                id: parseInt(req.signedCookies.auth_id),
                token: req.signedCookies.auth_token
            }
        }

        res.authenticate = function() {
            if(!res.locals.user) {
                res.cookie('redirect_url', '/' + res.locals.path.split('/').slice(2).join('/'), {signed:true, maxAge:1000*60*60})
                res.redirect('/' + res.locals.lang + '/signin')
                return false
            } else {
                return true
            }

        }

        next(null)
    })

    // routes mapping
    .use('/:lang',          require('./routes/index'))
    .use('/:lang/help',     require('./routes/help'))
    .use('/:lang/messages', require('./routes/messages'))
    .use('/:lang/profile',  require('./routes/profile'))
    .use('/:lang/signin',   require('./routes/signin'))
    .use('/:lang/users',    require('./routes/users'))

    // logs to getsentry.com - error
    .use(raven.middleware.express.errorHandler(raven_client))

    // show 404
    .use(function(req, res, next) {
        res.render('error', {
            title: 404,
            message: '',
            error: {}
        })
    })

    // show error
    .use(function(err, req, res, next) {
        if(APP_DEBUG) debug(err)
        res.render('error', {
            message: err.message,
            error: APP_DEBUG ? err : {}
        })
    })

    // start servers if ports are set
    .listen(APP_PORT, function() {
        debug('Started listening port ' + APP_PORT)
    })

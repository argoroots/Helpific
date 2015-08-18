if(process.env.NEW_RELIC_LICENSE_KEY) require('newrelic')

var express = require('express')
var helmet  = require('helmet')
var https   = require('https')
var http    = require('http')
var path    = require('path')
var fs      = require('fs')
var logger  = require('morgan')
var rotator = require('file-stream-rotator')
var stylus  = require('stylus')
var favicon = require('serve-favicon')
var cookie  = require('cookie-parser')
var random  = require('randomstring')
var bparser = require('body-parser')
var i18n    = require('./helpers/i18n')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))



// global variables (and list of all used environment variables)
APP_DEBUG     = process.env.DEBUG
APP_PORT      = process.env.PORT
APP_PORT_SSL  = process.env.PORT_SSL
APP_LOG_DIR   = process.env.LOGDIR || path.join(__dirname, 'log')
APP_COOKIE_SECRET = process.env.COOKIE_SECRET || random.generate(16)
APP_ENTU_URL  = process.env.ENTU_URL || 'https://helpific.entu.ee/api2'
APP_ENTU_USER = process.env.ENTU_USER
APP_ENTU_KEY  = process.env.ENTU_KEY



// ensure log directory exists
fs.existsSync(APP_LOG_DIR) || fs.mkdirSync(APP_LOG_DIR)



// create a rotating write stream
var access_log_stream = rotator.getStream({
  filename: APP_LOG_DIR + '/access-%DATE%.log',
  frequency: 'daily',
  verbose: false,
  date_format: 'YYYY-MM-DD'
})



// ssl conf
var ssl_options = {
    key: fs.readFileSync(__dirname + '/ssl/helpific_com.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/ssl/helpific_com.crt', 'utf8'),
    ca: [
        // fs.readFileSync(__dirname + '/ssl/AddTrustExternalCARoot.crt', 'utf8'),
        fs.readFileSync(__dirname + '/ssl/COMODORSAAddTrustCA.crt', 'utf8'),
        fs.readFileSync(__dirname + '/ssl/COMODORSADomainValidationSecureServerCA.crt', 'utf8')
    ],
    ciphers: [
        'ECDHE-RSA-AES256-SHA384',
        'DHE-RSA-AES256-SHA384',
        'ECDHE-RSA-AES256-SHA256',
        'DHE-RSA-AES256-SHA256',
        'ECDHE-RSA-AES128-SHA256',
        'DHE-RSA-AES128-SHA256',
        'HIGH',
        '!aNULL',
        '!eNULL',
        '!EXPORT',
        '!DES',
        '!RC4',
        '!MD5',
        '!PSK',
        '!SRP',
        '!CAMELLIA'
    ].join(':'),
    honorCipherOrder: true
}



// Configure i18n
i18n.configure({
    locales: ['en', 'et', 'ru'],
    defaultLocale: 'en',
    redirectWrongLocale: true,
    file: path.join(__dirname, 'locales.yaml'),
    updateFile: true
})



var app = express()
    // get correct client IP behind nginx
    .set('trust proxy', true)

    // jade view engine
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'jade')

    // HSTS (for ssl)
    .use(helmet.hsts({
        maxAge: 1000 * 60 *60 *24 * 365,
        includeSubdomains: true,
        force: true
    }))

    // cookies
    .use(cookie(APP_COOKIE_SECRET))

    // parse POST requests
    .use(bparser.json())
    .use(bparser.urlencoded({extended: true}))

    // stylus to css converter
    .use(stylus.middleware({src: path.join(__dirname, 'public'), compress: true}))

    // static files path & favicon
    .use(express.static(path.join(__dirname, 'public')))
    .use(favicon(path.join(__dirname, 'public', 'images', 'helpific-logo.ico')))

    // logging
    .use(logger(':date[iso] | HTTP/:http-version | :method | :status | :url | :res[content-length] b | :response-time ms | :remote-addr | :referrer | :user-agent', {stream: access_log_stream}))

    //Initiate i18n
    app.use(i18n.init)

    // set defaults for views
    .use(function(req, res, next) {
        res.locals.path = req.path
        if(req.signedCookies.auth_id && req.signedCookies.auth_token) {
            res.locals.user = {
                id: req.signedCookies.auth_id,
                token: req.signedCookies.auth_token
            }
        }
        next(null)
    })

    // routes mapping
    .use('/:lang',       require('./routes/index'))
    .use('/:lang/users',  require('./routes/users'))
    .use('/:lang/help',   require('./routes/help'))
    .use('/:lang/signin', require('./routes/signin'))

    // 404
    .use(function(req, res, next) {
        var err = new Error('Not Found')
        err.status = 404
        next(err)
    })

    // error
    .use(function(err, req, res, next) {
        var status = parseInt(err.status) || 500

        res.status(status)
        res.render('error', {
            title: status,
            message: err.message,
            error: APP_DEBUG ? err : {}
        })

        if(err.status !== 404) debug(err)
    })



// start servers if ports are set
if(APP_PORT) {
    http.createServer(app).listen(APP_PORT)
    debug('HTTP started at port %s', APP_PORT)
}
if(APP_PORT_SSL) {
    https.createServer(ssl_options, app).listen(APP_PORT_SSL)
    debug('HTTPS started at port %s', APP_PORT_SSL)
}

var express = require('express')
var path    = require('path')
var logger  = require('morgan')
var stylus  = require('stylus')
var favicon = require('serve-favicon')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))



// global variables (and list of all used environment variables)
APP_DEBUG    = process.env.DEBUG
APP_PORT     = process.env.PORT || 3000
APP_ENTU_URL = process.env.ENTU || 'https://helpific.entu.ee/api2'



express()
    // jade view engine
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'jade')

    // stylus to css converter
    .use(stylus.middleware({src: path.join(__dirname, 'public'), compress: true}))

    // static files path & favicon
    .use(express.static(path.join(__dirname, 'public')))
    .use(favicon(path.join(__dirname, 'public', 'images', 'helpific-logo.ico')))

    // logging
    .use(logger('combined'))

    // routes mapping
    .use('/',         require('./routes/index'))
    .use('/profiles', require('./routes/profiles'))

    // 404
    .use(function(req, res, next) {
        var err = new Error('Not Found')
        err.status = 404
        next(err)
    })

    // error
    .use(function(err, req, res, next) {
        res.status(err.status || 500)
        res.render('error', {
            message: err.message,
            error: APP_DEBUG ? err : {}
        })
        if(err.status !== 404) debug(err)
    })

    // start server
    .listen(APP_PORT)



debug('Started at port %s', APP_PORT)

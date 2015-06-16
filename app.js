var express = require('express')
var path    = require('path')
var logger  = require('morgan')
var favicon = require('serve-favicon')
var debug   = require('debug')('app:server')

ENTU_URL    = 'https://helpific.entu.ee/api2'

express()
    // logging
    .use(logger('dev'))

    // jade & stylus middleware
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'jade')
    .use(require('stylus').middleware(path.join(__dirname, 'public')))

    // static files path & favicon
    .use(express.static(path.join(__dirname, 'public')))
    // .use(favicon(__dirname + '/public/favicon.ico'))

    // routes mapping
    .use('/',      require('./routes/index'))

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
            error: process.env.DEBUG ? err : {}
        })
        if(err.status !== 404) debug(err)
    })

    //start server
    .listen(getPort())



debug('Started at port %s', getPort())



// validate and return server port
function getPort() {
    if(parseInt(process.env.PORT)) {
        return parseInt(process.env.PORT)
    } else {
        return 3000
    }
}

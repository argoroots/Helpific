var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))

var entu    = require('./entu')



// GET home page
router.get('/', function(req, res, next) {
    entu.get_page(641, function(error, page) {
        if(error) return next(error)

        res.render('index', page)
    })
})



// GET partners page
router.get('/partners', function(req, res, next) {
    entu.get_page(643, function(error, page) {
        if(error) return next(error)

        entu.get_partners(function(error, partners) {
            if(error) return next(error)

            res.render('partners', page)
        })

    })
})



// GET team page
router.get('/team', function(req, res, next) {
    entu.get_page(644, function(error, page) {
        if(error) return next(error)

        res.render('index', page)
    })
})



// GET terms page
router.get('/terms', function(req, res, next) {
    entu.get_page(640, function(error, page) {
        if(error) return next(error)

        res.render('index', page)
    })
})



module.exports = router

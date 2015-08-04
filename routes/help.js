var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')

var entu    = require('./entu')



// GET requests listing
router.get('/requests', function(req, res, next) {
    entu.get_page(654, function(error, page) {
        if(error) return next(error)

        entu.get_entities(650, 'request', null, null, function(error, requests) {
            if(error) return next(error)

            page.requests = requests
            res.render('help', page)
        })
    })
})



// GET offers listing
router.get('/offers', function(req, res, next) {
    entu.get_page(655, function(error, page) {
        if(error) return next(error)

        entu.get_entities(651, 'request', null, null, function(error, requests) {
            if(error) return next(error)

            page.requests = requests
            res.render('help', page)
        })
    })
})



module.exports = router

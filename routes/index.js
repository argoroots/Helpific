var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))

var entu    = require('./entu')



// GET home page
router.get('/', function(req, res, next) {
    res.render('index')
})



// GET home page
router.get('/E13518FB248434854F2680AC1B00BFF9.txt', function(req, res, next) {
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8')
    res.status(200)
    res.send('301C4D8396D027DDF1E4A9124248E0538E32F6C7\nCOMODOCA.COM')
})



// GET partners page
router.get('/partners', function(req, res, next) {
    entu.get_entities(null, 'partner', null, null, function(error, partners) {
        if(error) return next(error)

        res.render('partners', {
            partners: partners
        })
    })
})



// GET team page
router.get('/team', function(req, res, next) {
    entu.get_entities(612, 'person', null, null, function(error, team) {
        if(error) return next(error)

        res.render('team', {
            team: team
        })
    })
})



// GET terms of service page
router.get('/tos', function(req, res, next) {
    res.render('tos')
})



module.exports = router

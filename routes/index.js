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

        entu.get_entities('partner', null, null, function(error, partners) {
            if(error) return next(error)

            page.partners = partners
            res.render('partners', page)
        })
    })
})



// GET team page
router.get('/team', function(req, res, next) {
    entu.get_page(644, function(error, page) {
        if(error) return next(error)

        entu.get_entity_childs(612, 'person', null, null, function(error, team) {
            if(error) return next(error)

            page.team = team
            res.render('team', page)
        })
    })
})



// GET terms of service page
router.get('/tos', function(req, res, next) {
    entu.get_page(640, function(error, page) {
        if(error) return next(error)

        res.render('tos', page)
    })
})



module.exports = router

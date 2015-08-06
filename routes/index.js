var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))

var entu    = require('./entu')



// GET home page
router.get('/', function(req, res, next) {
    res.render('index')
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
router.get('/terms', function(req, res, next) {
    res.render('terms')
})



// Send feedback
router.post('/feedback', function(req, res, next) {
    var properties = req.body
    if(req.signedCookies.auth_id) properties.person = req.signedCookies.auth_id

    entu.add(APP_ENTU_USER, 'feedback', properties, null, null, function(error, new_id) {
        if(error) return next(error)

        if(req.signedCookies.auth_id) {
            entu.rights(new_id, req.signedCookies.auth_id, 'owner', null, null, function(error, response) {
                if(error) return next(error)

                entu.rights(new_id, APP_ENTU_USER, '', null, null, function(error, response) {
                    if(error) return next(error)

                    res.setHeader('Content-Type', 'application/json')
                    res.status(200)
                    res.send(new_id)
                })
            })
        } else {
                entu.rights(new_id, APP_ENTU_USER, '', null, null, function(error, response) {
                    if(error) return next(error)

                    res.setHeader('Content-Type', 'application/json')
                    res.status(200)
                    res.send(new_id)
                })
        }
    })
})



module.exports = router

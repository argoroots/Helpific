var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))

var entu    = require('../helpers/entu')



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

        team.sort(function(obj1, obj2) {
            var o1 = obj1.get('forename.value', '') + ' ' + obj1.get('surname.value', '')
            var o2 = obj2.get('forename.value', '') + ' ' + obj2.get('surname.value', '')
            return (o1 > o2) ? 1 : -1
            return 0
        })

        res.render('team', {
            team: team
        })
    })
})



// GET terms of service page
router.get('/terms', function(req, res, next) {
    res.render('terms.' + res.locals.lang + '.jade')
})



// GET bb page
router.get('/bb', function(req, res, next) {
    res.render('bb.' + res.locals.lang + '.jade')
})



// Send feedback
router.post('/feedback', function(req, res, next) {
    var properties = req.body
    if(req.signedCookies.auth_id) properties['from-person'] = req.signedCookies.auth_id

    entu.add(APP_ENTU_USER, 'message', properties, null, null, function(error, new_id) {
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

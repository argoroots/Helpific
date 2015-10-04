var router  = require('express').Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))

var entu    = require('../helpers/entu')



// GET home page
router.get('/', function(req, res, next) {
    res.render('index')
})



// GET user own profile
router.get('/profile', function(req, res, next) {
    if(!res.authenticate()) return

    entu.get_entity(res.locals.user.id, res.locals.user.id, res.locals.user.token, function(error, profile) {
        if(error) return next(error)

        res.render('profile', {
            profile: profile
        })
    })
})



// GET messages page
router.get('/messages/:id*?', function(req, res, next) {
    if(!res.authenticate()) return

    res.render('messages')
})



// GET partners page
router.get('/partners', function(req, res, next) {
    entu.get_entities(null, 'partner', null, true, null, null, function(error, partners) {
        if(error) return next(error)

        res.render('partners', {
            partners: partners
        })
    })
})



// GET team page
router.get('/team', function(req, res, next) {
    entu.get_entities(612, 'person', null, true, null, null, function(error, team) {
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
    if(res.locals.user.id) properties['from-person'] = res.locals.user.id

    entu.add(APP_ENTU_USER, 'message', properties, null, null, function(error, new_id) {
        if(error) return next(error)

        if(res.locals.user.id) {
            entu.rights(new_id, res.locals.user.id, 'owner', null, null, function(error, response) {
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

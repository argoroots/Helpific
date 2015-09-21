var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')

var entu    = require('../helpers/entu')



// GET listing of messages with user
router.get('/:id', function(req, res, next) {
    if(!req.signedCookies.auth_id || !req.signedCookies.auth_token) {
        res.redirect('/' + res.locals.lang + '/signin')
        next(null)
        return
    }

    entu.get_entities(null, 'message', req.signedCookies.auth_id, req.signedCookies.auth_token, function(error, entities) {
        if(error) return next(error)

        messages = []
        for(var i in entities) {
            if(!entities[i].get('from-person.reference') || !entities[i].get('to-person.reference')) continue
            if(entities[i].get('from-person.reference') === parseInt(req.params.id) && entities[i].get('to-person.reference') === res.locals.user.id || entities[i].get('to-person.reference') === parseInt(req.params.id) && entities[i].get('from-person.reference') === res.locals.user.id) messages.push(entities[i])
        }

        messages.sort(function(obj1, obj2) {
            return (obj1.get('entu-created-at.value', '') > obj2.get('entu-created-at.value', '')) ? 1 : -1
            return 0
        })

        entu.get_entity(req.params.id, null, null, function(error, profile) {
            if(error) return next(error)

            res.render('messages', {
                profile: profile,
                messages: messages
            })
        })

    })
})



// Create request/offer
router.post('/:id', function(req, res, next) {
    if(!req.signedCookies.auth_id || !req.signedCookies.auth_token || !req.params.id) {
        res.status(403).send()
        return
    }

    var properties = req.body
    properties['from-person'] = req.signedCookies.auth_id
    properties['to-person'] = req.params.id

    entu.add(APP_ENTU_USER, 'message', properties, null, null, function(error, new_id) {
        if(error) return next(error)

        entu.rights(new_id, req.signedCookies.auth_id, 'owner', null, null, function(error, response) {
            if(error) return next(error)

            entu.rights(new_id, req.params.id, 'viewer', null, null, function(error, response) {
                if(error) return next(error)

                entu.rights(new_id, APP_ENTU_USER, '', null, null, function(error, response) {
                    if(error) return next(error)

                    res.setHeader('Content-Type', 'application/json')
                    res.status(200)
                    res.send(new_id)
                })
            })
        })

    })
})



module.exports = router

var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')
var async   = require('async')
var _       = require('underscore')

var entu    = require('../helpers/entu')



// GET listing of conversations
router.get('/json', function(req, res, next) {
    if(!req.signedCookies.auth_id || !req.signedCookies.auth_token) {
        res.redirect('/' + res.locals.lang + '/signin')
        next(null)
        return
    }

    var calls = {
        from: function(callback) {
            entu.get_entities(null, 'message', 'from.' + req.signedCookies.auth_id + '.', req.signedCookies.auth_id, req.signedCookies.auth_token, callback)
        },
        to: function(callback) {
            entu.get_entities(null, 'message', 'to.' + req.signedCookies.auth_id + '.', req.signedCookies.auth_id, req.signedCookies.auth_token, callback)
        },
    }

    if(req.query.id) calls.id = function(callback) {
        entu.get_entity(req.query.id, null, null, callback)
    }

    async.parallel(calls,
    function(err, results) {
        if(err) return next(err)

        conversations = {}

        if(results.id) {
            conversations[results.id.get('_id')] = {
                id: results.id.get('_id'),
                name: results.id.get('forename.value') + ' ' + results.id.get('surname.value'),
                picture: APP_ENTU_URL + '/entity-' + results.id.get('_id') + '/picture',
                date: null,
                message_id: 0
            }
        }

        for(var i in results.from) {
            if(conversations[results.from[i].get('to-person.reference')]) {
                if(conversations[results.from[i].get('to-person.reference')].message_id > results.from[i].get('_id')) continue
            }

            conversations[results.from[i].get('to-person.reference')] = {
                id: results.from[i].get('to-person.reference'),
                name: results.from[i].get('to-person.value'),
                picture: APP_ENTU_URL + '/entity-' + results.from[i].get('to-person.reference') + '/picture',
                date: results.from[i].get('_created'),
                message: results.from[i].get('message.value'),
                message_id: results.from[i].get('_id')
            }
        }

        for(var i in results.to) {
            if(conversations[results.to[i].get('from-person.reference')]) {
                if(conversations[results.to[i].get('from-person.reference')].message_id > results.to[i].get('_id')) continue
            }

            conversations[results.to[i].get('from-person.reference')] = {
                id: results.to[i].get('from-person.reference'),
                name: results.to[i].get('from-person.value'),
                picture: APP_ENTU_URL + '/entity-' + results.to[i].get('from-person.reference') + '/picture',
                date: results.to[i].get('_changed'),
                message: results.to[i].get('message.value'),
                message_id: results.to[i].get('_id')
            }
        }

        res.send(_.values(conversations))
    })
})


// GET conversation messages
router.get('/:id/json', function(req, res, next) {
    if(!req.signedCookies.auth_id || !req.signedCookies.auth_token) {
        res.redirect('/' + res.locals.lang + '/signin')
        next(null)
        return
    }

    async.parallel({
        from: function(callback) {
            entu.get_entities(null, 'message', 'from.' + req.params.id + '.to.' + req.signedCookies.auth_id + '.', req.signedCookies.auth_id, req.signedCookies.auth_token, callback)
        },
        to: function(callback) {
            entu.get_entities(null, 'message', 'from.' + req.signedCookies.auth_id + '.to.' + req.params.id + '.', req.signedCookies.auth_id, req.signedCookies.auth_token, callback)
        },
    },
    function(err, results) {
        if(err) return next(err)

        messages = []

        for(var i in results.from) {
            messages.push({
                to: true,
                name: results.from[i].get('from-person.value'),
                picture: APP_ENTU_URL + '/entity-' + results.from[i].get('from-person.reference') + '/picture',
                date: results.from[i].get('_created'),
                message: results.from[i].get('message.value'),
                message_id: results.from[i].get('_id')
            })
        }

        for(var i in results.to) {
            messages.push({
                from: true,
                name: results.to[i].get('from-person.value'),
                picture: APP_ENTU_URL + '/entity-' + results.to[i].get('from-person.reference') + '/picture',
                date: results.to[i].get('_changed'),
                message: results.to[i].get('message.value'),
                message_id: results.to[i].get('_id')
            })
        }

        res.send(messages)
    })
})



// GET messages page
router.get('/', function(req, res, next) {
    if(!req.signedCookies.auth_id || !req.signedCookies.auth_token) {
        res.redirect('/' + res.locals.lang + '/signin')
        next(null)
        return
    }

    res.render('messages')
})



// GET messages page
router.get('/:id', function(req, res, next) {
    if(!req.signedCookies.auth_id || !req.signedCookies.auth_token) {
        res.redirect('/' + res.locals.lang + '/signin')
        next(null)
        return
    }

    res.render('messages')
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
    properties['participants'] = 'from.' + req.signedCookies.auth_id + '.to.' + req.params.id + '.'

    entu.add(APP_ENTU_USER, 'message', properties, null, null, function(error, new_id) {
        if(error) return next(error)

        async.waterfall([
            function(callback) {
                entu.rights(new_id, req.signedCookies.auth_id, 'owner', null, null, callback)
            },
            function(result, callback) {
                entu.rights(new_id, req.params.id, 'viewer', null, null, callback)
            },
            function(result, callback) {
                entu.rights(new_id, APP_ENTU_USER, '', null, null, callback)
            },
            function(result, callback) {
                entu.get_entity(req.params.id, null, null, callback)
            },
            function(profile, callback) {
                if(profile.has('email.value')) {
                    entu.message(
                        profile.get('email.value'),
                        res.locals.t('message.email-subject'),
                        res.locals.t('message.email-message', req.signedCookies.auth_id),
                        'message',
                        req.signedCookies.auth_id,
                        req.signedCookies.auth_token,
                        callback
                    )
                } else {
                    callback(null)
                }
            }
        ],
        function(err, results) {
            if(err) return next(err)

            res.setHeader('Content-Type', 'application/json')
            res.status(200)
            res.send(new_id)
        })
    })
})



module.exports = router

var express = require('express')
var router  = express.Router()
var path    = require('path')
var debug   = require('debug')('app:' + path.basename(__filename).replace('.js', ''))
var request = require('request')
var async   = require('async')
var moment  = require('moment-timezone')
var _       = require('underscore')

var entu    = require('../helpers/entu')



// GET listing of conversations
router.get('/json', function(req, res, next) {
    if(!res.locals.user) {
        res.redirect('/' + res.locals.lang + '/signin')
        next(null)
        return
    }

    var calls = {
        from: function(callback) {
            entu.get_entities(null, 'message', 'from.' + res.locals.user.id + '.', res.locals.user.id, res.locals.user.token, callback)
        },
        to: function(callback) {
            entu.get_entities(null, 'message', 'to.' + res.locals.user.id + '.', res.locals.user.id, res.locals.user.token, callback)
        },
    }

    if(req.query.id) calls.id = function(callback) {
        entu.get_entity(req.query.id, null, null, callback)
    }

    moment.locale(res.locals.lang)

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
                ordinal: 'ZZZ'
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
                date: results.from[i].get('_changed'),
                relative_date: moment.utc(results.from[i].get('_changed')).tz(APP_TIMEZONE).fromNow(),
                message: results.from[i].get('message.value'),
                message_id: results.from[i].get('_id'),
                ordinal: results.from[i].get('_id')
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
                relative_date: moment.utc(results.to[i].get('_changed')).tz(APP_TIMEZONE).fromNow(),
                message: results.to[i].get('message.value'),
                message_id: results.to[i].get('_id'),
                ordinal: results.to[i].get('_id')
            }
        }

        res.send(_.values(conversations))
    })
})


// GET conversation messages
router.get('/:id/json', function(req, res, next) {
    if(!res.locals.user) {
        res.redirect('/' + res.locals.lang + '/signin')
        next(null)
        return
    }

    moment.locale(res.locals.lang)

    async.parallel({
        from: function(callback) {
            entu.get_entities(null, 'message', 'from.' + req.params.id + '.to.' + res.locals.user.id + '.', res.locals.user.id, res.locals.user.token, callback)
        },
        to: function(callback) {
            entu.get_entities(null, 'message', 'from.' + res.locals.user.id + '.to.' + req.params.id + '.', res.locals.user.id, res.locals.user.token, callback)
        },
    },
    function(err, results) {
        if(err) return next(err)

        messages = []
        days = {}

        for(var i in results.from) {
            var date = moment.utc(results.from[i].get('_changed')).tz(APP_TIMEZONE).calendar()
            var relative_date = moment.utc(results.from[i].get('_changed')).tz(APP_TIMEZONE).fromNow()
            days[relative_date] = {
                date: results.from[i].get('_created'),
                relative_date: relative_date,
                ordinal: results.from[i].get('_id')
            }
            messages.push({
                to: true,
                name: results.from[i].get('from-person.value'),
                picture: APP_ENTU_URL + '/entity-' + results.from[i].get('from-person.reference') + '/picture',
                date: date,
                relative_date: relative_date,
                message: results.from[i].get('message.value'),
                message_id: results.from[i].get('_id')
            })
        }

        for(var i in results.to) {
            var date = moment.utc(results.to[i].get('_changed')).tz(APP_TIMEZONE).calendar()
            var relative_date = moment.utc(results.to[i].get('_changed')).tz(APP_TIMEZONE).fromNow()
            days[relative_date] = {
                date: results.to[i].get('_changed'),
                relative_date: relative_date,
                ordinal: results.to[i].get('_id')
            }
            messages.push({
                from: true,
                name: results.to[i].get('from-person.value'),
                picture: APP_ENTU_URL + '/entity-' + results.to[i].get('from-person.reference') + '/picture',
                date: date,
                relative_date: relative_date,
                message: results.to[i].get('message.value'),
                message_id: results.to[i].get('_id')
            })
        }

        res.send({
            messages: messages,
            days: _.values(days)
        })
    })
})



// GET messages page
router.get('/', function(req, res, next) {
    if(!res.locals.user) {
        res.redirect('/' + res.locals.lang + '/signin')
        next(null)
        return
    }

    res.render('messages')
})



// GET messages page
router.get('/:id', function(req, res, next) {
    if(!res.locals.user) {
        res.redirect('/' + res.locals.lang + '/signin')
        next(null)
        return
    }

    res.render('messages')
})



// Create request/offer
router.post('/:id', function(req, res, next) {
    if(!res.locals.user || !req.params.id) {
        res.status(403).send()
        return
    }

    var properties = req.body
    properties['from-person'] = res.locals.user.id
    properties['to-person'] = req.params.id
    properties['participants'] = 'from.' + res.locals.user.id + '.to.' + req.params.id + '.'

    entu.add(APP_ENTU_USER, 'message', properties, null, null, function(error, new_id) {
        if(error) return next(error)

        async.waterfall([
            function(callback) {
                entu.rights(new_id, res.locals.user.id, 'owner', null, null, callback)
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
                        res.locals.t('message.email-message', res.locals.user.id),
                        'message',
                        res.locals.user.id,
                        res.locals.user.token,
                        callback
                    )
                } else {
                    callback(null)
                }
            }
        ],
        function(err, results) {
            if(err) return next(err)

            var date = moment.utc().tz(APP_TIMEZONE).calendar()
            var relative_date = moment.utc().tz(APP_TIMEZONE).fromNow()
            res.send({
                day: {
                    date: date,
                    relative_date: relative_date,
                    ordinal: new_id
                },
                message: {
                    from: true,
                    date: date,
                    relative_date: relative_date,
                    message: req.body.message,
                    message_id: new_id
                }
            })
        })
    })
})



module.exports = router
